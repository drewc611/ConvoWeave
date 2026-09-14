import { createHash } from 'node:crypto';
import {
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  accountPrincipalKey,
  normalizeAccountSnapshot,
  summarizeAccountThread,
} from './accountStore.mjs';

function objectKey(accountKey, threadId) {
  const threadHash = createHash('sha256').update(threadId).digest('hex');
  return `accounts/${accountKey}/threads/${threadHash}.json`;
}

function stringAttribute(item, name) {
  return item?.[name]?.S;
}

function indexSummary(item) {
  const countsRaw = stringAttribute(item, 'Counts');
  let counts = { decisions: 0, commitments: 0, assumptions: 0, meetings: 0 };
  if (countsRaw) {
    try { counts = JSON.parse(countsRaw); } catch { /* retain safe defaults */ }
  }
  return {
    id: stringAttribute(item, 'ThreadId'),
    title: stringAttribute(item, 'Title') ?? 'Untitled thread',
    updatedAt: stringAttribute(item, 'UpdatedAt'),
    counts,
  };
}

async function bodyToString(body) {
  if (!body) throw new Error('account-snapshot-body-missing');
  if (typeof body.transformToString === 'function') return body.transformToString('utf-8');
  const chunks = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

export function createAwsAccountStore({ tableName, bucketName, region, dynamoClient, s3Client }) {
  if (!tableName || !bucketName) throw new Error('AWS account store requires tableName and bucketName.');
  const dynamo = dynamoClient ?? new DynamoDBClient({ region });
  const s3 = s3Client ?? new S3Client({ region });

  return {
    kind: 'aws-dynamodb-s3',
    async ready() {
      await Promise.all([
        dynamo.send(new DescribeTableCommand({ TableName: tableName })),
        s3.send(new HeadBucketCommand({ Bucket: bucketName })),
      ]);
      return true;
    },
    async listThreads(principal) {
      const accountKey = accountPrincipalKey(principal);
      const output = await dynamo.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'AccountKey = :accountKey',
        ExpressionAttributeValues: { ':accountKey': { S: accountKey } },
        ConsistentRead: false,
      }));
      return (output.Items ?? [])
        .map(indexSummary)
        .filter((item) => typeof item.id === 'string')
        .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')));
    },
    async getThread(principal, threadId) {
      const accountKey = accountPrincipalKey(principal);
      const output = await dynamo.send(new GetItemCommand({
        TableName: tableName,
        Key: { AccountKey: { S: accountKey }, ThreadId: { S: threadId } },
        ConsistentRead: true,
      }));
      const key = stringAttribute(output.Item, 'ObjectKey');
      if (!key) return null;
      const object = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
      return JSON.parse(await bodyToString(object.Body));
    },
    async putThread(principal, snapshot) {
      const normalized = normalizeAccountSnapshot(snapshot);
      const accountKey = accountPrincipalKey(principal);
      const key = objectKey(accountKey, normalized.thread.id);
      const summary = summarizeAccountThread(normalized);
      await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: JSON.stringify(normalized),
        ContentType: 'application/json',
        CacheControl: 'no-store',
        ServerSideEncryption: 'AES256',
      }));
      await dynamo.send(new PutItemCommand({
        TableName: tableName,
        Item: {
          AccountKey: { S: accountKey },
          ThreadId: { S: normalized.thread.id },
          Title: { S: normalized.thread.title },
          UpdatedAt: { S: normalized.thread.updatedAt ?? normalized.syncedAt },
          Counts: { S: JSON.stringify(summary.counts) },
          ObjectKey: { S: key },
        },
      }));
      return structuredClone(normalized);
    },
    async deleteThread(principal, threadId) {
      const accountKey = accountPrincipalKey(principal);
      const existing = await dynamo.send(new GetItemCommand({
        TableName: tableName,
        Key: { AccountKey: { S: accountKey }, ThreadId: { S: threadId } },
        ConsistentRead: true,
      }));
      const key = stringAttribute(existing.Item, 'ObjectKey');
      if (!key) return false;
      await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
      await dynamo.send(new DeleteItemCommand({
        TableName: tableName,
        Key: { AccountKey: { S: accountKey }, ThreadId: { S: threadId } },
      }));
      return true;
    },
  };
}

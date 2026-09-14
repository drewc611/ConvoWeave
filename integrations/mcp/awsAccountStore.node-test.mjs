import assert from 'node:assert/strict';
import test from 'node:test';
import { createAwsAccountStore } from './awsAccountStore.mjs';

function fakeAws() {
  const rows = new Map();
  const objects = new Map();
  const keyFor = (input) => `${input.Key.AccountKey.S}:${input.Key.ThreadId.S}`;

  const dynamoClient = {
    async send(command) {
      const name = command.constructor.name;
      const input = command.input;
      if (name === 'DescribeTableCommand') return { Table: { TableName: input.TableName } };
      if (name === 'PutItemCommand') {
        rows.set(`${input.Item.AccountKey.S}:${input.Item.ThreadId.S}`, structuredClone(input.Item));
        return {};
      }
      if (name === 'GetItemCommand') return { Item: structuredClone(rows.get(keyFor(input))) };
      if (name === 'DeleteItemCommand') { rows.delete(keyFor(input)); return {}; }
      if (name === 'QueryCommand') {
        const accountKey = input.ExpressionAttributeValues[':accountKey'].S;
        return { Items: [...rows.values()].filter((row) => row.AccountKey.S === accountKey).map((row) => structuredClone(row)) };
      }
      throw new Error(`Unexpected Dynamo command: ${name}`);
    },
  };

  const s3Client = {
    async send(command) {
      const name = command.constructor.name;
      const input = command.input;
      if (name === 'HeadBucketCommand') return {};
      if (name === 'PutObjectCommand') { objects.set(`${input.Bucket}:${input.Key}`, String(input.Body)); return {}; }
      if (name === 'GetObjectCommand') {
        const value = objects.get(`${input.Bucket}:${input.Key}`);
        if (value === undefined) throw new Error('NoSuchKey');
        return { Body: { async transformToString() { return value; } } };
      }
      if (name === 'DeleteObjectCommand') { objects.delete(`${input.Bucket}:${input.Key}`); return {}; }
      throw new Error(`Unexpected S3 command: ${name}`);
    },
  };

  return { dynamoClient, s3Client, rows, objects };
}

function snapshot(id, title = 'Launch') {
  return {
    thread: { id, title, createdAt: '2026-09-14T00:00:00Z', updatedAt: '2026-09-14T00:00:00Z' },
    decisions: [{ id: `d-${id}`, statement: 'Ship the preview.', status: 'active' }],
    commitments: [],
    assumptions: [],
    meetings: [{ id: `m-${id}`, title: 'Planning', status: 'complete' }],
  };
}

const userA = { issuer: 'https://issuer.example', subject: 'user-a' };
const userB = { issuer: 'https://issuer.example', subject: 'user-b' };

test('AWS account store writes encrypted S3 snapshots and DynamoDB index rows', async () => {
  const fake = fakeAws();
  const store = createAwsAccountStore({ tableName: 'threads', bucketName: 'snapshots', region: 'us-east-1', ...fake });
  assert.equal(await store.ready(), true);

  const stored = await store.putThread(userA, snapshot('thread-1'));
  assert.equal(stored.thread.id, 'thread-1');
  assert.equal(fake.rows.size, 1);
  assert.equal(fake.objects.size, 1);

  const listed = await store.listThreads(userA);
  assert.equal(listed.length, 1);
  assert.equal(listed[0].title, 'Launch');
  assert.equal(listed[0].counts.decisions, 1);

  const loaded = await store.getThread(userA, 'thread-1');
  assert.equal(loaded.thread.id, 'thread-1');
  assert.equal(loaded.decisions[0].statement, 'Ship the preview.');
});

test('AWS account store isolates principals and deletes both index and object data', async () => {
  const fake = fakeAws();
  const store = createAwsAccountStore({ tableName: 'threads', bucketName: 'snapshots', ...fake });
  await store.putThread(userA, snapshot('same-thread', 'A'));
  await store.putThread(userB, snapshot('same-thread', 'B'));

  assert.equal((await store.getThread(userA, 'same-thread')).thread.title, 'A');
  assert.equal((await store.getThread(userB, 'same-thread')).thread.title, 'B');

  assert.equal(await store.deleteThread(userA, 'same-thread'), true);
  assert.equal(await store.getThread(userA, 'same-thread'), null);
  assert.equal((await store.getThread(userB, 'same-thread')).thread.title, 'B');
  assert.equal(fake.rows.size, 1);
  assert.equal(fake.objects.size, 1);
});

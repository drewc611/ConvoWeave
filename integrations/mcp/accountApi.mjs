import { hasScope } from './auth.mjs';
import { accountPrincipalFromAuthInfo } from './accountStore.mjs';

const MAX_SYNC_JSON_BYTES = 2 * 1024 * 1024;

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_SYNC_JSON_BYTES) throw new Error('request-too-large');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('invalid-json');
  }
}

function json(response, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    ...headers,
  });
  response.end(body);
}

function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return 'snapshot-required';
  if (!snapshot.thread || typeof snapshot.thread !== 'object') return 'thread-required';
  if (typeof snapshot.thread.id !== 'string' || !snapshot.thread.id.trim() || snapshot.thread.id.length > 500) return 'thread-id-invalid';
  if (typeof snapshot.thread.title !== 'string' || !snapshot.thread.title.trim() || snapshot.thread.title.length > 500) return 'thread-title-invalid';
  for (const field of ['decisions', 'commitments', 'assumptions', 'meetings']) {
    if (snapshot[field] !== undefined && !Array.isArray(snapshot[field])) return `${field}-invalid`;
    if (Array.isArray(snapshot[field]) && snapshot[field].length > 5000) return `${field}-too-large`;
  }
  if (Object.hasOwn(snapshot, 'privateNotes')) return 'private-notes-not-syncable';
  return null;
}

function requireScope(response, authInfo, scope, challenge) {
  if (hasScope(authInfo, scope)) return true;
  json(response, 403, { error: { code: 'insufficient-scope', message: `Missing required scope: ${scope}` } }, { 'WWW-Authenticate': challenge({ error: 'insufficient_scope', scope }) });
  return false;
}

export async function handleAccountApi({ request, response, url, authInfo, accountStore, challenge }) {
  if (!url.pathname.startsWith('/v1/account/')) return false;
  const principal = accountPrincipalFromAuthInfo(authInfo);

  if (request.method === 'GET' && url.pathname === '/v1/account/threads') {
    if (!requireScope(response, authInfo, 'convoweave.read', challenge)) return true;
    json(response, 200, { threads: await accountStore.listThreads(principal) });
    return true;
  }

  if (url.pathname.startsWith('/v1/account/threads/')) {
    const threadId = decodeURIComponent(url.pathname.slice('/v1/account/threads/'.length));
    if (!threadId || threadId.length > 500) {
      json(response, 400, { error: { code: 'invalid-thread-id', message: 'Thread id is required and must be 500 characters or fewer.' } });
      return true;
    }

    if (request.method === 'GET') {
      if (!requireScope(response, authInfo, 'convoweave.read', challenge)) return true;
      const snapshot = await accountStore.getThread(principal, threadId);
      if (!snapshot) {
        json(response, 404, { error: { code: 'thread-not-found', message: 'Thread not found.' } });
        return true;
      }
      json(response, 200, snapshot);
      return true;
    }

    if (request.method === 'PUT') {
      if (!requireScope(response, authInfo, 'convoweave.write', challenge)) return true;
      let input;
      try { input = await readJson(request); }
      catch (error) {
        if (error instanceof Error && error.message === 'request-too-large') json(response, 413, { error: { code: 'request-too-large', message: 'Sync payload exceeds 2 MiB.' } });
        else json(response, 400, { error: { code: 'invalid-json', message: 'Request body must contain valid JSON.' } });
        return true;
      }
      if (input?.thread?.id !== threadId) {
        json(response, 409, { error: { code: 'thread-id-mismatch', message: 'Path thread id must match snapshot.thread.id.' } });
        return true;
      }
      const validationError = validateSnapshot(input);
      if (validationError) {
        json(response, 400, { error: { code: validationError, message: 'Thread snapshot is invalid or contains data that is not syncable.' } });
        return true;
      }
      const stored = await accountStore.putThread(principal, input);
      json(response, 200, stored);
      return true;
    }

    if (request.method === 'DELETE') {
      if (!requireScope(response, authInfo, 'convoweave.write', challenge)) return true;
      const deleted = await accountStore.deleteThread(principal, threadId);
      if (!deleted) {
        json(response, 404, { error: { code: 'thread-not-found', message: 'Thread not found.' } });
        return true;
      }
      response.writeHead(204, { 'Cache-Control': 'no-store' });
      response.end();
      return true;
    }
  }

  json(response, 404, { error: { code: 'not-found', message: 'Account endpoint not found.' } });
  return true;
}

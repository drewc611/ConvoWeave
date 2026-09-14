import assert from 'node:assert/strict';
import test from 'node:test';
import { createInMemoryAccountStore } from './accountStore.mjs';
import { createMcpAuthVerifier, loadMcpAuthConfig } from './auth.mjs';
import { createConvoWeaveHttpServer } from './server.mjs';

async function withServer(run) {
  const authConfig = loadMcpAuthConfig({
    CONVOWEAVE_MCP_AUTH_MODE: 'development-token',
    CONVOWEAVE_MCP_DEV_TOKEN: 'test-token',
    CONVOWEAVE_MCP_PUBLIC_BASE_URL: 'https://mcp.example.test',
    CONVOWEAVE_ACCOUNT_STORE_MODE: 'memory',
  });
  const server = createConvoWeaveHttpServer({
    authConfig,
    authVerifier: createMcpAuthVerifier(authConfig),
    accountStore: createInMemoryAccountStore(),
    logger: { error() {} },
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await server.closeMcp();
    await new Promise((resolve) => server.close(resolve));
  }
}

test('account API requires bearer authentication and scopes', async () => {
  await withServer(async (base) => {
    const unauthorized = await fetch(`${base}/v1/account/threads`);
    assert.equal(unauthorized.status, 401);
    assert.match(unauthorized.headers.get('www-authenticate') ?? '', /Bearer/);

    const snapshot = {
      thread: { id: 'thread-1', title: 'Launch' },
      decisions: [], commitments: [], assumptions: [], meetings: [],
    };
    const saved = await fetch(`${base}/v1/account/threads/thread-1`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    });
    assert.equal(saved.status, 200);

    const list = await fetch(`${base}/v1/account/threads`, { headers: { Authorization: 'Bearer test-token' } });
    assert.equal(list.status, 200);
    const payload = await list.json();
    assert.equal(payload.threads[0].id, 'thread-1');
  });
});

test('private notes are rejected from cloud sync payloads', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/v1/account/threads/thread-1`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thread: { id: 'thread-1', title: 'Launch' },
        decisions: [], commitments: [], assumptions: [], meetings: [],
        privateNotes: [{ id: 'secret', body: 'do not sync' }],
      }),
    });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.error.code, 'private-notes-not-syncable');
  });
});

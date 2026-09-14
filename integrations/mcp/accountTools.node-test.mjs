import assert from 'node:assert/strict';
import test from 'node:test';
import { createInMemoryAccountStore } from './accountStore.mjs';
import { createAccountToolHandlers } from './accountTools.mjs';

function auth(subject, scopes) {
  return { token: 'x', clientId: 'test', scopes, expiresAt: 9999999999, extra: { subject, issuer: 'https://issuer.example' } };
}

const snapshot = {
  thread: { id: 'thread-1', title: 'Roadmap' },
  decisions: [{ id: 'd1', statement: 'Use MCP', status: 'active' }],
  commitments: [{ id: 'c1', statement: 'Ship adapter', status: 'open' }],
  assumptions: [],
  meetings: [],
};

test('account tools isolate users and enforce scopes', async () => {
  const store = createInMemoryAccountStore();
  const alice = createAccountToolHandlers({ authInfo: auth('alice', ['convoweave.read', 'convoweave.write']), accountStore: store });
  const bob = createAccountToolHandlers({ authInfo: auth('bob', ['convoweave.read']), accountStore: store });
  await alice.upsertThread({ snapshot });
  assert.equal((await alice.listThreads()).threads.length, 1);
  assert.equal((await bob.listThreads()).threads.length, 0);
  await assert.rejects(() => bob.upsertThread({ snapshot }), /convoweave.write/);
});

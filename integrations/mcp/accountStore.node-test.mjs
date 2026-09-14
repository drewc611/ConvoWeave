import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createFileAccountStore, createInMemoryAccountStore } from './accountStore.mjs';

const alice = { issuer: 'https://issuer.example', subject: 'alice' };
const bob = { issuer: 'https://issuer.example', subject: 'bob' };
const snapshot = {
  thread: { id: 'thread-1', title: 'Launch' },
  decisions: [{ id: 'decision-1', statement: 'Ship Friday', status: 'active' }],
  commitments: [],
  assumptions: [],
  meetings: [{ id: 'meeting-1', title: 'Kickoff', status: 'complete' }],
};

test('in-memory account store isolates principals', async () => {
  const store = createInMemoryAccountStore();
  await store.putThread(alice, snapshot);
  assert.equal((await store.listThreads(alice)).length, 1);
  assert.equal((await store.listThreads(bob)).length, 0);
  assert.equal(await store.getThread(bob, 'thread-1'), null);
});

test('filesystem account store survives re-instantiation', async () => {
  const root = await mkdtemp(join(tmpdir(), 'convoweave-account-'));
  try {
    const first = createFileAccountStore(root);
    await first.putThread(alice, snapshot);
    const second = createFileAccountStore(root);
    const loaded = await second.getThread(alice, 'thread-1');
    assert.equal(loaded.thread.title, 'Launch');
    assert.equal(loaded.decisions[0].statement, 'Ship Friday');
    assert.equal((await second.listThreads(bob)).length, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

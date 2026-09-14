import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createFileAudioStore } from './audioStore.mjs';
import { createFileSessionStore, hashUploadToken } from './sessionStore.mjs';

async function withTempRoot(run) {
  const root = await mkdtemp(join(tmpdir(), 'convoweave-storage-'));
  try {
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('filesystem session store survives re-instantiation and never persists raw upload capability', async () => {
  await withTempRoot(async (root) => {
    const token = 'raw-one-time-upload-capability';
    const first = createFileSessionStore(root);
    await first.put({
      id: 'session-1',
      meetingId: 'meeting-1',
      status: 'created',
      uploadTokenHash: hashUploadToken(token),
    });

    const second = createFileSessionStore(root);
    const restored = await second.get('session-1');
    assert.equal(restored?.meetingId, 'meeting-1');
    assert.equal(restored?.uploadTokenHash, hashUploadToken(token));

    const byCapability = await second.findByUploadToken(token);
    assert.equal(byCapability?.id, 'session-1');

    const raw = await readFile(join(root, 'sessions', 'session-1.json'), 'utf8');
    assert.equal(raw.includes(token), false);
    assert.equal(raw.includes(hashUploadToken(token)), true);
  });
});

test('filesystem audio store uses private files and supports deletion', async () => {
  await withTempRoot(async (root) => {
    const store = createFileAudioStore(root);
    const ref = await store.write('session-1', Buffer.from('private-audio-bytes'));

    assert.equal(await store.exists(ref), true);
    assert.equal((await store.read(ref)).toString('utf8'), 'private-audio-bytes');

    const file = await stat(join(root, 'audio', ref.key));
    assert.equal(file.mode & 0o077, 0, 'audio files must not be group/world accessible');

    await store.remove(ref);
    assert.equal(await store.exists(ref), false);
  });
});

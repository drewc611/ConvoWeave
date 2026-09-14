import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createBackendServer } from './server.mjs';
import { createFileAudioStore } from './storage/audioStore.mjs';
import { createFileSessionStore } from './storage/sessionStore.mjs';

const authToken = 'persistence-test-token';

function config(root, audioRetention = 'delete-after-processing') {
  return {
    environment: 'preview',
    authMode: 'development-token',
    devToken: authToken,
    processingProvider: 'test',
    host: '127.0.0.1',
    port: 0,
    publicBaseUrl: undefined,
    storage: {
      mode: 'filesystem',
      dataDir: root,
      audioRetention,
    },
  };
}

function processor() {
  return {
    name: 'persistence-test-provider',
    async ready() { return true; },
    async process({ session, audio }) {
      return {
        transcript: {
          meetingId: session.meetingId,
          segments: [{
            id: `${session.meetingId}:segment:1`,
            meetingId: session.meetingId,
            speakerId: 'test',
            startMs: 0,
            endMs: session.durationMs ?? 0,
            text: `processed ${audio.length} bytes`,
          }],
        },
        review: {
          id: session.meetingId,
          meetingId: session.meetingId,
          transcript: {
            meetingId: session.meetingId,
            segments: [],
          },
          proposals: [],
          updatedAt: '2026-09-14T00:00:00Z',
        },
      };
    },
  };
}

async function withTempRoot(run) {
  const root = await mkdtemp(join(tmpdir(), 'convoweave-persistence-'));
  try {
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function start(root, audioRetention = 'delete-after-processing') {
  const sessionStore = createFileSessionStore(root);
  const audioStore = createFileAudioStore(root);
  const server = createBackendServer({
    config: config(root, audioRetention),
    processor: processor(),
    sessionStore,
    audioStore,
    logger: { info() {}, error() {} },
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address === 'object');
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
    sessionStore,
    audioStore,
  };
}

async function close(server) {
  server.close();
  await once(server, 'close');
}

async function createAndUpload(baseUrl, meetingId = 'meeting-restart') {
  const created = await fetch(`${baseUrl}/v1/processing-sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      meetingId,
      threadId: 'thread-1',
      uploadScope: 'audio-and-transcript',
      approvedAt: '2026-09-14T00:00:00Z',
      durationMs: 3210,
    }),
  });
  assert.equal(created.status, 201);
  const session = await created.json();

  const uploaded = await fetch(session.audioUploadUrl, {
    method: 'PUT',
    body: Buffer.from('restart-safe-audio'),
  });
  assert.equal(uploaded.status, 204);
  return session;
}

test('completed processing session survives backend restart', async () => {
  await withTempRoot(async (root) => {
    const first = await start(root);
    const session = await createAndUpload(first.baseUrl);
    await close(first.server);

    const second = await start(root);
    try {
      const response = await fetch(`${second.baseUrl}/v1/processing-sessions/${session.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.transcript.meetingId, 'meeting-restart');
      assert.match(result.transcript.segments[0].text, /processed \d+ bytes/);
    } finally {
      await close(second.server);
    }
  });
});

test('delete-after-processing removes raw audio and persists deletion metadata', async () => {
  await withTempRoot(async (root) => {
    const running = await start(root, 'delete-after-processing');
    try {
      const session = await createAndUpload(running.baseUrl, 'meeting-delete');
      const persisted = await running.sessionStore.get(session.id);
      assert.equal(persisted?.status, 'ready');
      assert.equal(persisted?.audioRef, undefined);
      assert.equal(typeof persisted?.audioDeletedAt, 'string');

      const audioDir = join(root, 'audio');
      const remaining = await readdir(audioDir);
      assert.equal(remaining.length, 0);
    } finally {
      await close(running.server);
    }
  });
});

test('retain-preview keeps raw audio only when explicitly configured', async () => {
  await withTempRoot(async (root) => {
    const running = await start(root, 'retain-preview');
    try {
      const session = await createAndUpload(running.baseUrl, 'meeting-retain');
      const persisted = await running.sessionStore.get(session.id);
      assert.equal(persisted?.status, 'ready');
      assert.ok(persisted?.audioRef);
      assert.equal(await running.audioStore.exists(persisted.audioRef), true);
    } finally {
      await close(running.server);
    }
  });
});

test('processing state with retained audio recovers on first poll after restart', async () => {
  await withTempRoot(async (root) => {
    const sessionStore = createFileSessionStore(root);
    const audioStore = createFileAudioStore(root);
    const audioRef = await audioStore.write('session-recover', Buffer.from('recover-me'));
    await sessionStore.put({
      id: 'session-recover',
      meetingId: 'meeting-recover',
      durationMs: 1000,
      uploadScope: 'audio-and-transcript',
      approvedAt: '2026-09-14T00:00:00Z',
      status: 'processing',
      createdAt: '2026-09-14T00:00:00Z',
      uploadConsumedAt: '2026-09-14T00:00:01Z',
      audioRef,
    });

    const running = await start(root, 'delete-after-processing');
    try {
      const response = await fetch(`${running.baseUrl}/v1/processing-sessions/session-recover`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.transcript.meetingId, 'meeting-recover');

      const persisted = await running.sessionStore.get('session-recover');
      assert.equal(persisted?.status, 'ready');
      assert.equal(persisted?.audioRef, undefined);
      assert.equal(await audioStore.exists(audioRef), false);
    } finally {
      await close(running.server);
    }
  });
});

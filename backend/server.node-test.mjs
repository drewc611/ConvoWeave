import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createBackendServer } from './server.mjs';

async function withServer(run) {
  const events = [];
  const server = createBackendServer({
    devToken: 'development-test-token',
    logger: {
      info(event, details) { events.push({ level: 'info', event, details }); },
      error(event, details) { events.push({ level: 'error', event, details }); },
    },
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address === 'object');
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await run({ baseUrl, events });
  } finally {
    server.close();
    await once(server, 'close');
  }
}

async function createSession(baseUrl) {
  const response = await fetch(`${baseUrl}/v1/processing-sessions`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer development-test-token',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      meetingId: 'meeting-1',
      threadId: 'thread-1',
      uploadScope: 'audio-and-transcript',
      approvedAt: '2026-09-13T18:00:00-04:00',
      durationMs: 12000,
    }),
  });
  assert.equal(response.status, 201);
  return response.json();
}

test('health endpoint does not require bearer authentication', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/healthz`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  });
});

test('processing session creation requires backend authentication', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/v1/processing-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId: 'meeting-1', uploadScope: 'audio-and-transcript' }),
    });
    assert.equal(response.status, 401);
  });
});

test('one-time upload URL moves session from pending to evidence-backed ready result', async () => {
  await withServer(async ({ baseUrl, events }) => {
    const session = await createSession(baseUrl);
    assert.equal(session.meetingId, 'meeting-1');
    assert.equal(session.status, 'created');
    assert.match(session.audioUploadUrl, /\/v1\/uploads\//);

    const pending = await fetch(`${baseUrl}/v1/processing-sessions/${session.id}`, {
      headers: { Authorization: 'Bearer development-test-token' },
    });
    assert.equal(pending.status, 202);

    const upload = await fetch(session.audioUploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'audio/mp4' },
      body: Buffer.from('not-real-audio-test-bytes'),
    });
    assert.equal(upload.status, 204);

    const resultResponse = await fetch(`${baseUrl}/v1/processing-sessions/${session.id}`, {
      headers: { Authorization: 'Bearer development-test-token' },
    });
    assert.equal(resultResponse.status, 200);
    const result = await resultResponse.json();
    assert.equal(result.transcript.meetingId, 'meeting-1');
    assert.equal(result.review.meetingId, 'meeting-1');
    assert.equal(result.review.proposals[0].state, 'proposed');
    assert.equal(result.review.proposals[0].evidence[0].meetingId, 'meeting-1');
    assert.ok(result.review.proposals[0].evidence[0].segmentIds.length > 0);

    const reused = await fetch(session.audioUploadUrl, { method: 'PUT', body: Buffer.from('second-upload') });
    assert.equal(reused.status, 404);

    const audioEvent = events.find((entry) => entry.event === 'processing-audio-received');
    assert(audioEvent);
    assert.equal(audioEvent.details.meetingId, 'meeting-1');
    assert.equal(typeof audioEvent.details.sha256, 'string');
    assert.equal('body' in audioEvent.details, false);
  });
});

test('reference backend rejects transcript-only processing because no transcript upload endpoint exists', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/v1/processing-sessions`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer development-test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ meetingId: 'meeting-1', uploadScope: 'transcript-only' }),
    });
    assert.equal(response.status, 422);
    const body = await response.json();
    assert.equal(body.error, 'reference-backend-requires-audio');
  });
});

test('unknown upload tokens cannot create data', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/v1/uploads/not-a-real-token`, {
      method: 'PUT',
      body: Buffer.from('audio'),
    });
    assert.equal(response.status, 404);
  });
});

import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createBackendServer } from './server.mjs';

const testConfig = {
  environment: 'development',
  authMode: 'development-token',
  devToken: 'development-test-token',
  processingProvider: 'deterministic',
  host: '127.0.0.1',
  port: 8787,
  publicBaseUrl: undefined,
};

async function withServer(run, options = {}) {
  const events = [];
  const server = createBackendServer({
    config: options.config ?? testConfig,
    processor: options.processor,
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

test('health endpoint is public and returns service metadata', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/healthz`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      status: 'ok',
      service: 'convoweave-processing',
      apiVersion: 'v1',
    });
    assert.ok(response.headers.get('x-request-id'));
  });
});

test('readiness endpoint reflects provider readiness', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/readyz`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'ready');
    assert.equal(body.provider, 'deterministic');
    assert.equal(body.environment, 'development');
  });
});

test('readiness returns 503 when provider is not ready', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/readyz`);
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.status, 'not-ready');
  }, {
    processor: {
      name: 'unavailable-test-provider',
      async ready() { return false; },
      async process() { throw new Error('should-not-run'); },
    },
  });
});

test('processing session creation requires backend authentication and stable error envelope', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/v1/processing-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'request-test-1' },
      body: JSON.stringify({ meetingId: 'meeting-1', uploadScope: 'audio-and-transcript' }),
    });
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('x-request-id'), 'request-test-1');
    const body = await response.json();
    assert.deepEqual(body, {
      error: {
        code: 'unauthorized',
        message: 'Authentication is required for this endpoint.',
        requestId: 'request-test-1',
      },
    });
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
    const reusedBody = await reused.json();
    assert.equal(reusedBody.error.code, 'upload-not-found');

    const audioEvent = events.find((entry) => entry.event === 'processing-audio-received');
    assert(audioEvent);
    assert.equal(audioEvent.details.meetingId, 'meeting-1');
    assert.equal(audioEvent.details.provider, 'deterministic');
    assert.equal(typeof audioEvent.details.requestId, 'string');
    assert.equal(typeof audioEvent.details.sha256, 'string');
    assert.equal('body' in audioEvent.details, false);
  });
});

test('reference backend rejects transcript-only processing', async () => {
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
    assert.equal(body.error.code, 'reference-backend-requires-audio');
  });
});

test('unknown upload tokens cannot create data', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/v1/uploads/not-a-real-token`, {
      method: 'PUT',
      body: Buffer.from('audio'),
    });
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.error.code, 'upload-not-found');
  });
});

test('provider failures become durable failed sessions and safe 502 responses', async () => {
  await withServer(async ({ baseUrl }) => {
    const session = await createSession(baseUrl);
    const upload = await fetch(session.audioUploadUrl, {
      method: 'PUT',
      body: Buffer.from('audio'),
    });
    assert.equal(upload.status, 502);
    const uploadBody = await upload.json();
    assert.equal(uploadBody.error.code, 'processing-provider-failed');

    const result = await fetch(`${baseUrl}/v1/processing-sessions/${session.id}`, {
      headers: { Authorization: 'Bearer development-test-token' },
    });
    assert.equal(result.status, 502);
    const resultBody = await result.json();
    assert.equal(resultBody.error.code, 'processing-provider-failed');
  }, {
    processor: {
      name: 'failing-test-provider',
      async ready() { return true; },
      async process() { throw new Error('sensitive provider detail'); },
    },
  });
});

import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';

const MAX_JSON_BYTES = 64 * 1024;
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;

function json(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  response.end(body);
}

function noContent(response, status = 204) {
  response.writeHead(status, { 'Cache-Control': 'no-store' });
  response.end();
}

async function readBody(request, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('request-too-large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function safeTokenEqual(actual, expected) {
  if (!actual || !expected) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function bearerToken(request) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice('Bearer '.length);
}

function makeEvidence(meetingId, segmentId, quote, startMs, endMs) {
  return { meetingId, segmentIds: [segmentId], speakerId: 'speaker-1', startMs, endMs, quote };
}

function deterministicResult(session) {
  const segmentId = `${session.meetingId}:segment:1`;
  const text = 'Remote processing is connected. Review every generated proposal before it becomes durable meeting memory.';
  const transcript = {
    meetingId: session.meetingId,
    segments: [
      {
        id: segmentId,
        meetingId: session.meetingId,
        speakerId: 'speaker-1',
        startMs: 0,
        endMs: Math.max(3000, Math.min(session.durationMs || 3000, 12000)),
        text,
      },
    ],
  };
  const review = {
    id: session.meetingId,
    meetingId: session.meetingId,
    transcript,
    proposals: [
      {
        id: `${session.meetingId}:decision:remote-reference`,
        kind: 'decision',
        statement: 'Keep human review authoritative before remote AI output becomes durable memory.',
        confidence: 0.99,
        evidence: [makeEvidence(session.meetingId, segmentId, text, 0, transcript.segments[0].endMs)],
        state: 'proposed',
      },
    ],
    updatedAt: new Date().toISOString(),
  };
  return { transcript, review };
}

export function createBackendServer({
  devToken = process.env.CONVOWEAVE_DEV_TOKEN,
  publicBaseUrl,
  logger = console,
} = {}) {
  if (!devToken) {
    throw new Error('CONVOWEAVE_DEV_TOKEN is required. Use a development-only token supplied through the environment.');
  }

  const sessions = new Map();
  const uploadTokens = new Map();

  const server = createServer(async (request, response) => {
    try {
      const host = request.headers.host ?? '127.0.0.1';
      const url = new URL(request.url ?? '/', `http://${host}`);

      if (request.method === 'GET' && url.pathname === '/healthz') {
        json(response, 200, { status: 'ok' });
        return;
      }

      if (request.method === 'PUT' && url.pathname.startsWith('/v1/uploads/')) {
        const token = decodeURIComponent(url.pathname.slice('/v1/uploads/'.length));
        const sessionId = uploadTokens.get(token);
        if (!sessionId) {
          json(response, 404, { error: 'upload-not-found' });
          return;
        }
        const session = sessions.get(sessionId);
        if (!session || session.uploadToken !== token || session.uploadConsumedAt) {
          json(response, 410, { error: 'upload-expired' });
          return;
        }
        const audio = await readBody(request, MAX_AUDIO_BYTES);
        if (audio.length === 0) {
          json(response, 400, { error: 'empty-audio' });
          return;
        }
        session.audioBytes = audio.length;
        session.audioSha256 = createHash('sha256').update(audio).digest('hex');
        session.uploadConsumedAt = new Date().toISOString();
        session.status = 'ready';
        session.result = deterministicResult(session);
        uploadTokens.delete(token);
        logger.info?.('processing-audio-received', {
          sessionId: session.id,
          meetingId: session.meetingId,
          bytes: session.audioBytes,
          sha256: session.audioSha256,
        });
        noContent(response);
        return;
      }

      const suppliedToken = bearerToken(request);
      if (!safeTokenEqual(suppliedToken, devToken)) {
        json(response, 401, { error: 'unauthorized' });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/v1/processing-sessions') {
        const raw = await readBody(request, MAX_JSON_BYTES);
        let input;
        try {
          input = JSON.parse(raw.toString('utf8'));
        } catch {
          json(response, 400, { error: 'invalid-json' });
          return;
        }
        if (!input || typeof input.meetingId !== 'string' || input.meetingId.length === 0) {
          json(response, 400, { error: 'meeting-id-required' });
          return;
        }
        if (input.uploadScope !== 'audio-and-transcript' && input.uploadScope !== 'transcript-only') {
          json(response, 400, { error: 'invalid-upload-scope' });
          return;
        }
        if (input.uploadScope !== 'audio-and-transcript') {
          json(response, 422, { error: 'reference-backend-requires-audio', message: 'Transcript-only processing is not implemented by the development reference backend.' });
          return;
        }

        const id = randomUUID();
        const uploadToken = randomBytes(32).toString('base64url');
        const session = {
          id,
          meetingId: input.meetingId,
          threadId: typeof input.threadId === 'string' ? input.threadId : undefined,
          durationMs: Number.isFinite(input.durationMs) ? Math.max(0, input.durationMs) : 0,
          uploadScope: input.uploadScope,
          approvedAt: typeof input.approvedAt === 'string' ? input.approvedAt : null,
          status: 'created',
          createdAt: new Date().toISOString(),
          uploadToken,
        };
        sessions.set(id, session);
        uploadTokens.set(uploadToken, id);
        const origin = publicBaseUrl ?? `http://${host}`;
        json(response, 201, {
          id,
          meetingId: session.meetingId,
          status: session.status,
          audioUploadUrl: `${origin.replace(/\/$/, '')}/v1/uploads/${encodeURIComponent(uploadToken)}`,
        });
        logger.info?.('processing-session-created', { sessionId: id, meetingId: session.meetingId, uploadScope: session.uploadScope });
        return;
      }

      if (request.method === 'GET' && url.pathname.startsWith('/v1/processing-sessions/')) {
        const id = decodeURIComponent(url.pathname.slice('/v1/processing-sessions/'.length));
        const session = sessions.get(id);
        if (!session) {
          json(response, 404, { error: 'processing-session-not-found' });
          return;
        }
        if (session.status !== 'ready' || !session.result) {
          json(response, 202, { id: session.id, meetingId: session.meetingId, status: session.status });
          return;
        }
        json(response, 200, session.result);
        return;
      }

      json(response, 404, { error: 'not-found' });
    } catch (error) {
      if (error instanceof Error && error.message === 'request-too-large') {
        json(response, 413, { error: 'request-too-large' });
        return;
      }
      logger.error?.('backend-request-failed', { message: error instanceof Error ? error.message : 'unknown-error' });
      json(response, 500, { error: 'internal-error' });
    }
  });

  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number.parseInt(process.env.PORT ?? '8787', 10);
  const host = process.env.HOST ?? '127.0.0.1';
  const server = createBackendServer();
  server.listen(port, host, () => {
    console.info(`ConvoWeave reference backend listening on http://${host}:${port}`);
  });
}

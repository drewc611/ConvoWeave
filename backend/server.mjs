import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { loadBackendConfig } from './config.mjs';
import { createProcessor } from './providers/index.mjs';
import { createStorage } from './storage/index.mjs';
import { createInMemoryAudioStore } from './storage/audioStore.mjs';
import { createInMemorySessionStore, hashUploadToken } from './storage/sessionStore.mjs';

const MAX_JSON_BYTES = 64 * 1024;
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
const SERVICE_NAME = 'convoweave-processing';
const API_VERSION = 'v1';

function requestIdFor(request) {
  const supplied = request.headers['x-request-id'];
  if (typeof supplied === 'string' && supplied.trim() && supplied.length <= 128) return supplied.trim();
  return randomUUID();
}

function json(response, status, payload, requestId) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Request-Id': requestId,
  });
  response.end(body);
}

function apiError(response, status, code, message, requestId) {
  json(response, status, { error: { code, message, requestId } }, requestId);
}

function noContent(response, requestId, status = 204) {
  response.writeHead(status, { 'Cache-Control': 'no-store', 'X-Request-Id': requestId });
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

function isAuthorized(request, config) {
  if (config.authMode === 'development-token') {
    return safeTokenEqual(bearerToken(request), config.devToken);
  }
  return false;
}

export function createBackendServer({
  config = loadBackendConfig(),
  processor = createProcessor(config),
  sessionStore = createInMemorySessionStore(),
  audioStore = createInMemoryAudioStore(),
  logger = console,
} = {}) {
  const recoveryTasks = new Map();

  async function applyAudioRetention(session, requestId) {
    if (!session.audioRef || config.storage?.audioRetention !== 'delete-after-processing') return session;
    try {
      await audioStore.remove(session.audioRef);
      const updated = {
        ...session,
        audioRef: undefined,
        audioDeletedAt: new Date().toISOString(),
      };
      await sessionStore.put(updated);
      return updated;
    } catch (error) {
      logger.error?.('audio-retention-delete-failed', {
        requestId,
        sessionId: session.id,
        meetingId: session.meetingId,
        message: error instanceof Error ? error.message : 'unknown-error',
      });
      return session;
    }
  }

  async function processStoredSession(session, requestId) {
    const existing = recoveryTasks.get(session.id);
    if (existing) return existing;

    const task = (async () => {
      let current = session;
      try {
        if (!current.audioRef) throw new Error('Processing session has no retained audio object.');
        const audio = await audioStore.read(current.audioRef);
        const result = await processor.process({ session: { ...current }, audio });
        current = {
          ...current,
          result,
          status: 'ready',
          completedAt: new Date().toISOString(),
          failureCode: undefined,
        };
        await sessionStore.put(current);
      } catch (error) {
        current = {
          ...current,
          status: 'failed',
          failureCode: 'processing-provider-failed',
          failedAt: new Date().toISOString(),
        };
        await sessionStore.put(current);
        logger.error?.('processing-provider-failed', {
          requestId,
          sessionId: current.id,
          meetingId: current.meetingId,
          provider: processor.name,
          message: error instanceof Error ? error.message : 'unknown-error',
        });
        throw error;
      } finally {
        current = await applyAudioRetention(current, requestId);
      }
      return current;
    })().finally(() => recoveryTasks.delete(session.id));

    recoveryTasks.set(session.id, task);
    return task;
  }

  const server = createServer(async (request, response) => {
    const requestId = requestIdFor(request);

    try {
      const host = request.headers.host ?? '127.0.0.1';
      const url = new URL(request.url ?? '/', `http://${host}`);

      if (request.method === 'GET' && url.pathname === '/healthz') {
        json(response, 200, { status: 'ok', service: SERVICE_NAME, apiVersion: API_VERSION }, requestId);
        return;
      }

      if (request.method === 'GET' && url.pathname === '/readyz') {
        const [processorReady, sessionsReady, audioReady] = await Promise.all([
          processor.ready(),
          sessionStore.ready(),
          audioStore.ready(),
        ]);
        const ready = processorReady && sessionsReady && audioReady;
        json(response, ready ? 200 : 503, {
          status: ready ? 'ready' : 'not-ready',
          service: SERVICE_NAME,
          environment: config.environment,
          provider: processor.name,
          storage: {
            sessions: sessionStore.kind,
            audio: audioStore.kind,
          },
        }, requestId);
        return;
      }

      if (request.method === 'PUT' && url.pathname.startsWith('/v1/uploads/')) {
        const token = decodeURIComponent(url.pathname.slice('/v1/uploads/'.length));
        const session = await sessionStore.findByUploadToken(token);
        if (!session) {
          apiError(response, 404, 'upload-not-found', 'The upload capability is unknown or already consumed.', requestId);
          return;
        }
        if (session.uploadConsumedAt) {
          apiError(response, 410, 'upload-expired', 'The upload capability has expired or already been used.', requestId);
          return;
        }

        const audio = await readBody(request, MAX_AUDIO_BYTES);
        if (audio.length === 0) {
          apiError(response, 400, 'empty-audio', 'The uploaded audio payload is empty.', requestId);
          return;
        }

        const audioRef = await audioStore.write(session.id, audio);
        let processingSession = {
          ...session,
          audioBytes: audio.length,
          audioSha256: createHash('sha256').update(audio).digest('hex'),
          audioRef,
          uploadConsumedAt: new Date().toISOString(),
          uploadTokenHash: undefined,
          status: 'processing',
        };
        await sessionStore.put(processingSession);

        logger.info?.('processing-audio-received', {
          requestId,
          sessionId: processingSession.id,
          meetingId: processingSession.meetingId,
          bytes: processingSession.audioBytes,
          sha256: processingSession.audioSha256,
          provider: processor.name,
          audioStore: audioStore.kind,
        });

        try {
          processingSession = await processStoredSession(processingSession, requestId);
        } catch {
          apiError(response, 502, 'processing-provider-failed', 'The processing provider could not complete this meeting.', requestId);
          return;
        }

        noContent(response, requestId);
        return;
      }

      if (!isAuthorized(request, config)) {
        apiError(response, 401, 'unauthorized', 'Authentication is required for this endpoint.', requestId);
        return;
      }

      if (request.method === 'POST' && url.pathname === '/v1/processing-sessions') {
        const raw = await readBody(request, MAX_JSON_BYTES);
        let input;
        try {
          input = JSON.parse(raw.toString('utf8'));
        } catch {
          apiError(response, 400, 'invalid-json', 'Request body must contain valid JSON.', requestId);
          return;
        }

        if (!input || typeof input.meetingId !== 'string' || input.meetingId.trim().length === 0) {
          apiError(response, 400, 'meeting-id-required', 'meetingId is required.', requestId);
          return;
        }
        if (input.uploadScope !== 'audio-and-transcript' && input.uploadScope !== 'transcript-only') {
          apiError(response, 400, 'invalid-upload-scope', 'uploadScope must be audio-and-transcript or transcript-only.', requestId);
          return;
        }
        if (input.uploadScope !== 'audio-and-transcript') {
          apiError(response, 422, 'reference-backend-requires-audio', 'Transcript-only processing is not implemented by this provider.', requestId);
          return;
        }

        const id = randomUUID();
        const uploadToken = randomBytes(32).toString('base64url');
        const session = {
          id,
          meetingId: input.meetingId.trim(),
          threadId: typeof input.threadId === 'string' ? input.threadId : undefined,
          durationMs: Number.isFinite(input.durationMs) ? Math.max(0, input.durationMs) : 0,
          uploadScope: input.uploadScope,
          approvedAt: typeof input.approvedAt === 'string' ? input.approvedAt : null,
          status: 'created',
          createdAt: new Date().toISOString(),
          uploadTokenHash: hashUploadToken(uploadToken),
        };
        await sessionStore.put(session);

        const origin = config.publicBaseUrl ?? `http://${host}`;
        json(response, 201, {
          id,
          meetingId: session.meetingId,
          status: session.status,
          audioUploadUrl: `${origin.replace(/\/$/, '')}/v1/uploads/${encodeURIComponent(uploadToken)}`,
        }, requestId);
        logger.info?.('processing-session-created', {
          requestId,
          sessionId: id,
          meetingId: session.meetingId,
          uploadScope: session.uploadScope,
          provider: processor.name,
          sessionStore: sessionStore.kind,
        });
        return;
      }

      if (request.method === 'GET' && url.pathname.startsWith('/v1/processing-sessions/')) {
        const id = decodeURIComponent(url.pathname.slice('/v1/processing-sessions/'.length));
        let session = await sessionStore.get(id);
        if (!session) {
          apiError(response, 404, 'processing-session-not-found', 'The processing session does not exist.', requestId);
          return;
        }

        if (session.status === 'processing' && session.audioRef) {
          try {
            session = await processStoredSession(session, requestId);
          } catch {
            session = await sessionStore.get(id) ?? session;
          }
        }

        if (session.status === 'failed') {
          apiError(response, 502, session.failureCode ?? 'processing-failed', 'The processing session failed.', requestId);
          return;
        }
        if (session.status !== 'ready' || !session.result) {
          json(response, 202, { id: session.id, meetingId: session.meetingId, status: session.status }, requestId);
          return;
        }
        json(response, 200, session.result, requestId);
        return;
      }

      apiError(response, 404, 'not-found', 'The requested endpoint does not exist.', requestId);
    } catch (error) {
      if (error instanceof Error && error.message === 'request-too-large') {
        apiError(response, 413, 'request-too-large', 'The request exceeds the allowed size.', requestId);
        return;
      }
      logger.error?.('backend-request-failed', {
        requestId,
        message: error instanceof Error ? error.message : 'unknown-error',
      });
      apiError(response, 500, 'internal-error', 'An unexpected server error occurred.', requestId);
    }
  });

  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadBackendConfig();
  const processor = createProcessor(config);
  const storage = createStorage(config);
  const server = createBackendServer({ config, processor, ...storage });
  server.listen(config.port, config.host, () => {
    console.info(`${SERVICE_NAME} listening on http://${config.host}:${config.port} (${config.environment}, ${processor.name}, ${config.storage.mode})`);
  });
}

import { createServer } from 'node:http';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import * as z from 'zod/v4';
import { handleAccountApi } from './accountApi.mjs';
import { createFileAccountStore, createInMemoryAccountStore } from './accountStore.mjs';
import { createAccountToolHandlers } from './accountTools.mjs';
import {
  bearerChallenge,
  bearerTokenFromHeader,
  createMcpAuthVerifier,
  loadMcpAuthConfig,
  oauthProtectedResourceMetadata,
} from './auth.mjs';
import { capabilities, explainChanges, prepareBrief, structureMeeting } from './tools.mjs';

const DEFAULT_PORT = 8790;
const DEFAULT_HOST = '0.0.0.0';

const extractedItem = z.object({
  id: z.string().optional(),
  statement: z.string().min(1).max(4000),
  evidenceQuote: z.string().min(1).max(4000),
  confidence: z.number().min(0).max(1).optional(),
  owner: z.string().max(500).optional(),
  dueAt: z.string().max(200).optional(),
  rationale: z.string().max(4000).optional(),
});

const stateItem = z.object({
  id: z.string().min(1).max(500),
  statement: z.string().max(4000).optional(),
  status: z.string().max(100).optional(),
  dueAt: z.string().max(200).optional(),
  owner: z.string().max(500).optional(),
}).passthrough();

const threadState = z.object({
  decisions: z.array(stateItem).default([]),
  commitments: z.array(stateItem).default([]),
  assumptions: z.array(stateItem).default([]),
});

const syncThread = z.object({
  id: z.string().min(1).max(500),
  title: z.string().min(1).max(500),
  createdAt: z.string().max(200).optional(),
  updatedAt: z.string().max(200).optional(),
}).passthrough();

const meetingSummary = z.object({
  id: z.string().min(1).max(500),
  title: z.string().max(500).optional(),
  startedAt: z.string().max(200).optional(),
  endedAt: z.string().max(200).optional(),
  status: z.string().max(100).optional(),
  summary: z.string().max(20000).optional(),
}).passthrough();

const accountSnapshot = z.object({
  thread: syncThread,
  decisions: z.array(stateItem).max(5000).default([]),
  commitments: z.array(stateItem).max(5000).default([]),
  assumptions: z.array(stateItem).max(5000).default([]),
  meetings: z.array(meetingSummary).max(5000).default([]),
}).strict();

function toolResult(payload) {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

function createAccountStore(config) {
  return config.accountStoreMode === 'memory'
    ? createInMemoryAccountStore()
    : createFileAccountStore(config.dataDir);
}

export function createConvoWeaveMcpServer({ authInfo, accountStore = createInMemoryAccountStore() } = {}) {
  const server = new McpServer({ name: 'convoweave', version: '1.1.0' });

  server.registerTool('convoweave_capabilities', {
    title: 'ConvoWeave capabilities',
    description: 'Describe the portable ConvoWeave meeting-memory workflows available through this MCP server.',
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false },
  }, async () => toolResult(capabilities()));

  server.registerTool('convoweave_structure_meeting', {
    title: 'Structure meeting memory',
    description: 'Normalize host-extracted meeting decisions, commitments, and assumptions into source-backed ConvoWeave proposals. Every item must include an exact evidence quote from the supplied notes.',
    inputSchema: z.object({
      meetingId: z.string().min(1).max(500),
      threadId: z.string().max(500).optional(),
      title: z.string().max(500).optional(),
      notes: z.string().min(1).max(200000),
      decisions: z.array(extractedItem).default([]),
      commitments: z.array(extractedItem).default([]),
      assumptions: z.array(extractedItem).default([]),
    }),
    annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false },
  }, async (input) => toolResult(structureMeeting(input)));

  server.registerTool('convoweave_prepare_brief', {
    title: 'Prepare meeting brief',
    description: 'Create a deterministic pre-meeting brief from supplied ConvoWeave decision, commitment, and assumption state.',
    inputSchema: z.object({
      threadTitle: z.string().max(500).optional(),
      decisions: z.array(stateItem).default([]),
      commitments: z.array(stateItem).default([]),
      assumptions: z.array(stateItem).default([]),
    }),
    annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false },
  }, async (input) => toolResult(prepareBrief(input)));

  server.registerTool('convoweave_explain_changes', {
    title: 'Explain meeting-state changes',
    description: 'Compare prior and current structured meeting state and return added, changed, and removed decisions, commitments, and assumptions.',
    inputSchema: z.object({ prior: threadState, current: threadState }),
    annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false },
  }, async (input) => toolResult(explainChanges(input)));

  const account = createAccountToolHandlers({ authInfo, accountStore });
  if (account) {
    server.registerTool('convoweave_list_threads', {
      title: 'List my ConvoWeave threads',
      description: 'List the authenticated user’s synced ConvoWeave threads. Requires convoweave.read.',
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false },
    }, async () => toolResult(await account.listThreads()));

    server.registerTool('convoweave_get_thread', {
      title: 'Read a ConvoWeave thread',
      description: 'Read one authenticated user thread with decisions, commitments, assumptions, and meeting summaries. Private Sidecar notes are never included. Requires convoweave.read.',
      inputSchema: z.object({ threadId: z.string().min(1).max(500) }),
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false },
    }, async (input) => toolResult(await account.getThread(input)));

    server.registerTool('convoweave_upsert_thread', {
      title: 'Sync a ConvoWeave thread',
      description: 'Create or replace one authenticated user thread snapshot. Private Sidecar notes are not accepted. Requires convoweave.write.',
      inputSchema: z.object({ snapshot: accountSnapshot }),
      annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: false },
    }, async (input) => toolResult(await account.upsertThread(input)));

    server.registerTool('convoweave_delete_thread', {
      title: 'Delete a synced ConvoWeave thread',
      description: 'Delete one authenticated user thread from cloud sync. Requires convoweave.write.',
      inputSchema: z.object({ threadId: z.string().min(1).max(500) }),
      annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: true },
    }, async (input) => toolResult(await account.deleteThread(input)));

    server.registerTool('convoweave_prepare_account_brief', {
      title: 'Prepare a brief from my synced thread',
      description: 'Build a deterministic pre-meeting brief from the authenticated user’s synced thread state. Requires convoweave.read.',
      inputSchema: z.object({ threadId: z.string().min(1).max(500) }),
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false },
    }, async (input) => toolResult(await account.prepareAccountBrief(input)));
  }

  return server;
}

export function createConvoWeaveHttpServer(options = {}) {
  const authConfig = options.authConfig ?? loadMcpAuthConfig();
  const authVerifier = options.authVerifier ?? createMcpAuthVerifier(authConfig);
  const accountStore = options.accountStore ?? createAccountStore(authConfig);
  const logger = options.logger ?? console;
  const mcpHandler = createMcpHandler((context) => createConvoWeaveMcpServer({
    authInfo: context.authInfo,
    accountStore,
  }));
  const nodeMcpHandler = toNodeHandler(mcpHandler);
  const challenge = (details) => bearerChallenge(authConfig, details);

  async function authenticate(request) {
    const token = bearerTokenFromHeader(request.headers.authorization);
    return authVerifier.verify(token);
  }

  const httpServer = createServer(async (request, response) => {
    try {
      const pathUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

      if (request.method === 'GET' && pathUrl.pathname === '/healthz') {
        const body = JSON.stringify({
          status: 'ok',
          service: 'convoweave-mcp',
          protocol: 'MCP 2026-07-28 + legacy stateless fallback',
          auth: authVerifier.name,
          accountStore: accountStore.kind,
        });
        response.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
        response.end(body);
        return;
      }

      if (request.method === 'GET' && (pathUrl.pathname === '/.well-known/oauth-protected-resource' || pathUrl.pathname === '/.well-known/oauth-protected-resource/mcp')) {
        const metadata = oauthProtectedResourceMetadata(authConfig);
        if (!metadata) {
          response.writeHead(404, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          response.end(JSON.stringify({ error: 'oauth-not-configured' }));
          return;
        }
        const body = JSON.stringify(metadata);
        response.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
        response.end(body);
        return;
      }

      if (pathUrl.pathname.startsWith('/v1/account/')) {
        const authInfo = await authenticate(request);
        if (!authInfo) {
          response.writeHead(401, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'WWW-Authenticate': challenge({ error: 'invalid_token' }) });
          response.end(JSON.stringify({ error: { code: 'unauthorized', message: 'Authentication is required.' } }));
          return;
        }
        await handleAccountApi({ request, response, url: pathUrl, authInfo, accountStore, challenge });
        return;
      }

      if (pathUrl.pathname !== '/mcp') {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        return;
      }

      let authInfo;
      if (authConfig.mode !== 'none') {
        authInfo = await authenticate(request);
        if (!authInfo) {
          response.writeHead(401, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'WWW-Authenticate': challenge({ error: 'invalid_token' }) });
          response.end(JSON.stringify({ error: 'unauthorized' }));
          return;
        }
      }

      if (authInfo) request.auth = authInfo;
      void nodeMcpHandler(request, response);
    } catch (error) {
      logger.error?.('mcp-request-failed', { message: error instanceof Error ? error.message : 'unknown-error' });
      if (!response.headersSent) response.writeHead(500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      if (!response.writableEnded) response.end(JSON.stringify({ error: 'internal-error' }));
    }
  });

  httpServer.accountStore = accountStore;
  httpServer.authConfig = authConfig;
  httpServer.closeMcp = () => mcpHandler.close();
  return httpServer;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = Number.parseInt(process.env.PORT ?? String(DEFAULT_PORT), 10);
  const HOST = process.env.HOST ?? DEFAULT_HOST;
  const httpServer = createConvoWeaveHttpServer();
  httpServer.listen(PORT, HOST, () => {
    console.info(`ConvoWeave MCP listening on http://${HOST}:${PORT}/mcp`);
  });

  const shutdown = async () => {
    await httpServer.closeMcp();
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

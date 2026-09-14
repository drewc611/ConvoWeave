import { createServer } from 'node:http';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import * as z from 'zod/v4';
import { capabilities, explainChanges, prepareBrief, structureMeeting } from './tools.mjs';

const PORT = Number.parseInt(process.env.PORT ?? '8790', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

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
  status: z.string().max(100),
  dueAt: z.string().max(200).optional(),
  owner: z.string().max(500).optional(),
});

const threadState = z.object({
  decisions: z.array(stateItem).default([]),
  commitments: z.array(stateItem).default([]),
  assumptions: z.array(stateItem).default([]),
});

function toolResult(payload) {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

export function createConvoWeaveMcpServer() {
  const server = new McpServer({ name: 'convoweave', version: '1.0.0' });

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

  return server;
}

export const mcpHandler = createMcpHandler(() => createConvoWeaveMcpServer());
export const nodeMcpHandler = toNodeHandler(mcpHandler);

if (import.meta.url === `file://${process.argv[1]}`) {
  const httpServer = createServer((request, response) => {
    const path = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`).pathname;
    if (request.method === 'GET' && path === '/healthz') {
      const body = JSON.stringify({ status: 'ok', service: 'convoweave-mcp', protocol: 'MCP 2026-07-28 + legacy stateless fallback' });
      response.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
      response.end(body);
      return;
    }
    if (path !== '/mcp') {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    void nodeMcpHandler(request, response);
  });

  httpServer.listen(PORT, HOST, () => {
    console.info(`ConvoWeave MCP listening on http://${HOST}:${PORT}/mcp`);
  });

  const shutdown = async () => {
    await mcpHandler.close();
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

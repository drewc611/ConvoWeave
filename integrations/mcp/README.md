# ConvoWeave MCP integration

This package exposes vendor-neutral ConvoWeave meeting-memory workflows through remote Model Context Protocol (MCP).

## Endpoint

Run locally:

```bash
cd integrations/mcp
npm install
npm test
npm start
```

- MCP: `http://localhost:8790/mcp`
- Health: `http://localhost:8790/healthz`

For hosted use, expose `/mcp` over HTTPS. Streamable HTTP is the target transport. The current MCP SDK handler also provides the SDK's stateless legacy fallback for 2025-era clients.

## Current tools

- `convoweave_capabilities`
- `convoweave_structure_meeting`
- `convoweave_prepare_brief`
- `convoweave_explain_changes`

All v1 tools are stateless and read-only from the service's perspective. They operate only on content explicitly supplied by the MCP host. They do not read the user's ConvoWeave mobile database and do not persist meeting content server-side.

`convoweave_structure_meeting` enforces source proof: every proposed decision, commitment, and assumption must include an evidence quote found in the supplied notes. Returned memory remains `proposed` until a human confirms it.

## Authentication

The v1 stateless endpoint can run without account authentication because it has no account data or durable write actions. Before adding synced ConvoWeave account tools, require OAuth/OIDC, user-scoped authorization, audit logs, deletion/retention controls, and separate read/write scopes.

Never put API keys, provider keys, access tokens, transcripts, recordings, or user data in the ChatGPT/Claude skill package.

## Platform adapters

The same remote MCP endpoint is intended for:

- ChatGPT Plugins/Apps/Skills
- Claude Connectors and Agent Skills
- other MCP-compatible hosts

Platform-specific guidance lives in `../chatgpt` and `../claude`.

# Claude integration

[![MCP Integration CI](https://github.com/drewc611/ConvoWeave/actions/workflows/mcp-ci.yml/badge.svg?branch=main)](https://github.com/drewc611/ConvoWeave/actions/workflows/mcp-ci.yml)
[![Claude Connector](https://img.shields.io/badge/Claude%20Connector-live%20preview-D97757)](https://convoweave-mcp.onrender.com/mcp)
[![Claude Plugin](https://img.shields.io/badge/Claude%20Plugin-package%20ready-D97757)](.)
[![MCP Registry](https://img.shields.io/badge/MCP%20Registry-publish%20ready-5C5CFF)](../mcp/server.registry.template.json)

ConvoWeave uses the shared remote MCP service in `integrations/mcp` and is packaged as a Claude plugin at this directory root.

## Live preview connector

- Base URL: `https://convoweave-mcp.onrender.com`
- MCP endpoint: `https://convoweave-mcp.onrender.com/mcp`
- Hosting: Render Free
- Current mode: stateless preview, no account-backed OAuth/cloud sync

The plugin `.mcp.json` points directly at the live preview MCP endpoint so the source-backed meeting tools can be tested immediately.

## Plugin package

- `.claude-plugin/plugin.json` defines the public plugin metadata.
- `.mcp.json` connects the plugin to the live ConvoWeave remote MCP preview endpoint.
- `skills/convoweave-meeting-memory/SKILL.md` teaches Claude the source-backed ConvoWeave workflows.
- `SUBMISSION.md` contains the Connector Directory and Plugin Directory reviewer packet.

Validate before submission:

```bash
claude plugin validate integrations/claude
```

## OAuth account connection

The current free preview is intentionally unauthenticated and stateless. Before enabling account-backed tools publicly:

1. Configure production OIDC, public-base URL, read/write scopes, issuer, client/audience validation and JWKS.
2. Use persistent account storage rather than Render Free memory storage.
3. Register the Claude OAuth redirect/client configuration with the identity provider.
4. Grant only the scopes required by the connection. Read tools require the configured read scope; mutating tools require the configured write scope.
5. Validate read/write behavior with non-production data before directory submission.

## Account-backed tools

Once OAuth and persistent account storage are enabled, authenticated Claude connections can use:

- `convoweave_list_threads`
- `convoweave_get_thread`
- `convoweave_prepare_account_brief`
- `convoweave_upsert_thread`
- `convoweave_delete_thread`

The service derives account identity exclusively from the verified access-token `issuer + subject`. No MCP tool accepts a user ID that could select a different account.

## Privacy boundary

Private Sidecar notes are not syncable and are not exposed by the account tools. Do not add them to connector test fixtures, logs, synced snapshots, or skill examples.

## Directory status

The live preview MCP endpoint, Claude plugin package, and reviewer packet are prepared. Final Connector Directory submission still requires an authorized Claude Team/Enterprise directory manager and the production authenticated/persistent deployment for account-backed claims. Final Plugin Directory submission requires an authenticated Claude.ai or Anthropic Console account. Do not describe either listing as approved until Anthropic accepts it.

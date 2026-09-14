# Anthropic directory submission packet

Status: live preview ready, not yet submitted or approved.

ConvoWeave is intended for two Anthropic distribution surfaces:

1. Connectors Directory: remote MCP server.
2. Plugin Directory: Claude plugin bundling the ConvoWeave meeting-memory skill and remote MCP connection.

## Live preview connector

- Preview MCP URL: `https://convoweave-mcp.onrender.com/mcp`
- Base URL: `https://convoweave-mcp.onrender.com`
- Transport: Streamable HTTP
- Hosting: Render Free
- Current mode: stateless preview without OAuth-backed ConvoWeave account access

This endpoint is suitable for validating the source-backed meeting tools and Claude plugin connection. It must not be described as the production account-sync service.

## Connector listing

**Name:** ConvoWeave

**Tagline:** Source-backed meeting memory that tracks decisions, commitments, assumptions, contradictions, and what changed.

**Description:** ConvoWeave turns meeting history into durable operational memory. It helps users retrieve decisions, prepare briefs, track commitments and assumptions, compare meeting state over time, and preserve source evidence behind important changes. Private Sidecar notes are intentionally excluded from cloud sync and connector access.

**Category:** Productivity / Collaboration

**Transport:** Streamable HTTP

**Production authentication target:** OAuth 2.0 / OIDC with scoped access tokens

**Read tools:**
- ConvoWeave capabilities
- Structure meeting memory
- Prepare meeting brief
- Explain meeting-state changes
- List my ConvoWeave threads (production authenticated mode)
- Read a ConvoWeave thread (production authenticated mode)
- Prepare a brief from my synced thread (production authenticated mode)

**Write/destructive tools:**
- Sync a ConvoWeave thread (production authenticated mode)
- Delete a synced ConvoWeave thread (production authenticated mode)

All tools include human-readable titles and MCP safety annotations.

## Required three example prompts

1. "Structure these meeting notes into decisions, commitments, assumptions, and open questions with source evidence."
2. "Compare these two meeting states and explain what changed in the decisions and commitments."
3. "Prepare a concise pre-meeting brief from this reviewed ConvoWeave meeting memory."

## Data handling

- The free preview does not provide account-backed thread storage.
- Private Sidecar notes are not accepted by sync APIs and are not exposed by connector tools.
- Production account identity is designed to come from verified OAuth issuer + subject, never a caller-supplied user ID.
- Access tokens are not stored in meeting-memory records.
- Raw mobile audio is not exposed through the account-sync MCP tools.
- Generated meeting memory remains reviewable and source-backed.

## Reviewer setup

Current preview:

- Preview MCP URL: `https://convoweave-mcp.onrender.com/mcp`
- Public repository: `https://github.com/drewc611/ConvoWeave`

Still required before production directory submission:

- Public documentation URL
- Public privacy-policy URL
- Support contact
- Production OAuth reviewer test account if account-backed tools are included
- GA date

Preview reviewer flow:

1. Connect to `https://convoweave-mcp.onrender.com/mcp`.
2. Confirm the source-backed stateless tools load.
3. Exercise the three preview prompts above.
4. Verify the tool responses do not claim access to synced ConvoWeave accounts.

Production account-backed reviewer flow must additionally verify OAuth scopes, cross-account isolation, and Private Sidecar exclusion.

## Claude plugin submission

Plugin root: `integrations/claude`

Contents:
- `.claude-plugin/plugin.json`
- `.mcp.json`
- `skills/convoweave-meeting-memory/SKILL.md`

The plugin MCP configuration now points directly at the live preview endpoint.

Before directory submission:

1. Run `claude plugin validate integrations/claude`.
2. Test install from the public GitHub repository.
3. Verify the live preview MCP tools load in Claude.
4. For any account-backed listing claims, switch to the persistent OAuth-enabled deployment and validate that flow separately.
5. Submit the public GitHub plugin path through Anthropic's plugin submission portal.

## Remaining account-holder gates

The repository and live preview endpoint are ready. Final Anthropic submission still requires:

- a Claude Team/Enterprise organization Owner or authorized directory manager for Connector Directory submission;
- an authenticated Claude.ai or Anthropic Console account for plugin submission;
- acceptance of Anthropic Software Directory Terms and Policy;
- final public support/privacy URLs and reviewer credentials for any production account-backed features.

Do not mark the connector or plugin as submitted or approved until those account-side actions have actually occurred.

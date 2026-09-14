# Anthropic directory submission packet

Status: prepared, not yet submitted.

ConvoWeave is intended for two Anthropic distribution surfaces:

1. Connectors Directory: remote MCP server.
2. Plugin Directory: Claude plugin bundling the ConvoWeave meeting-memory skill and remote MCP connection.

## Connector listing

**Name:** ConvoWeave

**Tagline:** Source-backed meeting memory that tracks decisions, commitments, assumptions, contradictions, and what changed.

**Description:** ConvoWeave turns meeting history into durable operational memory. It helps users retrieve decisions, prepare briefs, track commitments and assumptions, compare meeting state over time, and preserve source evidence behind important changes. Private Sidecar notes are intentionally excluded from cloud sync and connector access.

**Category:** Productivity / Collaboration

**Transport:** Streamable HTTP

**Authentication:** OAuth 2.0 / OIDC with scoped access tokens

**Scopes:** configured production read and write scopes. Read tools require read scope. Mutating tools require write scope.

**Read tools:**
- ConvoWeave capabilities
- Structure meeting memory
- Prepare meeting brief
- Explain meeting-state changes
- List my ConvoWeave threads
- Read a ConvoWeave thread
- Prepare a brief from my synced thread

**Write/destructive tools:**
- Sync a ConvoWeave thread
- Delete a synced ConvoWeave thread

All tools include human-readable titles and MCP safety annotations.

## Required three example prompts

1. "Show me the open commitments and unresolved assumptions in my Product Launch thread, then prepare me for the next meeting."
2. "Compare the last two meeting states and explain what changed in the decisions and commitments, with the source evidence."
3. "Save these reviewed meeting notes into my ConvoWeave thread, but do not include any Private Sidecar notes."

## Data handling

- Account identity is derived from the verified OAuth issuer + subject, never a caller-supplied user ID.
- Private Sidecar notes are not accepted by sync APIs and are not exposed by connector tools.
- Production account snapshots are designed for encrypted S3 storage with a DynamoDB metadata index.
- Access tokens are not stored in meeting-memory records.
- Raw mobile audio is not exposed through the account-sync MCP tools.
- Generated meeting memory remains reviewable and source-backed.

## Reviewer setup

Before submission, fill in:

- Production MCP URL: `PENDING_DEPLOYMENT/mcp`
- Public documentation URL: `PENDING_PUBLIC_DOCS`
- Public privacy-policy URL: `PENDING_PUBLIC_PRIVACY_URL`
- Support contact: `PENDING_SUPPORT_CONTACT`
- Reviewer test account: `PENDING_REVIEWER_ACCOUNT`
- GA date: `PENDING_GA_DATE`

Reviewer flow:

1. Connect to the production MCP URL.
2. Complete OAuth sign-in using the reviewer test account.
3. Confirm read-only tools work with read scope.
4. Confirm write tools require write scope.
5. Confirm another account cannot access the first account's threads.
6. Confirm Private Sidecar data never appears in synced thread payloads.
7. Exercise all three example prompts above.

## Claude plugin submission

Plugin root: `integrations/claude`

Contents:
- `.claude-plugin/plugin.json`
- `.mcp.json`
- `skills/convoweave-meeting-memory/SKILL.md`

Before submission:

1. Set `CONVOWEAVE_MCP_URL` to the production HTTPS `/mcp` endpoint.
2. Run `claude plugin validate integrations/claude`.
3. Test install from the public GitHub repository.
4. Verify OAuth connection and the meeting-memory skill together.
5. Submit the public GitHub plugin path through Anthropic's plugin submission portal.

## Remaining account-holder gates

The repository can prepare and validate the software, but final Anthropic submission requires:

- a live public HTTPS MCP endpoint;
- a Claude Team/Enterprise organization Owner or authorized directory manager for Connector Directory submission;
- an authenticated Claude.ai or Anthropic Console account for plugin submission;
- acceptance of Anthropic Software Directory Terms and Policy;
- final reviewer/test-account credentials and public support/privacy URLs.

Do not mark the connector or plugin as approved until Anthropic has actually accepted the listing.

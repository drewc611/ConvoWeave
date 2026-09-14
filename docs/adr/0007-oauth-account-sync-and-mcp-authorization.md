# ADR 0007: OAuth account sync and MCP authorization

## Status

Accepted for v1 implementation.

## Context

ConvoWeave now exposes the same remote MCP capability layer to ChatGPT and Claude. Stateless tools can safely operate on content supplied in the current request, but account-backed tools require a durable identity boundary so one connected user can never read or modify another user's meeting state.

The mobile app also needs a cloud-sync boundary that uses the same account identity as MCP connections. Creating separate identity systems for mobile, ChatGPT, and Claude would increase authorization risk and produce inconsistent account ownership semantics.

## Decision

Use one external OAuth/OIDC authorization server for mobile sync and authenticated MCP connections.

ConvoWeave validates access tokens but does not issue user passwords or become the system of record for primary authentication. The verified account key is derived only from the token principal:

`SHA-256(issuer + NUL + subject)`

Client-supplied user IDs are never accepted as account selectors.

### OAuth protected-resource boundary

The MCP service publishes protected-resource metadata under the standard well-known endpoint and advertises the ConvoWeave MCP resource plus supported scopes.

Initial scopes:

- `convoweave.read`
- `convoweave.write`
- `offline_access` when the authorization server and host support refresh-token flows

ChatGPT and Claude register separate OAuth clients against the same identity provider but access the same ConvoWeave resource and principal model.

### Account-backed data

Synced account state may contain:

- threads
- decisions
- commitments
- assumptions
- meeting summaries and non-private meeting metadata

Private Sidecar notes are explicitly outside the cloud-sync schema and are rejected if supplied to the REST sync API. Raw recording data is not part of this account-sync contract.

### Account-backed MCP tools

Authenticated connections may expose:

- `convoweave_list_threads`
- `convoweave_get_thread`
- `convoweave_prepare_account_brief`
- `convoweave_upsert_thread`
- `convoweave_delete_thread`

Read tools require `convoweave.read`. Write and delete tools require `convoweave.write`. Destructive tools are annotated as destructive through MCP metadata.

### Mobile sync

The mobile sync client uses the same bearer-token provider boundary as other authenticated network clients. It does not persist access or refresh tokens itself. Token storage and refresh remain the responsibility of the eventual platform identity/session layer.

### Storage

The first implementation includes in-memory and filesystem account stores so authorization, restart behavior, and cross-user isolation can be validated in preview environments.

Filesystem storage is not the final production data platform. Production deployment requires a durable encrypted account store with backup, retention, deletion, and operational recovery controls.

## Security properties

1. Account identity comes only from a verified token.
2. `issuer + subject` prevents collisions between different identity providers.
3. Cross-user access cannot be requested by passing another user's ID.
4. Read and write privileges are independently scoped.
5. Private Sidecar notes remain local/private by contract.
6. OAuth client secrets, access tokens, refresh tokens, and provider keys are never committed to mobile, skill, or repository source.
7. Marketplace hosts connect through the same authorization model rather than receiving special backdoor credentials.
8. Logs should contain request/account identifiers only when required for diagnostics and must not include meeting contents.

## Consequences

Positive:

- ChatGPT, Claude, and mobile use one account authorization model.
- User isolation is enforced at the storage boundary, not just the UI/tool layer.
- The MCP server remains vendor-neutral.
- OAuth provider choice can change without changing ConvoWeave domain models.

Tradeoffs:

- Public deployment now depends on external identity-provider configuration and OAuth client registration.
- Filesystem preview storage must be replaced or backed by production-grade storage before marketplace scale.
- Account synchronization introduces explicit privacy, retention, export, and deletion obligations.

## Follow-up

Before public marketplace rollout:

1. Deploy the MCP service on public HTTPS.
2. Configure the production OIDC issuer/audience/JWKS resource.
3. Register separate ChatGPT and Claude OAuth clients and redirect URIs.
4. Deploy durable encrypted account storage.
5. Implement production token/session handling in the mobile app.
6. Complete account deletion, export, retention, audit, and privacy-policy requirements.
7. Run cross-user authorization and marketplace-host integration tests in the deployed environment.

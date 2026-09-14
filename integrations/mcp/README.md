# ConvoWeave remote MCP integration

The ConvoWeave MCP service is the shared integration boundary for ChatGPT and Claude.

## Modes

### Stateless mode

`CONVOWEAVE_MCP_AUTH_MODE=none`

Only portable source-backed tools are available. No account data is exposed.

### Account-backed development mode

Set:

- `CONVOWEAVE_MCP_AUTH_MODE=development-token`
- `CONVOWEAVE_MCP_DEV_TOKEN=<local test token>`
- `CONVOWEAVE_MCP_PUBLIC_BASE_URL=https://your-mcp-host.example`
- `CONVOWEAVE_ACCOUNT_STORE_MODE=memory|filesystem`
- `CONVOWEAVE_ACCOUNT_DATA_DIR=.convoweave/account-data`

This is for local/preview validation only.

### OAuth/OIDC mode

Set:

- `CONVOWEAVE_MCP_AUTH_MODE=oidc`
- `CONVOWEAVE_MCP_PUBLIC_BASE_URL=https://your-mcp-host.example`
- `OIDC_ISSUER=https://identity.example`
- `OIDC_AUDIENCE=<resource audience>`
- `OIDC_JWKS_URL=https://identity.example/.../jwks.json`
- optional `OIDC_ALLOWED_ALGORITHMS`, default `RS256`

The service publishes OAuth protected-resource metadata at:

- `/.well-known/oauth-protected-resource`
- `/.well-known/oauth-protected-resource/mcp`

Advertised scopes:

- `convoweave.read`
- `convoweave.write`
- `offline_access` for hosts/providers that support refresh tokens

The authorization server itself remains the configured external OIDC provider. ConvoWeave validates its access tokens and never stores passwords.

## Account-backed tools

Authenticated connections receive:

- `convoweave_list_threads`
- `convoweave_get_thread`
- `convoweave_upsert_thread`
- `convoweave_delete_thread`
- `convoweave_prepare_account_brief`

Account data is isolated by the verified OIDC `issuer + subject`. Tool inputs cannot choose another account identifier.

## Mobile sync API

The same service exposes:

- `GET /v1/account/threads`
- `GET /v1/account/threads/:id`
- `PUT /v1/account/threads/:id`
- `DELETE /v1/account/threads/:id`

`src/services/accountSyncClient.ts` is the mobile client boundary. It requires a bearer-token provider and does not store credentials itself.

Private Sidecar notes are intentionally excluded from the sync contract and are rejected if included in a raw REST payload.

## Deployment boundary

Production/marketplace deployment still requires:

1. A public HTTPS MCP endpoint.
2. An OIDC/OAuth provider configured to issue access tokens for the ConvoWeave resource/audience.
3. Registered ChatGPT and Claude OAuth clients/redirect URIs.
4. Refresh-token/offline access enabled when the host requires persistent connectivity.
5. A durable production account store replacing or backing the filesystem preview store.
6. Privacy policy, retention policy, account deletion path, and marketplace review.

Do not commit OAuth client secrets, access tokens, refresh tokens, provider API keys, meeting content, or account data to this repository.

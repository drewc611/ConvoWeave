# ChatGPT integration

ConvoWeave uses the shared remote MCP service in `integrations/mcp`.

## Live preview MCP

- Base URL: `https://convoweave-mcp.onrender.com`
- MCP endpoint: `https://convoweave-mcp.onrender.com/mcp`
- Hosting: Render Free
- Current mode: stateless preview without account-backed OAuth/cloud sync

Use this endpoint for ChatGPT developer-mode MCP testing of the source-backed meeting tools. Do not treat it as the production synced-account service.

## OAuth account connection

For the later account-backed production connection:

1. Configure `CONVOWEAVE_MCP_AUTH_MODE=oidc` plus `CONVOWEAVE_MCP_PUBLIC_BASE_URL`, `OIDC_ISSUER`, `OIDC_AUDIENCE`, and `OIDC_JWKS_URL`.
2. Use persistent account storage.
3. Register the ChatGPT OAuth client and redirect URI with that identity provider.
4. Allow the configured ConvoWeave read/write scopes. Enable refresh/offline access when required by the host so the connection can survive access-token expiry.
5. In ChatGPT developer mode, create the MCP app using the deployed `/mcp` endpoint, complete OAuth, then scan tools.
6. Test with a non-production account before submitting or publishing.

The authenticated MCP service publishes protected-resource metadata at `/.well-known/oauth-protected-resource` so compatible hosts can discover the authorization server and scopes.

## Account-backed tools

After OAuth, ChatGPT can use:

- `convoweave_list_threads`
- `convoweave_get_thread`
- `convoweave_prepare_account_brief`
- `convoweave_upsert_thread`
- `convoweave_delete_thread`

Write/delete actions are marked as write/destructive MCP actions. ConvoWeave identifies the account only from the verified access-token principal (`issuer + subject`); tool inputs cannot choose another user ID.

## Privacy boundary

Private Sidecar notes are not part of the cloud sync schema and must never be added to marketplace fixtures, MCP tool payloads, logs, or synced account snapshots.

## Directory readiness

The live stateless preview endpoint is available for MCP/tool validation now. Before public ChatGPT App Directory submission with account-backed features, complete the current OpenAI review requirements, deploy durable authenticated account storage, publish privacy/support URLs, verify retention/account-deletion behavior, and register production OAuth redirect URIs. Marketplace publication remains an account-holder/review action.

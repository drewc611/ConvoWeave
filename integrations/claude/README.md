# Claude integration

ConvoWeave uses the shared remote MCP service in `integrations/mcp`.

## OAuth account connection

1. Deploy the ConvoWeave MCP service to a public HTTPS endpoint reachable from Anthropic's cloud infrastructure.
2. Configure `CONVOWEAVE_MCP_AUTH_MODE=oidc` plus `CONVOWEAVE_MCP_PUBLIC_BASE_URL`, `OIDC_ISSUER`, `OIDC_AUDIENCE`, and `OIDC_JWKS_URL`.
3. Register the Claude OAuth client/redirect URI with that identity provider. For Team/Enterprise custom connectors, the owner can enter the MCP URL and OAuth client settings in connector administration.
4. Grant only the scopes required by the connection: `convoweave.read` and, when write actions are intended, `convoweave.write`. Enable refresh/offline access when the identity provider and connector flow require persistent connectivity.
5. Add the remote `/mcp` URL as a custom connector, authenticate, then enable it for a test conversation.
6. Validate read/write behavior with non-production data before wider organization rollout or directory submission.

## Account-backed tools

Authenticated Claude connections can use:

- `convoweave_list_threads`
- `convoweave_get_thread`
- `convoweave_prepare_account_brief`
- `convoweave_upsert_thread`
- `convoweave_delete_thread`

The service derives account identity exclusively from the verified access-token `issuer + subject`. No MCP tool accepts a user ID that could select a different account.

## Privacy boundary

Private Sidecar notes are not syncable and are not exposed by the account tools. Do not add them to connector test fixtures, logs, synced snapshots, or skill examples.

## Connector-directory readiness

Before public or organization-wide rollout, deploy durable production account storage, complete privacy/retention/account-deletion controls, register production OAuth clients, verify consent for write/destructive tools, and complete Anthropic's current connector review or directory process. External publication remains an account-holder/owner action.

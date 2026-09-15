# ConvoWeave Public Release URLs

These URLs are served by the same free Render service as the public MCP preview.

- MCP connector: `https://convoweave-mcp.onrender.com/mcp`
- Privacy Policy: `https://convoweave-mcp.onrender.com/privacy`
- Support: `https://convoweave-mcp.onrender.com/support`
- Data & account deletion: `https://convoweave-mcp.onrender.com/account-deletion`
- Service health: `https://convoweave-mcp.onrender.com/healthz`

## Store usage

Use the Privacy Policy URL for App Store Connect and Google Play privacy metadata once the deployed page has been verified live.

Use the Support URL as the release-candidate support destination. The page routes support requests to the public GitHub issue tracker and explicitly warns users not to post meeting content or credentials.

The account-deletion page accurately states the current `0.3.0-alpha.1` behavior: the distributed alpha is local-first and the public MCP preview does not currently create durable production cloud accounts. Before persistent production account creation is enabled, add an authenticated in-app deletion path and an external deletion-request mechanism, then update the page and store declarations.

Do not claim production cloud account deletion is implemented until those account services are actually enabled and tested.

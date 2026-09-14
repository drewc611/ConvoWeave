# Free MCP deployment on Render

ConvoWeave can be deployed for zero-cost preview testing as a Render Free web service.

## What this free deployment includes

- public HTTPS endpoint supplied by Render
- `/healthz` liveness endpoint
- `/mcp` remote MCP endpoint for Claude and other MCP-compatible hosts
- stateless tools for capabilities, meeting structuring, briefs, and change explanations
- no ConvoWeave account credentials, private cloud data, or persistent server-side account storage

The free preview intentionally uses `CONVOWEAVE_MCP_AUTH_MODE=none` and `CONVOWEAVE_ACCOUNT_STORE_MODE=memory`. Account-backed tools are therefore not exposed. This is suitable for connector validation with non-sensitive notes supplied by the user or host, not for storing private meeting history.

## Deploy

The repository root contains `render.yaml`. Use the Deploy to Render button in the root README or create a Blueprint from this repository in Render.

Render builds `integrations/mcp/Dockerfile`, runs the service on its provided `PORT`, and checks `/healthz`.

After deployment, Render assigns an HTTPS origin similar to:

`https://convoweave-mcp.onrender.com`

The Claude connector URL is then:

`https://convoweave-mcp.onrender.com/mcp`

Use the actual hostname Render assigns to the service.

## Claude test

In Claude, open Customize > Connectors > Add custom connector and enter the deployed `/mcp` URL. OAuth fields are not required for this stateless preview.

Test with non-sensitive sample meeting text first. The remote server should expose the source-backed stateless ConvoWeave tools. Account-backed read/write tools are intentionally unavailable in free preview mode.

## Free-tier behavior

Render Free web services can spin down after inactivity and wake on the next request. Startup delay after sleep is expected. Free instances also have monthly usage limits and are intended for testing/hobby workloads rather than production SLAs.

## Upgrade path

When persistent account-backed ConvoWeave access is needed, enable OIDC/OAuth and durable storage on a production-capable host. The existing AWS deployment stack remains available but is not required for free connector testing.

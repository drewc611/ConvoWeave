# ChatGPT integration

ConvoWeave uses one remote MCP server plus a portable skill package.

## Current ChatGPT path

ChatGPT Plugins are the primary discovery surface. A plugin can include skills and connected apps. The Apps SDK is the recommended application packaging path and uses MCP for tools/data.

Use this repository as follows:

1. Deploy `integrations/mcp` behind a public HTTPS endpoint, for example `https://api.example.com/mcp`.
2. In ChatGPT Developer Mode, add/test the remote MCP app against that endpoint.
3. Install or upload `skills/convoweave-meeting-memory/SKILL.md` as the workflow skill during development.
4. Validate that the MCP tools are discovered and that source-proof failures are handled correctly.
5. Prepare the Plugin/App submission with the MCP connectivity details, privacy policy, support information, testing instructions, and country availability requested by the OpenAI submission flow.
6. Do not add account-data tools until OAuth/OIDC and user-scoped authorization are implemented.

## Marketplace boundary

The repository prepares the code and skill package. Publication/review in the ChatGPT Plugin Directory is an account-holder action and is subject to OpenAI review and current developer terms.

## Initial user prompts

- “ConvoWeave, turn these meeting notes into proposed decisions and commitments with evidence.”
- “Use ConvoWeave to show what changed between these two meeting states.”
- “Create a pre-meeting brief from these open commitments and assumptions.”

The v1 connector is stateless and does not expose a user's mobile ConvoWeave database.

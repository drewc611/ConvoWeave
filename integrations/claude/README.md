# Claude integration

ConvoWeave uses the same remote MCP endpoint for Claude Connectors and adds an Agent Skill for the ConvoWeave workflow.

## Connector setup

1. Deploy `integrations/mcp` behind public HTTPS, for example `https://api.example.com/mcp`.
2. In Claude Settings > Connectors, add the remote MCP server URL.
3. Enable only the ConvoWeave tools needed for the current workflow.
4. Install the skill in `skills/convoweave-meeting-memory/` through Claude Skills or the organization's managed skill deployment process.
5. Test the connector with source-backed meeting notes before directory submission.

Claude remote MCP supports tools, prompts, and resources across Claude web/desktop and supported mobile use after the connector has been configured. The v1 ConvoWeave server intentionally exposes only stateless tools and therefore does not require account OAuth yet.

## Directory path

After the hosted connector meets Anthropic's MCP directory security, privacy, and compatibility requirements, submit the remote MCP server through Anthropic's Connectors Directory review process.

## Initial user prompts

- “Use ConvoWeave to structure these notes, but only include items with exact evidence.”
- “Use ConvoWeave to prepare me for the next meeting from this current state.”
- “Compare these prior and current meeting states with ConvoWeave.”

Do not put provider keys, user credentials, recordings, or private meeting content inside the Agent Skill package.

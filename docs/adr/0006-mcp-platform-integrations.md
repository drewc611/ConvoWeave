# ADR 0006: Vendor-neutral MCP integrations for ChatGPT and Claude

## Status
Accepted

## Context
ConvoWeave needs to participate in both ChatGPT's Plugin/App/Skill ecosystem and Claude's Connector/Agent Skill ecosystem without duplicating product logic or creating separate vendor-specific backends.

Both platforms support remote Model Context Protocol (MCP). ChatGPT Apps use MCP-backed tools and plugins can package apps and skills. Claude supports remote MCP Connectors and Agent Skills.

## Decision
ConvoWeave will expose one vendor-neutral remote MCP server and package platform-specific skills around that common tool surface.

The first MCP version is stateless. It accepts only content explicitly supplied by the host and exposes deterministic/source-backed meeting-memory workflows. It does not read the user's mobile SQLite database and does not persist user meeting content.

Initial tools:

- `convoweave_capabilities`
- `convoweave_structure_meeting`
- `convoweave_prepare_brief`
- `convoweave_explain_changes`

Every structured meeting item must carry an evidence quote present in the supplied notes. Generated items remain proposals until human confirmation.

## Authentication boundary
The stateless v1 connector can remain authless because it exposes no account data or durable write action. Any future synced-account tools must add OAuth/OIDC, per-user authorization, explicit read/write scopes, audit logging, retention/deletion policy, and tenant isolation before exposure to either marketplace.

## Consequences

- ChatGPT and Claude share one tested MCP contract.
- Skills remain portable and contain no credentials or user data.
- Platform submission metadata can evolve independently of core tool behavior.
- Account-backed ConvoWeave memory remains a separate future sprint rather than being rushed into marketplace v1.

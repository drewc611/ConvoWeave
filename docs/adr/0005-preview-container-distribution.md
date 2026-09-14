# ADR 0005: Preview container distribution through GHCR

Status: Accepted

Date: 2026-09-14

## Context

The ConvoWeave backend now has provider-neutral processing, durable preview storage, and OIDC authentication boundaries. It needs a deployable artifact, but selecting a permanent cloud host would couple packaging to infrastructure before preview behavior and account choices are settled.

## Decision

Use GitHub Container Registry (GHCR) as the neutral preview distribution point for the backend image.

Container publication occurs only from trusted `main` after the repository's `Backend CI` workflow succeeds. The publish workflow checks out the exact validated commit SHA and publishes both:

- a moving `main` tag
- an immutable `sha-<commit>` tag

Deployments and rollbacks should use the immutable SHA tag. Runtime provider credentials, OIDC configuration, recordings, transcripts, and user meeting data are never baked into the image.

The portable preview runtime is documented with Docker Compose and a durable `/data/convoweave` volume. Hosting platforms may consume the same image and environment contract without changing application code.

## Consequences

Positive:

- one validated backend artifact can run on multiple container hosts
- preview deployment is independent of AWS/GCP/Azure or SaaS PaaS selection
- rollback targets are explicit and tied to source commits
- image provenance/SBOM can be attached during publishing
- runtime secrets remain outside source and image layers

Tradeoffs:

- an internet-accessible preview still requires a hosting account, HTTPS endpoint, OIDC provider, and AI-provider credential
- GHCR package permissions may require repository/package settings if an organization policy blocks package writes
- Docker Compose is a reference runtime, not the final production orchestration design

## Security

The publish workflow is triggered by successful `Backend CI` runs on `main`, not by arbitrary pull-request code. It receives package-write permission only for publication. The backend image remains runtime-configured and does not contain repository deployment secrets.

## Future work

A later infrastructure slice may deploy the same immutable image to the selected production cloud and replace filesystem storage with production database/object-storage adapters. That decision must not change the application-level `/v1` processing contract.

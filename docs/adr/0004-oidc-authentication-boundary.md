# ADR 0004: OIDC authentication boundary

Status: Accepted

Date: 2026-09-14

## Context

The preview processing backend originally supported only a shared development bearer token. That is useful for local testing but cannot identify individual users, cannot enforce session ownership, and must not be used for a public production deployment.

ConvoWeave should not couple its backend authorization model to a single identity vendor. The mobile client already accepts an access-token provider, so the backend can use standards-based token validation while the actual sign-in vendor remains replaceable.

## Decision

Support two backend authentication modes:

- `development-token` for local/development use only.
- `oidc` for preview/production identity-bearing access tokens.

OIDC mode validates JWTs against a configured issuer, audience, remote JWKS URL, expiration/not-before claims, subject, and an explicit asymmetric algorithm allowlist. JWKS retrieval is cached and bounded by configured timeout/cache/cooldown values.

Outside development, the issuer and JWKS URL must use HTTPS. Production startup requires OIDC mode.

Each processing session records only the authenticated subject identifier and issuer. The bearer token is never persisted. Authenticated reads enforce session ownership and return `403` for a different valid user.

One-time audio upload URLs remain capability URLs and do not receive the backend bearer token. Their existing single-use capability boundary is preserved.

## Security properties

- Shared development tokens cannot start a production backend.
- `none` and symmetric HMAC JWT algorithms are not accepted by the OIDC configuration.
- Token signature, issuer, audience, time validity, and subject are checked before a principal is created.
- Upstream/OIDC token details are not returned in API errors.
- Persisted session records do not contain bearer tokens.
- A valid user cannot read another user's session.

## Consequences

Positive:

- ConvoWeave can work with standards-compliant identity providers without changing route or domain code.
- Session ownership is explicit and durable.
- Mobile feature screens remain unaware of the identity vendor.

Tradeoffs:

- A real sign-in provider and mobile login UX still need to be configured before public release.
- JWKS availability becomes a runtime dependency when validating uncached keys.
- Organization/team roles are intentionally not modeled in this slice.

## Dependency

The backend uses the `jose` package for standards-compliant JWT/JWKS verification. It is pinned to an exact backend-only version and included in backend dependency auditing and SBOM generation.

## Future work

A later identity-provider integration can supply the mobile access token without changing the backend verifier contract. Team tenancy/RBAC, account lifecycle, logout/session refresh UX, and administrative roles belong in separate slices.

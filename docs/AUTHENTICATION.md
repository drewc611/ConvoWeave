# Authentication runbook

ConvoWeave keeps identity-provider specifics outside feature screens and backend route logic.

## Local development

Use the development-token adapter only on a local/trusted development environment:

```bash
export CONVOWEAVE_ENV=development
export CONVOWEAVE_AUTH_MODE=development-token
export CONVOWEAVE_DEV_TOKEN='local-only-token'
```

The development adapter maps a valid token to a stable development principal. Production startup refuses this auth mode.

## OIDC preview/production

Configure a standards-compliant identity provider that issues signed JWT access tokens for the ConvoWeave API:

```bash
export CONVOWEAVE_AUTH_MODE=oidc
export OIDC_ISSUER='https://login.example.com/'
export OIDC_AUDIENCE='convoweave-api'
export OIDC_JWKS_URL='https://login.example.com/.well-known/jwks.json'
export OIDC_ALLOWED_ALGORITHMS='RS256'
```

Optional controls:

```bash
export OIDC_JWKS_TIMEOUT_MS=5000
export OIDC_JWKS_CACHE_MAX_AGE_MS=600000
export OIDC_JWKS_COOLDOWN_MS=30000
export OIDC_CLOCK_TOLERANCE_SECONDS=5
```

Outside development, issuer and JWKS URLs must use HTTPS.

## Mobile boundary

The mobile processing client receives an `AccessTokenProvider` and attaches its returned token only to ConvoWeave backend API calls. Feature screens do not know which identity vendor supplied the token.

The bearer token is deliberately not sent to the one-time audio upload capability URL.

## Session ownership

New processing sessions persist:

- `ownerSubject`: authenticated JWT `sub`
- `authIssuer`: authenticated issuer

They do not persist the bearer token or full identity claims. A different authenticated subject receives `403 forbidden` when attempting to read another user's processing session.

## Provider selection

This slice does not choose Auth0, Clerk, Cognito, Okta, Supabase, or another permanent identity vendor. Any provider used later must issue compatible OIDC access tokens and have a secure Expo/mobile sign-in flow.

## Release requirements

Before a public release using remote processing:

1. Configure the actual identity provider and callback/deep-link settings.
2. Add the provider's mobile login/session-refresh UX behind the existing access-token boundary.
3. Verify issuer, audience, JWKS rotation, expiration, logout, revoked/expired session behavior, and ownership isolation in preview.
4. Keep all provider secrets and private administrative credentials outside the mobile bundle and repository.

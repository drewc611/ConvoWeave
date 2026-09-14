import { createRemoteJWKSet, jwtVerify } from 'jose';

export function createOidcAuthVerifier(config, { jwks } = {}) {
  const oidc = config.oidc;
  if (!oidc?.issuer || !oidc?.audience || !oidc?.jwksUrl) {
    throw new Error('OIDC verifier requires issuer, audience, and JWKS URL.');
  }

  const keySet = jwks ?? createRemoteJWKSet(new URL(oidc.jwksUrl), {
    timeoutDuration: oidc.jwksTimeoutMs,
    cacheMaxAge: oidc.jwksCacheMaxAgeMs,
    cooldownDuration: oidc.jwksCooldownMs,
  });

  return {
    name: 'oidc',
    async ready() { return true; },
    async verify(token) {
      if (!token) return null;
      try {
        const { payload, protectedHeader } = await jwtVerify(token, keySet, {
          issuer: oidc.issuer,
          audience: oidc.audience,
          algorithms: oidc.allowedAlgorithms,
          clockTolerance: oidc.clockToleranceSeconds,
        });

        if (typeof payload.sub !== 'string' || payload.sub.trim().length === 0) return null;
        if (!protectedHeader.alg || !oidc.allowedAlgorithms.includes(protectedHeader.alg)) return null;

        return {
          subject: payload.sub.trim(),
          issuer: typeof payload.iss === 'string' ? payload.iss : oidc.issuer,
          authMode: 'oidc',
        };
      } catch {
        return null;
      }
    },
  };
}

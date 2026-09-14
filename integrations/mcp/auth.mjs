import { createRemoteJWKSet, jwtVerify } from 'jose';

const AUTH_MODES = new Set(['none', 'development-token', 'oidc']);
const DEFAULT_SCOPES = ['convoweave.read', 'convoweave.write'];

function normalizeUrl(value) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return new URL(trimmed).toString().replace(/\/$/, '');
}

function scopesFromPayload(payload) {
  if (typeof payload.scope === 'string') return payload.scope.split(/\s+/).filter(Boolean);
  if (Array.isArray(payload.scp)) return payload.scp.filter((item) => typeof item === 'string');
  return [];
}

export function loadMcpAuthConfig(env = process.env) {
  const mode = env.CONVOWEAVE_MCP_AUTH_MODE?.trim() || 'none';
  if (!AUTH_MODES.has(mode)) throw new Error(`Unsupported CONVOWEAVE_MCP_AUTH_MODE: ${mode}`);
  const publicBaseUrl = normalizeUrl(env.CONVOWEAVE_MCP_PUBLIC_BASE_URL);
  const resourceUrl = publicBaseUrl ? `${publicBaseUrl}/mcp` : undefined;
  const dataDir = env.CONVOWEAVE_ACCOUNT_DATA_DIR?.trim() || '.convoweave/account-data';
  const accountStoreMode = env.CONVOWEAVE_ACCOUNT_STORE_MODE?.trim() || 'filesystem';
  if (!['memory', 'filesystem'].includes(accountStoreMode)) throw new Error(`Unsupported CONVOWEAVE_ACCOUNT_STORE_MODE: ${accountStoreMode}`);

  if (mode === 'none') return { mode, publicBaseUrl, resourceUrl, dataDir, accountStoreMode, scopes: DEFAULT_SCOPES };
  if (!publicBaseUrl) throw new Error('CONVOWEAVE_MCP_PUBLIC_BASE_URL is required when MCP authentication is enabled.');

  if (mode === 'development-token') {
    const token = env.CONVOWEAVE_MCP_DEV_TOKEN?.trim();
    if (!token) throw new Error('CONVOWEAVE_MCP_DEV_TOKEN is required for development-token auth.');
    return { mode, publicBaseUrl, resourceUrl, dataDir, accountStoreMode, devToken: token, scopes: DEFAULT_SCOPES };
  }

  const issuer = normalizeUrl(env.OIDC_ISSUER);
  const audience = env.OIDC_AUDIENCE?.trim();
  const jwksUrl = normalizeUrl(env.OIDC_JWKS_URL);
  if (!issuer || !audience || !jwksUrl) throw new Error('OIDC_ISSUER, OIDC_AUDIENCE, and OIDC_JWKS_URL are required for MCP OIDC auth.');
  const allowedAlgorithms = (env.OIDC_ALLOWED_ALGORITHMS?.trim() || 'RS256').split(',').map((item) => item.trim()).filter(Boolean);
  return {
    mode,
    publicBaseUrl,
    resourceUrl,
    dataDir,
    accountStoreMode,
    issuer,
    audience,
    jwksUrl,
    allowedAlgorithms,
    scopes: DEFAULT_SCOPES,
  };
}

export function createMcpAuthVerifier(config, { jwks } = {}) {
  if (config.mode === 'none') {
    return { name: 'none', async verify() { return null; } };
  }

  if (config.mode === 'development-token') {
    return {
      name: 'development-token',
      async verify(token) {
        if (!token || token !== config.devToken) return null;
        return {
          token,
          clientId: 'convoweave-development',
          scopes: [...config.scopes],
          expiresAt: Math.floor(Date.now() / 1000) + 3600,
          resource: config.resourceUrl ? new URL(config.resourceUrl) : undefined,
          extra: { subject: 'development-user', issuer: 'convoweave-development' },
        };
      },
    };
  }

  const keySet = jwks ?? createRemoteJWKSet(new URL(config.jwksUrl));
  return {
    name: 'oidc',
    async verify(token) {
      if (!token) return null;
      try {
        const { payload, protectedHeader } = await jwtVerify(token, keySet, {
          issuer: config.issuer,
          audience: config.audience,
          algorithms: config.allowedAlgorithms,
          clockTolerance: 5,
        });
        if (typeof payload.sub !== 'string' || !payload.sub.trim()) return null;
        if (typeof payload.exp !== 'number') return null;
        if (!protectedHeader.alg || !config.allowedAlgorithms.includes(protectedHeader.alg)) return null;
        const clientId = typeof payload.azp === 'string'
          ? payload.azp
          : typeof payload.client_id === 'string'
            ? payload.client_id
            : 'unknown-client';
        return {
          token,
          clientId,
          scopes: scopesFromPayload(payload),
          expiresAt: payload.exp,
          resource: config.resourceUrl ? new URL(config.resourceUrl) : undefined,
          extra: { subject: payload.sub.trim(), issuer: typeof payload.iss === 'string' ? payload.iss : config.issuer },
        };
      } catch {
        return null;
      }
    },
  };
}

export function bearerTokenFromHeader(value) {
  if (typeof value !== 'string' || !value.startsWith('Bearer ')) return null;
  const token = value.slice('Bearer '.length).trim();
  return token || null;
}

export function hasScope(authInfo, scope) {
  return Array.isArray(authInfo?.scopes) && authInfo.scopes.includes(scope);
}

export function oauthProtectedResourceMetadata(config) {
  if (config.mode !== 'oidc') return null;
  return {
    resource: config.resourceUrl,
    authorization_servers: [config.issuer],
    scopes_supported: ['convoweave.read', 'convoweave.write', 'offline_access'],
    bearer_methods_supported: ['header'],
    resource_name: 'ConvoWeave',
  };
}

export function resourceMetadataUrl(config) {
  return config.publicBaseUrl ? `${config.publicBaseUrl}/.well-known/oauth-protected-resource` : undefined;
}

export function bearerChallenge(config, { error, scope } = {}) {
  const parts = ['Bearer'];
  const metadata = resourceMetadataUrl(config);
  if (metadata) parts.push(`resource_metadata="${metadata}"`);
  if (error) parts.push(`error="${error}"`);
  if (scope) parts.push(`scope="${scope}"`);
  return parts.join(' ');
}

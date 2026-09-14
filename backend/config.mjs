const ENVIRONMENTS = new Set(['development', 'preview', 'production']);
const AUTH_MODES = new Set(['development-token', 'oidc']);
const PROCESSING_PROVIDERS = new Set(['deterministic', 'openai']);
const STORAGE_MODES = new Set(['memory', 'filesystem']);
const AUDIO_RETENTION_MODES = new Set(['delete-after-processing', 'retain-preview']);
const OIDC_ALGORITHMS = new Set(['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'ES512', 'EdDSA']);

function parsePort(value) {
  const port = Number.parseInt(value ?? '8787', 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) throw new Error(`Invalid PORT: ${value}`);
  return port;
}

function parsePositiveInteger(value, fallback, name) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`Invalid ${name}: ${value}`);
  return parsed;
}

function normalizeOptionalUrl(value) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const parsed = new URL(trimmed);
  return parsed.toString().replace(/\/$/, '');
}

function storageConfig(environment, env) {
  const defaultMode = environment === 'preview' ? 'filesystem' : 'memory';
  const mode = env.CONVOWEAVE_STORAGE_MODE?.trim() || defaultMode;
  if (!STORAGE_MODES.has(mode)) throw new Error(`Unsupported CONVOWEAVE_STORAGE_MODE: ${mode}`);
  const audioRetention = env.CONVOWEAVE_AUDIO_RETENTION?.trim() || 'delete-after-processing';
  if (!AUDIO_RETENTION_MODES.has(audioRetention)) throw new Error(`Unsupported CONVOWEAVE_AUDIO_RETENTION: ${audioRetention}`);
  if (environment === 'production' && audioRetention !== 'delete-after-processing') throw new Error('Production cannot retain raw audio through the preview retention mode.');
  if (environment === 'production' && mode === 'memory') throw new Error('Production cannot use in-memory processing-session storage.');
  return { mode, dataDir: env.CONVOWEAVE_DATA_DIR?.trim() || '.convoweave/backend-data', audioRetention };
}

function oidcConfig(environment, authMode, env) {
  if (authMode !== 'oidc') return undefined;
  const issuer = env.OIDC_ISSUER?.trim();
  const audience = env.OIDC_AUDIENCE?.trim();
  const jwksUrl = env.OIDC_JWKS_URL?.trim();
  if (!issuer) throw new Error('OIDC_ISSUER is required when using oidc authentication.');
  if (!audience) throw new Error('OIDC_AUDIENCE is required when using oidc authentication.');
  if (!jwksUrl) throw new Error('OIDC_JWKS_URL is required when using oidc authentication.');
  const issuerUrl = new URL(issuer);
  const parsedJwksUrl = new URL(jwksUrl);
  if (environment !== 'development' && issuerUrl.protocol !== 'https:') throw new Error('OIDC_ISSUER must use HTTPS outside development.');
  if (environment !== 'development' && parsedJwksUrl.protocol !== 'https:') throw new Error('OIDC_JWKS_URL must use HTTPS outside development.');
  const allowedAlgorithms = (env.OIDC_ALLOWED_ALGORITHMS?.trim() || 'RS256').split(',').map((value) => value.trim()).filter(Boolean);
  if (allowedAlgorithms.length === 0 || allowedAlgorithms.some((algorithm) => !OIDC_ALGORITHMS.has(algorithm))) throw new Error('OIDC_ALLOWED_ALGORITHMS contains an unsupported or unsafe algorithm.');
  return {
    issuer,
    audience,
    jwksUrl: parsedJwksUrl.toString(),
    allowedAlgorithms: [...new Set(allowedAlgorithms)],
    jwksTimeoutMs: parsePositiveInteger(env.OIDC_JWKS_TIMEOUT_MS, 5000, 'OIDC_JWKS_TIMEOUT_MS'),
    jwksCacheMaxAgeMs: parsePositiveInteger(env.OIDC_JWKS_CACHE_MAX_AGE_MS, 600000, 'OIDC_JWKS_CACHE_MAX_AGE_MS'),
    jwksCooldownMs: parsePositiveInteger(env.OIDC_JWKS_COOLDOWN_MS, 30000, 'OIDC_JWKS_COOLDOWN_MS'),
    clockToleranceSeconds: parsePositiveInteger(env.OIDC_CLOCK_TOLERANCE_SECONDS, 5, 'OIDC_CLOCK_TOLERANCE_SECONDS'),
  };
}

function reliabilityConfig(env) {
  return {
    uploadTtlMs: parsePositiveInteger(env.CONVOWEAVE_UPLOAD_TTL_MS, 15 * 60 * 1000, 'CONVOWEAVE_UPLOAD_TTL_MS'),
    sessionTtlMs: parsePositiveInteger(env.CONVOWEAVE_SESSION_TTL_MS, 24 * 60 * 60 * 1000, 'CONVOWEAVE_SESSION_TTL_MS'),
    rateLimitPerMinute: parsePositiveInteger(env.CONVOWEAVE_RATE_LIMIT_PER_MINUTE, 60, 'CONVOWEAVE_RATE_LIMIT_PER_MINUTE'),
  };
}

export function loadBackendConfig(env = process.env) {
  const environment = env.CONVOWEAVE_ENV ?? 'development';
  if (!ENVIRONMENTS.has(environment)) throw new Error(`Unsupported CONVOWEAVE_ENV: ${environment}`);
  const authMode = env.CONVOWEAVE_AUTH_MODE ?? 'development-token';
  if (!AUTH_MODES.has(authMode)) throw new Error(`Unsupported CONVOWEAVE_AUTH_MODE: ${authMode}`);
  const processingProvider = env.CONVOWEAVE_PROCESSING_PROVIDER ?? 'deterministic';
  if (!PROCESSING_PROVIDERS.has(processingProvider)) throw new Error(`Unsupported CONVOWEAVE_PROCESSING_PROVIDER: ${processingProvider}`);
  const devToken = env.CONVOWEAVE_DEV_TOKEN?.trim();
  if (authMode === 'development-token' && !devToken) throw new Error('CONVOWEAVE_DEV_TOKEN is required when using development-token auth.');
  const openaiApiKey = env.OPENAI_API_KEY?.trim();
  if (processingProvider === 'openai' && !openaiApiKey) throw new Error('OPENAI_API_KEY is required when using the openai processing provider.');
  if (environment === 'production' && authMode !== 'oidc') throw new Error('Production requires OIDC authentication.');
  if (environment === 'production' && processingProvider === 'deterministic') throw new Error('Production cannot use the deterministic processing provider. Configure a production provider before deployment.');
  const publicBaseUrl = normalizeOptionalUrl(env.PUBLIC_BASE_URL);
  if (environment === 'production' && publicBaseUrl && !publicBaseUrl.startsWith('https://')) throw new Error('Production PUBLIC_BASE_URL must use HTTPS.');
  return {
    environment,
    authMode,
    devToken,
    oidc: oidcConfig(environment, authMode, env),
    processingProvider,
    host: env.HOST?.trim() || '127.0.0.1',
    port: parsePort(env.PORT),
    publicBaseUrl,
    storage: storageConfig(environment, env),
    reliability: reliabilityConfig(env),
    openai: processingProvider === 'openai' ? {
      apiKey: openaiApiKey,
      baseUrl: normalizeOptionalUrl(env.OPENAI_BASE_URL) ?? 'https://api.openai.com',
      transcriptionModel: env.OPENAI_TRANSCRIPTION_MODEL?.trim() || 'gpt-transcribe',
      extractionModel: env.OPENAI_EXTRACTION_MODEL?.trim() || 'gpt-5.6-luna',
      timeoutMs: parsePositiveInteger(env.OPENAI_TIMEOUT_MS, 60000, 'OPENAI_TIMEOUT_MS'),
    } : undefined,
  };
}

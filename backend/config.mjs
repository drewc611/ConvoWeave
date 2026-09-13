const ENVIRONMENTS = new Set(['development', 'preview', 'production']);
const AUTH_MODES = new Set(['development-token']);
const PROCESSING_PROVIDERS = new Set(['deterministic']);

function parsePort(value) {
  const port = Number.parseInt(value ?? '8787', 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT: ${value}`);
  }
  return port;
}

function normalizeOptionalUrl(value) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const parsed = new URL(trimmed);
  return parsed.toString().replace(/\/$/, '');
}

export function loadBackendConfig(env = process.env) {
  const environment = env.CONVOWEAVE_ENV ?? 'development';
  if (!ENVIRONMENTS.has(environment)) {
    throw new Error(`Unsupported CONVOWEAVE_ENV: ${environment}`);
  }

  const authMode = env.CONVOWEAVE_AUTH_MODE ?? 'development-token';
  if (!AUTH_MODES.has(authMode)) {
    throw new Error(`Unsupported CONVOWEAVE_AUTH_MODE: ${authMode}`);
  }

  const processingProvider = env.CONVOWEAVE_PROCESSING_PROVIDER ?? 'deterministic';
  if (!PROCESSING_PROVIDERS.has(processingProvider)) {
    throw new Error(`Unsupported CONVOWEAVE_PROCESSING_PROVIDER: ${processingProvider}`);
  }

  const devToken = env.CONVOWEAVE_DEV_TOKEN?.trim();
  if (authMode === 'development-token' && !devToken) {
    throw new Error('CONVOWEAVE_DEV_TOKEN is required when using development-token auth.');
  }

  if (environment === 'production' && authMode === 'development-token') {
    throw new Error('Production cannot use development-token authentication. Configure a production auth adapter before deployment.');
  }

  if (environment === 'production' && processingProvider === 'deterministic') {
    throw new Error('Production cannot use the deterministic processing provider. Configure a production provider before deployment.');
  }

  const publicBaseUrl = normalizeOptionalUrl(env.PUBLIC_BASE_URL);
  if (environment === 'production' && publicBaseUrl && !publicBaseUrl.startsWith('https://')) {
    throw new Error('Production PUBLIC_BASE_URL must use HTTPS.');
  }

  return {
    environment,
    authMode,
    devToken,
    processingProvider,
    host: env.HOST?.trim() || '127.0.0.1',
    port: parsePort(env.PORT),
    publicBaseUrl,
  };
}

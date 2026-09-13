export type AppEnvironment = 'development' | 'preview' | 'production';
export type ProcessingMode = 'local' | 'remote';

export type RuntimeConfig = {
  environment: AppEnvironment;
  processingMode: ProcessingMode;
  apiUrl?: string;
};

type RuntimeEnv = {
  EXPO_PUBLIC_APP_ENV?: string;
  EXPO_PUBLIC_PROCESSING_MODE?: string;
  EXPO_PUBLIC_API_URL?: string;
};

function parseEnvironment(value: string | undefined): AppEnvironment {
  if (!value || value === 'development') return 'development';
  if (value === 'preview' || value === 'production') return value;
  throw new Error(`Unsupported EXPO_PUBLIC_APP_ENV: ${value}`);
}

function parseProcessingMode(value: string | undefined): ProcessingMode {
  if (!value || value === 'local') return 'local';
  if (value === 'remote') return 'remote';
  throw new Error(`Unsupported EXPO_PUBLIC_PROCESSING_MODE: ${value}`);
}

function normalizeApiUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/$/, '');
}

export function loadRuntimeConfig(env: RuntimeEnv = process.env): RuntimeConfig {
  const environment = parseEnvironment(env.EXPO_PUBLIC_APP_ENV);
  const processingMode = parseProcessingMode(env.EXPO_PUBLIC_PROCESSING_MODE);
  const apiUrl = normalizeApiUrl(env.EXPO_PUBLIC_API_URL);

  if (processingMode === 'remote' && !apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is required when remote processing is enabled.');
  }

  if (environment === 'production' && apiUrl && !apiUrl.startsWith('https://')) {
    throw new Error('Production remote API URLs must use HTTPS.');
  }

  return { environment, processingMode, apiUrl };
}

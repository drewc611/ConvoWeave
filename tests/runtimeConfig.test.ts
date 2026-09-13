import { describe, expect, it } from 'vitest';
import { loadRuntimeConfig } from '../src/config/runtime';

describe('runtime config', () => {
  it('defaults to local development', () => {
    expect(loadRuntimeConfig({})).toEqual({
      environment: 'development',
      processingMode: 'local',
      apiUrl: undefined,
    });
  });

  it('requires a backend URL for remote processing', () => {
    expect(() => loadRuntimeConfig({ EXPO_PUBLIC_PROCESSING_MODE: 'remote' })).toThrow(/API_URL/);
  });

  it('requires HTTPS in production', () => {
    expect(() => loadRuntimeConfig({
      EXPO_PUBLIC_APP_ENV: 'production',
      EXPO_PUBLIC_PROCESSING_MODE: 'remote',
      EXPO_PUBLIC_API_URL: 'http://api.example.test',
    })).toThrow(/HTTPS/);
  });

  it('accepts a production HTTPS backend', () => {
    expect(loadRuntimeConfig({
      EXPO_PUBLIC_APP_ENV: 'production',
      EXPO_PUBLIC_PROCESSING_MODE: 'remote',
      EXPO_PUBLIC_API_URL: 'https://api.convoweave.example/',
    })).toEqual({
      environment: 'production',
      processingMode: 'remote',
      apiUrl: 'https://api.convoweave.example',
    });
  });
});

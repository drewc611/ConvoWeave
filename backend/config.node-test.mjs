import assert from 'node:assert/strict';
import test from 'node:test';
import { loadBackendConfig } from './config.mjs';

test('development config is explicit and valid', () => {
  const config = loadBackendConfig({
    CONVOWEAVE_ENV: 'development',
    CONVOWEAVE_AUTH_MODE: 'development-token',
    CONVOWEAVE_DEV_TOKEN: 'dev-token',
    CONVOWEAVE_PROCESSING_PROVIDER: 'deterministic',
    HOST: '127.0.0.1',
    PORT: '8787',
  });
  assert.equal(config.environment, 'development');
  assert.equal(config.authMode, 'development-token');
  assert.equal(config.processingProvider, 'deterministic');
  assert.equal(config.port, 8787);
});

test('development-token auth requires a token', () => {
  assert.throws(() => loadBackendConfig({
    CONVOWEAVE_ENV: 'development',
    CONVOWEAVE_AUTH_MODE: 'development-token',
    CONVOWEAVE_PROCESSING_PROVIDER: 'deterministic',
  }), /DEV_TOKEN/);
});

test('production refuses development authentication', () => {
  assert.throws(() => loadBackendConfig({
    CONVOWEAVE_ENV: 'production',
    CONVOWEAVE_AUTH_MODE: 'development-token',
    CONVOWEAVE_DEV_TOKEN: 'must-not-run-in-production',
    CONVOWEAVE_PROCESSING_PROVIDER: 'deterministic',
    PUBLIC_BASE_URL: 'https://api.convoweave.example',
  }), /Production cannot use development-token/);
});

test('production requires HTTPS public base URL when supplied', () => {
  assert.throws(() => loadBackendConfig({
    CONVOWEAVE_ENV: 'production',
    CONVOWEAVE_AUTH_MODE: 'future-auth-adapter',
    CONVOWEAVE_PROCESSING_PROVIDER: 'deterministic',
    PUBLIC_BASE_URL: 'http://api.convoweave.example',
  }), /Unsupported CONVOWEAVE_AUTH_MODE|HTTPS/);
});

test('invalid ports are rejected', () => {
  assert.throws(() => loadBackendConfig({
    CONVOWEAVE_DEV_TOKEN: 'dev-token',
    PORT: '99999',
  }), /Invalid PORT/);
});

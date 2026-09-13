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
  assert.equal(config.openai, undefined);
});

test('development-token auth requires a token', () => {
  assert.throws(() => loadBackendConfig({
    CONVOWEAVE_ENV: 'development',
    CONVOWEAVE_AUTH_MODE: 'development-token',
    CONVOWEAVE_PROCESSING_PROVIDER: 'deterministic',
  }), /DEV_TOKEN/);
});

test('preview OpenAI provider requires a backend-only API key', () => {
  assert.throws(() => loadBackendConfig({
    CONVOWEAVE_ENV: 'preview',
    CONVOWEAVE_AUTH_MODE: 'development-token',
    CONVOWEAVE_DEV_TOKEN: 'preview-dev-token',
    CONVOWEAVE_PROCESSING_PROVIDER: 'openai',
  }), /OPENAI_API_KEY/);
});

test('preview OpenAI provider receives safe model defaults', () => {
  const config = loadBackendConfig({
    CONVOWEAVE_ENV: 'preview',
    CONVOWEAVE_AUTH_MODE: 'development-token',
    CONVOWEAVE_DEV_TOKEN: 'preview-dev-token',
    CONVOWEAVE_PROCESSING_PROVIDER: 'openai',
    OPENAI_API_KEY: 'test-only-key',
  });
  assert.equal(config.processingProvider, 'openai');
  assert.equal(config.openai.apiKey, 'test-only-key');
  assert.equal(config.openai.transcriptionModel, 'gpt-transcribe');
  assert.equal(config.openai.extractionModel, 'gpt-5.6-luna');
  assert.equal(config.openai.timeoutMs, 60000);
  assert.equal(config.openai.baseUrl, 'https://api.openai.com');
});

test('OpenAI model and timeout settings can be changed without source edits', () => {
  const config = loadBackendConfig({
    CONVOWEAVE_ENV: 'preview',
    CONVOWEAVE_AUTH_MODE: 'development-token',
    CONVOWEAVE_DEV_TOKEN: 'preview-dev-token',
    CONVOWEAVE_PROCESSING_PROVIDER: 'openai',
    OPENAI_API_KEY: 'test-only-key',
    OPENAI_TRANSCRIPTION_MODEL: 'transcription-test-model',
    OPENAI_EXTRACTION_MODEL: 'extraction-test-model',
    OPENAI_TIMEOUT_MS: '15000',
    OPENAI_BASE_URL: 'https://provider.example.test/',
  });
  assert.equal(config.openai.transcriptionModel, 'transcription-test-model');
  assert.equal(config.openai.extractionModel, 'extraction-test-model');
  assert.equal(config.openai.timeoutMs, 15000);
  assert.equal(config.openai.baseUrl, 'https://provider.example.test');
});

test('production refuses development authentication', () => {
  assert.throws(() => loadBackendConfig({
    CONVOWEAVE_ENV: 'production',
    CONVOWEAVE_AUTH_MODE: 'development-token',
    CONVOWEAVE_DEV_TOKEN: 'must-not-run-in-production',
    CONVOWEAVE_PROCESSING_PROVIDER: 'openai',
    OPENAI_API_KEY: 'test-only-key',
    PUBLIC_BASE_URL: 'https://api.convoweave.example',
  }), /Production cannot use development-token/);
});

test('invalid ports are rejected', () => {
  assert.throws(() => loadBackendConfig({
    CONVOWEAVE_DEV_TOKEN: 'dev-token',
    PORT: '99999',
  }), /Invalid PORT/);
});

test('invalid OpenAI timeout is rejected', () => {
  assert.throws(() => loadBackendConfig({
    CONVOWEAVE_ENV: 'preview',
    CONVOWEAVE_AUTH_MODE: 'development-token',
    CONVOWEAVE_DEV_TOKEN: 'preview-dev-token',
    CONVOWEAVE_PROCESSING_PROVIDER: 'openai',
    OPENAI_API_KEY: 'test-only-key',
    OPENAI_TIMEOUT_MS: '0',
  }), /OPENAI_TIMEOUT_MS/);
});

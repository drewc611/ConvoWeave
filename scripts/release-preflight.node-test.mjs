import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateReleaseConfig } from './release-preflight.mjs';

function validApp() {
  return {
    expo: {
      name: 'ConvoWeave',
      slug: 'convoweave',
      version: '0.2.0',
      ios: { bundleIdentifier: 'com.convoweave.mobile' },
      android: { package: 'com.convoweave.mobile' },
      plugins: [['expo-audio', {
        microphonePermission: 'Allow ConvoWeave to record meetings after you explicitly start a capture.',
        enableBackgroundRecording: false,
      }]],
    },
  };
}

function validEas() {
  return {
    build: {
      preview: { distribution: 'internal', environment: 'preview' },
      production: { autoIncrement: true, environment: 'production' },
    },
    submit: {
      production: {
        android: { track: 'internal', releaseStatus: 'draft' },
        ios: {},
      },
    },
  };
}

test('current release shape passes with only an EAS connection warning', () => {
  const result = evaluateReleaseConfig(validApp(), validEas());
  assert.deepEqual(result.errors, []);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /EAS project is not connected/);
});

test('connected preflight fails until a real EAS project id exists', () => {
  const result = evaluateReleaseConfig(validApp(), validEas(), {}, { requireEasProject: true });
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /EAS project is not connected/);
});

test('background recording cannot be enabled', () => {
  const app = validApp();
  app.expo.plugins[0][1].enableBackgroundRecording = true;
  const result = evaluateReleaseConfig(app, validEas());
  assert.ok(result.errors.some((error) => error.includes('Background recording')));
});

test('public environment variables cannot contain secrets', () => {
  const result = evaluateReleaseConfig(validApp(), validEas(), {
    EXPO_PUBLIC_API_KEY: 'should-never-be-public',
  });
  assert.ok(result.errors.some((error) => error.includes('EXPO_PUBLIC_API_KEY')));
});

test('remote preview processing requires an HTTPS API URL', () => {
  const result = evaluateReleaseConfig(validApp(), validEas(), {
    EXPO_PUBLIC_APP_ENV: 'preview',
    EXPO_PUBLIC_PROCESSING_MODE: 'remote',
    EXPO_PUBLIC_API_URL: 'http://preview.example.test',
  });
  assert.ok(result.errors.some((error) => error.includes('HTTPS')));
});

test('remote preview processing passes with an HTTPS API URL', () => {
  const result = evaluateReleaseConfig(validApp(), validEas(), {
    EXPO_PUBLIC_APP_ENV: 'preview',
    EXPO_PUBLIC_PROCESSING_MODE: 'remote',
    EXPO_PUBLIC_API_URL: 'https://preview.example.test',
  });
  assert.deepEqual(result.errors, []);
});

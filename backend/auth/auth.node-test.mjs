import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { createBackendServer } from '../server.mjs';
import { createInMemoryAudioStore } from '../storage/audioStore.mjs';
import { createInMemorySessionStore } from '../storage/sessionStore.mjs';
import { createDevelopmentTokenVerifier } from './developmentToken.mjs';
import { createOidcAuthVerifier } from './oidc.mjs';

const oidcConfig = {
  oidc: {
    issuer: 'https://issuer.example.test',
    audience: 'convoweave-api',
    jwksUrl: 'https://issuer.example.test/.well-known/jwks.json',
    allowedAlgorithms: ['RS256'],
    jwksTimeoutMs: 5000,
    jwksCacheMaxAgeMs: 600000,
    jwksCooldownMs: 30000,
    clockToleranceSeconds: 5,
  },
};

async function signingContext() {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = 'test-key';
  publicJwk.alg = 'RS256';
  return {
    privateKey,
    jwks: createLocalJWKSet({ keys: [publicJwk] }),
  };
}

async function signedToken(privateKey, overrides = {}) {
  let token = new SignJWT({ role: 'user' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer(overrides.issuer ?? oidcConfig.oidc.issuer)
    .setAudience(overrides.audience ?? oidcConfig.oidc.audience)
    .setIssuedAt()
    .setExpirationTime(overrides.expiration ?? '5m');
  if (overrides.subject !== null) token = token.setSubject(overrides.subject ?? 'user-123');
  return token.sign(privateKey);
}

test('development token verifier uses a stable non-secret principal', async () => {
  const verifier = createDevelopmentTokenVerifier({ devToken: 'development-secret' });
  assert.equal(await verifier.verify('wrong-token'), null);
  assert.deepEqual(await verifier.verify('development-secret'), {
    subject: 'development-user',
    issuer: 'convoweave-development',
    authMode: 'development-token',
  });
});

test('OIDC verifier accepts a valid issuer/audience/subject token', async () => {
  const { privateKey, jwks } = await signingContext();
  const verifier = createOidcAuthVerifier(oidcConfig, { jwks });
  const principal = await verifier.verify(await signedToken(privateKey));
  assert.deepEqual(principal, {
    subject: 'user-123',
    issuer: oidcConfig.oidc.issuer,
    authMode: 'oidc',
  });
});

test('OIDC verifier rejects wrong audience, expiration, and missing subject', async () => {
  const { privateKey, jwks } = await signingContext();
  const verifier = createOidcAuthVerifier(oidcConfig, { jwks });

  assert.equal(await verifier.verify(await signedToken(privateKey, { audience: 'other-api' })), null);
  assert.equal(await verifier.verify(await signedToken(privateKey, { expiration: 0 })), null);
  assert.equal(await verifier.verify(await signedToken(privateKey, { subject: null })), null);
});

test('OIDC mode isolates processing sessions by authenticated subject without persisting bearer tokens', async () => {
  const sessionStore = createInMemorySessionStore();
  const audioStore = createInMemoryAudioStore();
  const authVerifier = {
    name: 'oidc',
    async ready() { return true; },
    async verify(token) {
      if (token === 'token-user-a') return { subject: 'user-a', issuer: 'https://issuer.example.test', authMode: 'oidc' };
      if (token === 'token-user-b') return { subject: 'user-b', issuer: 'https://issuer.example.test', authMode: 'oidc' };
      return null;
    },
  };
  const processor = {
    name: 'auth-test-processor',
    async ready() { return true; },
    async process({ session }) {
      return {
        transcript: { meetingId: session.meetingId, segments: [] },
        review: { id: session.meetingId, meetingId: session.meetingId, transcript: { meetingId: session.meetingId, segments: [] }, proposals: [], updatedAt: new Date().toISOString() },
      };
    },
  };
  const config = {
    environment: 'preview',
    authMode: 'oidc',
    processingProvider: 'test',
    host: '127.0.0.1',
    port: 0,
    publicBaseUrl: undefined,
    storage: { mode: 'memory', audioRetention: 'delete-after-processing' },
  };
  const server = createBackendServer({ config, processor, authVerifier, sessionStore, audioStore, logger: { info() {}, error() {} } });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address === 'object');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const createdResponse = await fetch(`${baseUrl}/v1/processing-sessions`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-user-a',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ meetingId: 'meeting-a', uploadScope: 'audio-and-transcript' }),
    });
    assert.equal(createdResponse.status, 201);
    const created = await createdResponse.json();

    const stored = await sessionStore.get(created.id);
    assert.equal(stored?.ownerSubject, 'user-a');
    assert.equal(stored?.authIssuer, 'https://issuer.example.test');
    assert.equal(JSON.stringify(stored).includes('token-user-a'), false);

    const ownerRead = await fetch(`${baseUrl}/v1/processing-sessions/${created.id}`, {
      headers: { Authorization: 'Bearer token-user-a' },
    });
    assert.equal(ownerRead.status, 202);

    const otherUserRead = await fetch(`${baseUrl}/v1/processing-sessions/${created.id}`, {
      headers: { Authorization: 'Bearer token-user-b' },
    });
    assert.equal(otherUserRead.status, 403);
    const forbidden = await otherUserRead.json();
    assert.equal(forbidden.error.code, 'forbidden');

    const unauthenticated = await fetch(`${baseUrl}/v1/processing-sessions/${created.id}`);
    assert.equal(unauthenticated.status, 401);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

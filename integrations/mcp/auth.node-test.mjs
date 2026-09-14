import assert from 'node:assert/strict';
import test from 'node:test';
import { bearerChallenge, createMcpAuthVerifier, loadMcpAuthConfig, oauthProtectedResourceMetadata } from './auth.mjs';

test('development auth produces scoped principal AuthInfo', async () => {
  const config = loadMcpAuthConfig({
    CONVOWEAVE_MCP_AUTH_MODE: 'development-token',
    CONVOWEAVE_MCP_DEV_TOKEN: 'test-token',
    CONVOWEAVE_MCP_PUBLIC_BASE_URL: 'https://mcp.example.test',
    CONVOWEAVE_ACCOUNT_STORE_MODE: 'memory',
  });
  const verifier = createMcpAuthVerifier(config);
  const auth = await verifier.verify('test-token');
  assert.equal(auth.extra.subject, 'development-user');
  assert.ok(auth.scopes.includes('convoweave.read'));
  assert.ok(auth.scopes.includes('convoweave.write'));
  assert.equal(await verifier.verify('wrong'), null);
});

test('OIDC protected resource metadata advertises configured resource scopes and issuer', () => {
  const config = loadMcpAuthConfig({
    CONVOWEAVE_MCP_AUTH_MODE: 'oidc',
    CONVOWEAVE_MCP_PUBLIC_BASE_URL: 'https://mcp.example.test',
    CONVOWEAVE_READ_SCOPE: 'convoweave/read',
    CONVOWEAVE_WRITE_SCOPE: 'convoweave/write',
    OIDC_ISSUER: 'https://identity.example.test',
    OIDC_AUDIENCE: 'cognito-public-client',
    OIDC_AUDIENCE_CLAIM: 'client_id',
    OIDC_JWKS_URL: 'https://identity.example.test/.well-known/jwks.json',
  });
  const metadata = oauthProtectedResourceMetadata(config);
  assert.equal(metadata.resource, 'https://mcp.example.test/mcp');
  assert.deepEqual(metadata.authorization_servers, ['https://identity.example.test']);
  assert.deepEqual(metadata.scopes_supported, ['convoweave/read', 'convoweave/write']);
  assert.equal(config.audienceClaim, 'client_id');
  assert.match(bearerChallenge(config, { error: 'invalid_token' }), /resource_metadata=/);
});

test('AWS account-store config fails closed without required resource names', () => {
  assert.throws(() => loadMcpAuthConfig({
    CONVOWEAVE_ACCOUNT_STORE_MODE: 'aws',
  }), /CONVOWEAVE_ACCOUNT_TABLE/);
});

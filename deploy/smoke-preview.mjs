const baseUrl = process.env.CONVOWEAVE_PREVIEW_URL?.trim().replace(/\/$/, '');
if (!baseUrl) {
  console.error('CONVOWEAVE_PREVIEW_URL is required.');
  process.exit(2);
}

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'User-Agent': 'convoweave-preview-smoke/1' },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return response.json();
}

try {
  const health = await getJson('/healthz');
  const readiness = await getJson('/readyz');

  if (health.status !== 'ok') throw new Error('healthz did not report ok');
  if (readiness.status !== 'ready') throw new Error('readyz did not report ready');

  const expectedProvider = process.env.CONVOWEAVE_EXPECT_PROVIDER?.trim();
  const expectedAuth = process.env.CONVOWEAVE_EXPECT_AUTH?.trim();
  const expectedStorage = process.env.CONVOWEAVE_EXPECT_STORAGE?.trim();

  if (expectedProvider && readiness.provider !== expectedProvider) {
    throw new Error(`Expected provider ${expectedProvider}, got ${readiness.provider}`);
  }
  if (expectedAuth && readiness.auth !== expectedAuth) {
    throw new Error(`Expected auth ${expectedAuth}, got ${readiness.auth}`);
  }
  if (expectedStorage && (readiness.storage?.sessions !== expectedStorage || readiness.storage?.audio !== expectedStorage)) {
    throw new Error(`Expected ${expectedStorage} storage, got ${JSON.stringify(readiness.storage)}`);
  }

  console.log(JSON.stringify({
    ok: true,
    service: health.service,
    apiVersion: health.apiVersion,
    environment: readiness.environment,
    provider: readiness.provider,
    auth: readiness.auth,
    storage: readiness.storage,
  }));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Preview smoke failed.');
  process.exit(1);
}

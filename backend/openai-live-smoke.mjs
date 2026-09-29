import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { loadBackendConfig } from './config.mjs';
import { createProcessor } from './providers/index.mjs';

const audioPath = process.argv[2];
if (!audioPath) {
  console.error('Usage: npm --prefix backend run smoke:openai -- /path/to/test-audio.m4a');
  process.exit(2);
}

const authMode = process.env.CONVOWEAVE_AUTH_MODE || 'development-token';
if (authMode === 'development-token' && !process.env.CONVOWEAVE_DEV_TOKEN?.trim()) {
  console.error('CONVOWEAVE_DEV_TOKEN is required for development-token auth. Set it in the environment before running the smoke test.');
  process.exit(2);
}
if (!process.env.OPENAI_API_KEY?.trim()) {
  console.error('OPENAI_API_KEY is required. Set it in the environment before running the smoke test.');
  process.exit(2);
}

const config = loadBackendConfig({
  ...process.env,
  CONVOWEAVE_ENV: 'preview',
  // The smoke test never issues upload URLs; preview config only requires the value to be a URL.
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || 'https://smoke.invalid',
  CONVOWEAVE_AUTH_MODE: authMode,
  CONVOWEAVE_PROCESSING_PROVIDER: 'openai',
});
const processor = createProcessor(config);
const audio = await readFile(audioPath);
const meetingId = `smoke-${Date.now()}`;

const result = await processor.process({
  session: {
    meetingId,
    threadId: 'operator-smoke',
    durationMs: 0,
    sourceName: basename(audioPath),
  },
  audio,
});

console.log(JSON.stringify({
  provider: processor.name,
  transcriptCharacters: result.transcript.segments.reduce((sum, segment) => sum + segment.text.length, 0),
  proposalCount: result.review.proposals.length,
  proposalKinds: result.review.proposals.map((proposal) => proposal.kind),
}, null, 2));

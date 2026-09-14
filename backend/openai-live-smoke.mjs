import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { loadBackendConfig } from './config.mjs';
import { createProcessor } from './providers/index.mjs';

const audioPath = process.argv[2];
if (!audioPath) {
  console.error('Usage: npm --prefix backend run smoke:openai -- /path/to/test-audio.m4a');
  process.exit(2);
}

const config = loadBackendConfig({
  ...process.env,
  CONVOWEAVE_ENV: 'preview',
  CONVOWEAVE_AUTH_MODE: process.env.CONVOWEAVE_AUTH_MODE || 'development-token',
  CONVOWEAVE_DEV_TOKEN: process.env.CONVOWEAVE_DEV_TOKEN || 'operator-local-smoke-token',
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

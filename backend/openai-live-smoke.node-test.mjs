import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import test from 'node:test';

const script = new URL('./openai-live-smoke.mjs', import.meta.url).pathname;

function run(env) {
  return spawnSync(process.execPath, [script, '/nonexistent/test-audio.m4a'], {
    env: { PATH: process.env.PATH, ...env },
    encoding: 'utf8',
  });
}

test('smoke script refuses to run without CONVOWEAVE_DEV_TOKEN', () => {
  const result = run({ OPENAI_API_KEY: randomBytes(16).toString('hex') });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /CONVOWEAVE_DEV_TOKEN is required/);
});

test('smoke script refuses to run without OPENAI_API_KEY', () => {
  const result = run({ CONVOWEAVE_DEV_TOKEN: randomBytes(16).toString('hex') });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /OPENAI_API_KEY is required/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createOpenAIProcessor } from './openai.mjs';

const config = {
  openai: {
    apiKey: 'test-key-not-real',
    baseUrl: 'https://api.openai.test',
    transcriptionModel: 'gpt-transcribe',
    extractionModel: 'gpt-5.6-luna',
    timeoutMs: 5000,
  },
};

const session = {
  meetingId: 'meeting-openai-1',
  threadId: 'thread-1',
  durationMs: 42000,
};

function extractionResponse(proposals) {
  return new Response(JSON.stringify({
    output: [{
      type: 'message',
      content: [{
        type: 'output_text',
        text: JSON.stringify({ proposals }),
      }],
    }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

test('transcribes audio then maps structured extraction into reviewable memory', async () => {
  const calls = [];
  const transcriptText = 'We decided to ship the local-first flow. Jordan will finish onboarding by Friday. Retention is still an assumption.';
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith('/v1/audio/transcriptions')) {
      assert.equal(init.method, 'POST');
      assert.equal(init.headers.Authorization, 'Bearer test-key-not-real');
      assert(init.body instanceof FormData);
      assert.equal(init.body.get('model'), 'gpt-transcribe');
      return new Response(JSON.stringify({ text: transcriptText }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.endsWith('/v1/responses')) {
      const body = JSON.parse(init.body);
      assert.equal(body.model, 'gpt-5.6-luna');
      assert.equal(body.store, false);
      assert.equal(body.reasoning.effort, 'low');
      assert.equal(body.text.format.type, 'json_schema');
      assert.equal(body.text.format.strict, true);
      assert.equal(body.input, transcriptText);
      return extractionResponse([
        {
          kind: 'decision',
          statement: 'Ship the local-first flow.',
          confidence: 0.98,
          evidenceQuote: 'We decided to ship the local-first flow.',
          rationale: null,
          ownerId: null,
          dueAt: null,
          reviewAt: null,
        },
        {
          kind: 'commitment',
          statement: 'Finish onboarding by Friday.',
          confidence: 0.94,
          evidenceQuote: 'Jordan will finish onboarding by Friday.',
          rationale: null,
          ownerId: 'Jordan',
          dueAt: '2026-09-18T17:00:00Z',
          reviewAt: null,
        },
        {
          kind: 'assumption',
          statement: 'Retention is still an assumption.',
          confidence: 0.9,
          evidenceQuote: 'Retention is still an assumption.',
          rationale: null,
          ownerId: null,
          dueAt: null,
          reviewAt: null,
        },
      ]);
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const processor = createOpenAIProcessor(config, { fetchImpl });
  const result = await processor.process({ session, audio: Buffer.from('audio-bytes') });

  assert.equal(calls.length, 2);
  assert.equal(result.transcript.meetingId, session.meetingId);
  assert.equal(result.transcript.segments.length, 1);
  assert.equal(result.transcript.segments[0].text, transcriptText);
  assert.equal(result.review.proposals.length, 3);
  assert.equal(result.review.proposals[0].state, 'proposed');
  assert.equal(result.review.proposals[0].evidence[0].meetingId, session.meetingId);
  assert.equal(result.review.proposals[0].evidence[0].quote, 'We decided to ship the local-first flow.');
  assert.equal(result.review.proposals[1].ownerId, 'Jordan');
  assert.equal(result.review.proposals[1].dueAt, '2026-09-18T17:00:00.000Z');
});

test('rejects model evidence that is not actually present in the transcript', async () => {
  let call = 0;
  const fetchImpl = async () => {
    call += 1;
    if (call === 1) {
      return new Response(JSON.stringify({ text: 'The team discussed launch timing.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return extractionResponse([{
      kind: 'decision',
      statement: 'Launch Tuesday.',
      confidence: 0.8,
      evidenceQuote: 'We decided to launch Tuesday.',
      rationale: null,
      ownerId: null,
      dueAt: null,
      reviewAt: null,
    }]);
  };

  const processor = createOpenAIProcessor(config, { fetchImpl });
  await assert.rejects(
    processor.process({ session, audio: Buffer.from('audio') }),
    /evidence that is not present in the transcript/,
  );
});

test('rejects unsupported proposal kinds even if upstream output is malformed', async () => {
  let call = 0;
  const transcriptText = 'The team noted a possible conflict.';
  const fetchImpl = async () => {
    call += 1;
    if (call === 1) {
      return new Response(JSON.stringify({ text: transcriptText }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return extractionResponse([{
      kind: 'contradiction',
      statement: 'A conflict exists.',
      confidence: 0.7,
      evidenceQuote: 'possible conflict',
      rationale: null,
      ownerId: null,
      dueAt: null,
      reviewAt: null,
    }]);
  };

  const processor = createOpenAIProcessor(config, { fetchImpl });
  await assert.rejects(
    processor.process({ session, audio: Buffer.from('audio') }),
    /unsupported proposal kind/,
  );
});

test('does not leak upstream response bodies when transcription fails', async () => {
  const fetchImpl = async () => new Response('secret upstream body with sensitive detail', {
    status: 429,
    headers: { 'x-request-id': 'upstream-request-1' },
  });
  const processor = createOpenAIProcessor(config, { fetchImpl });

  let caught;
  try {
    await processor.process({ session, audio: Buffer.from('audio') });
  } catch (error) {
    caught = error;
  }

  assert(caught instanceof Error);
  assert.match(caught.message, /status 429/);
  assert.match(caught.message, /upstream-request-1/);
  assert.equal(caught.message.includes('secret upstream body'), false);
});

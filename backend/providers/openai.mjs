import { randomUUID } from 'node:crypto';

const ALLOWED_KINDS = new Set(['decision', 'commitment', 'assumption', 'question']);

const MEMORY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    proposals: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          kind: { type: 'string', enum: ['decision', 'commitment', 'assumption', 'question'] },
          statement: { type: 'string', minLength: 1 },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          evidenceQuote: { type: 'string', minLength: 1 },
          rationale: { type: ['string', 'null'] },
          ownerId: { type: ['string', 'null'] },
          dueAt: { type: ['string', 'null'] },
          reviewAt: { type: ['string', 'null'] },
        },
        required: ['kind', 'statement', 'confidence', 'evidenceQuote', 'rationale', 'ownerId', 'dueAt', 'reviewAt'],
      },
    },
  },
  required: ['proposals'],
};

function timeoutSignal(timeoutMs) {
  return AbortSignal.timeout(timeoutMs);
}

function safeProviderError(response, operation) {
  const requestId = response.headers.get('x-request-id') ?? response.headers.get('request-id') ?? undefined;
  const error = new Error(`${operation} failed with upstream status ${response.status}${requestId ? ` (${requestId})` : ''}.`);
  error.name = 'ProviderHttpError';
  error.status = response.status;
  error.requestId = requestId;
  return error;
}

function extractResponseText(payload) {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) return payload.output_text;
  for (const item of payload.output ?? []) {
    if (item?.type !== 'message') continue;
    for (const content of item.content ?? []) {
      if (content?.type === 'output_text' && typeof content.text === 'string' && content.text.trim()) {
        return content.text;
      }
    }
  }
  throw new Error('OpenAI extraction response did not contain output text.');
}

function validOptionalString(value) {
  return value === null || typeof value === 'string';
}

function validateOptionalDate(value, field) {
  if (value === null) return;
  if (typeof value !== 'string' || Number.isNaN(new Date(value).getTime())) {
    throw new Error(`OpenAI extraction returned an invalid ${field}.`);
  }
}

function validateExtractionItem(item, transcriptText) {
  if (!item || typeof item !== 'object') throw new Error('OpenAI extraction returned an invalid proposal.');
  if (!ALLOWED_KINDS.has(item.kind)) throw new Error('OpenAI extraction returned an unsupported proposal kind.');
  if (typeof item.statement !== 'string' || !item.statement.trim()) throw new Error('OpenAI extraction returned an empty proposal statement.');
  if (typeof item.confidence !== 'number' || item.confidence < 0 || item.confidence > 1) throw new Error('OpenAI extraction returned an invalid confidence.');
  if (typeof item.evidenceQuote !== 'string' || !item.evidenceQuote.trim()) throw new Error('OpenAI extraction returned an empty evidence quote.');
  if (!transcriptText.includes(item.evidenceQuote.trim())) throw new Error('OpenAI extraction returned evidence that is not present in the transcript.');
  for (const field of ['rationale', 'ownerId']) {
    if (!validOptionalString(item[field])) throw new Error(`OpenAI extraction returned an invalid ${field}.`);
  }
  validateOptionalDate(item.dueAt, 'dueAt');
  validateOptionalDate(item.reviewAt, 'reviewAt');
  return item;
}

function proposalFromExtraction(item, session, segmentId) {
  const proposal = {
    id: `${session.meetingId}:${item.kind}:${randomUUID()}`,
    kind: item.kind,
    statement: item.statement.trim(),
    confidence: item.confidence,
    evidence: [{
      meetingId: session.meetingId,
      segmentIds: [segmentId],
      speakerId: 'transcript',
      startMs: 0,
      endMs: Math.max(0, session.durationMs || 0),
      quote: item.evidenceQuote.trim(),
    }],
    state: 'proposed',
  };
  if (item.rationale) proposal.rationale = item.rationale.trim();
  if (item.ownerId) proposal.ownerId = item.ownerId.trim();
  if (item.dueAt) proposal.dueAt = new Date(item.dueAt).toISOString();
  if (item.reviewAt) proposal.reviewAt = new Date(item.reviewAt).toISOString();
  return proposal;
}

export function createOpenAIProcessor(config, { fetchImpl = globalThis.fetch } = {}) {
  const provider = config.openai;
  if (!provider?.apiKey) throw new Error('OpenAI processor requires backend-only API configuration.');

  const headers = () => ({ Authorization: `Bearer ${provider.apiKey}` });

  async function transcribe(audio) {
    const form = new FormData();
    form.set('model', provider.transcriptionModel);
    form.set('file', new Blob([audio], { type: 'audio/mp4' }), 'meeting.m4a');

    const response = await fetchImpl(`${provider.baseUrl}/v1/audio/transcriptions`, {
      method: 'POST',
      headers: headers(),
      body: form,
      signal: timeoutSignal(provider.timeoutMs),
    });
    if (!response.ok) throw safeProviderError(response, 'OpenAI transcription');
    const payload = await response.json();
    if (typeof payload.text !== 'string' || !payload.text.trim()) {
      throw new Error('OpenAI transcription response did not contain text.');
    }
    return payload.text.trim();
  }

  async function extract(transcriptText) {
    const response = await fetchImpl(`${provider.baseUrl}/v1/responses`, {
      method: 'POST',
      headers: {
        ...headers(),
        'Content-Type': 'application/json',
      },
      signal: timeoutSignal(provider.timeoutMs),
      body: JSON.stringify({
        model: provider.extractionModel,
        store: false,
        reasoning: { effort: 'low' },
        instructions: [
          'Extract only meeting memory explicitly supported by the supplied transcript.',
          'Do not invent owners, dates, rationale, decisions, commitments, assumptions, or questions.',
          'Use null when an optional field is not stated.',
          'evidenceQuote must be an exact concise quote from the transcript supporting the proposal.',
          'Do not emit contradictions because prior thread evidence is not supplied in this request.',
          'Return proposals for decision, commitment, assumption, or question only.',
        ].join(' '),
        input: transcriptText,
        text: {
          format: {
            type: 'json_schema',
            name: 'convoweave_meeting_memory',
            strict: true,
            schema: MEMORY_SCHEMA,
          },
        },
      }),
    });
    if (!response.ok) throw safeProviderError(response, 'OpenAI structured extraction');
    const payload = await response.json();
    const text = extractResponseText(payload);
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('OpenAI extraction response was not valid structured JSON.');
    }
    if (!Array.isArray(parsed.proposals)) throw new Error('OpenAI extraction response is missing proposals.');
    return parsed.proposals.map((item) => validateExtractionItem(item, transcriptText));
  }

  return {
    name: 'openai',
    async ready() {
      return Boolean(provider.apiKey && provider.transcriptionModel && provider.extractionModel);
    },
    async process({ session, audio }) {
      const transcriptText = await transcribe(audio);
      const segmentId = `${session.meetingId}:segment:transcript`;
      const transcript = {
        meetingId: session.meetingId,
        segments: [{
          id: segmentId,
          meetingId: session.meetingId,
          speakerId: 'transcript',
          startMs: 0,
          endMs: Math.max(0, session.durationMs || 0),
          text: transcriptText,
        }],
      };
      const extracted = await extract(transcriptText);
      const proposals = extracted.map((item) => proposalFromExtraction(item, session, segmentId));
      return {
        transcript,
        review: {
          id: session.meetingId,
          meetingId: session.meetingId,
          transcript,
          proposals,
          updatedAt: new Date().toISOString(),
        },
      };
    },
  };
}

function makeEvidence(meetingId, segmentId, quote, startMs, endMs) {
  return { meetingId, segmentIds: [segmentId], speakerId: 'speaker-1', startMs, endMs, quote };
}

export function createDeterministicProcessor() {
  return {
    name: 'deterministic',
    async ready() {
      return true;
    },
    async process({ session }) {
      const segmentId = `${session.meetingId}:segment:1`;
      const text = 'Remote processing is connected. Review every generated proposal before it becomes durable meeting memory.';
      const transcript = {
        meetingId: session.meetingId,
        segments: [
          {
            id: segmentId,
            meetingId: session.meetingId,
            speakerId: 'speaker-1',
            startMs: 0,
            endMs: Math.max(3000, Math.min(session.durationMs || 3000, 12000)),
            text,
          },
        ],
      };
      const review = {
        id: session.meetingId,
        meetingId: session.meetingId,
        transcript,
        proposals: [
          {
            id: `${session.meetingId}:decision:remote-reference`,
            kind: 'decision',
            statement: 'Keep human review authoritative before remote AI output becomes durable memory.',
            confidence: 0.99,
            evidence: [makeEvidence(session.meetingId, segmentId, text, 0, transcript.segments[0].endMs)],
            state: 'proposed',
          },
        ],
        updatedAt: new Date().toISOString(),
      };
      return { transcript, review };
    },
  };
}

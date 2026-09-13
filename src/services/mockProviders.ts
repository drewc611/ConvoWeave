import type { EvidenceRef, Meeting, MeetingProposal, Transcript } from '../models/domain';
import type { ProviderBundle } from './providers';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function evidence(meetingId: string, quote: string, startMs: number, endMs: number): EvidenceRef {
  return { meetingId, segmentIds: ['mock-segment-1'], startMs, endMs, quote };
}

export const mockProviders: ProviderBundle = {
  transcription: {
    async transcribe(meeting: Meeting): Promise<Transcript> {
      await wait(300);
      return {
        meetingId: meeting.id,
        segments: [
          {
            id: 'mock-segment-1',
            meetingId: meeting.id,
            speakerId: 'speaker-1',
            startMs: 0,
            endMs: Math.max(meeting.durationMs, 12000),
            text: 'We should keep the mobile memory loop first. I will have the onboarding flow ready Friday. The retention assumption still needs validation.',
          },
        ],
      };
    },
  },
  extraction: {
    async extract(meeting: Meeting): Promise<MeetingProposal[]> {
      await wait(200);
      return [
        {
          id: `${meeting.id}:decision:1`,
          kind: 'decision',
          statement: 'Keep the mobile memory loop ahead of calendar integrations.',
          confidence: 0.91,
          evidence: [evidence(meeting.id, 'keep the mobile memory loop first', 1000, 4100)],
          state: 'proposed',
        },
        {
          id: `${meeting.id}:commitment:1`,
          kind: 'commitment',
          statement: 'Onboarding flow will be ready Friday.',
          confidence: 0.84,
          evidence: [evidence(meeting.id, 'I will have the onboarding flow ready Friday', 4300, 7600)],
          state: 'proposed',
        },
        {
          id: `${meeting.id}:assumption:1`,
          kind: 'assumption',
          statement: 'The retention model still needs validation.',
          confidence: 0.77,
          evidence: [evidence(meeting.id, 'retention assumption still needs validation', 7800, 11300)],
          state: 'proposed',
        },
      ];
    },
  },
  contradiction: {
    async inspect(_threadId, proposals) {
      return proposals;
    },
  },
  briefing: {
    async buildBrief() {
      return {
        title: 'Before your next meeting',
        bullets: ['Confirm unresolved decisions', 'Review open commitments', 'Check assumptions that changed'],
      };
    },
  },
};

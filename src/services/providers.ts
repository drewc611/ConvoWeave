import type { Meeting, MeetingProposal, Transcript } from '../models/domain';

export interface TranscriptionProvider {
  transcribe(meeting: Meeting): Promise<Transcript>;
}

export interface ExtractionProvider {
  extract(meeting: Meeting, transcript: Transcript): Promise<MeetingProposal[]>;
}

export interface ContradictionProvider {
  inspect(threadId: string, proposals: MeetingProposal[]): Promise<MeetingProposal[]>;
}

export interface BriefingProvider {
  buildBrief(threadId: string): Promise<{ title: string; bullets: string[] }>;
}

export type ProviderBundle = {
  transcription: TranscriptionProvider;
  extraction: ExtractionProvider;
  contradiction: ContradictionProvider;
  briefing: BriefingProvider;
};

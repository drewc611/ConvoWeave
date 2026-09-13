export type ISODateTime = string;

export type EvidenceRef = {
  meetingId: string;
  segmentIds: string[];
  speakerId?: string;
  startMs: number;
  endMs: number;
  quote?: string;
};

export type MeetingStatus = 'draft' | 'recorded' | 'processing' | 'review' | 'complete';

export type Meeting = {
  id: string;
  threadId?: string;
  title: string;
  startedAt: ISODateTime;
  endedAt?: ISODateTime;
  durationMs: number;
  audioUri?: string;
  status: MeetingStatus;
  transcript?: Transcript;
};

export type TranscriptSegment = {
  id: string;
  meetingId: string;
  speakerId?: string;
  startMs: number;
  endMs: number;
  text: string;
};

export type Transcript = {
  meetingId: string;
  segments: TranscriptSegment[];
};

export type Thread = {
  id: string;
  title: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type DecisionStatus = 'active' | 'superseded' | 'reversed' | 'disputed';

export type Decision = {
  id: string;
  threadId: string;
  statement: string;
  rationale?: string;
  ownerId?: string;
  status: DecisionStatus;
  evidence: EvidenceRef[];
  createdAt: ISODateTime;
  supersedesDecisionId?: string;
  supersededByDecisionId?: string;
};

export type Commitment = {
  id: string;
  threadId: string;
  statement: string;
  ownerId?: string;
  dueAt?: ISODateTime;
  status: 'open' | 'done' | 'cancelled' | 'superseded';
  evidence: EvidenceRef[];
  createdAt: ISODateTime;
  lastUpdatedAt: ISODateTime;
};

export type Assumption = {
  id: string;
  threadId: string;
  statement: string;
  status: 'untested' | 'supported' | 'disproven' | 'expired';
  evidence: EvidenceRef[];
  reviewAt?: ISODateTime;
};

export type Contradiction = {
  id: string;
  threadId: string;
  currentEvidence: EvidenceRef;
  priorEvidence: EvidenceRef;
  explanation: string;
  confidence: number;
  status: 'proposed' | 'dismissed' | 'resolved';
};

export type PrivateNote = {
  id: string;
  meetingId?: string;
  threadId?: string;
  body: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  promotedAt?: ISODateTime;
};

export type ProposalKind = 'decision' | 'commitment' | 'assumption' | 'question' | 'contradiction';
export type ProposalState = 'proposed' | 'accepted' | 'rejected';

export type MeetingProposal = {
  id: string;
  kind: ProposalKind;
  statement: string;
  confidence: number;
  evidence: EvidenceRef[];
  priorEvidence?: EvidenceRef[];
  state: ProposalState;
  ownerId?: string;
  dueAt?: ISODateTime;
  rationale?: string;
  reviewAt?: ISODateTime;
};

export type MeetingReview = {
  id: string;
  meetingId: string;
  transcript: Transcript;
  proposals: MeetingProposal[];
  updatedAt: ISODateTime;
};

export type MemoryChangeKind = 'decision' | 'commitment' | 'assumption';
export type MemoryChangeType = 'new' | 'changed' | 'superseded' | 'removed' | 'unresolved';

export type MemoryChange = {
  kind: MemoryChangeKind;
  id: string;
  change: MemoryChangeType;
  label: string;
};

export type MeetingChangeSet = {
  id: string;
  meetingId: string;
  threadId: string;
  changes: MemoryChange[];
  createdAt: ISODateTime;
};

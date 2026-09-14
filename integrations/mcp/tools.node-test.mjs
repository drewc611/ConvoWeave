import test from 'node:test';
import assert from 'node:assert/strict';
import { capabilities, explainChanges, prepareBrief, structureMeeting } from './tools.mjs';

test('capabilities advertises portable source-backed workflows', () => {
  const result = capabilities();
  assert.equal(result.product, 'ConvoWeave');
  assert.equal(result.mode, 'stateless');
  assert.ok(result.tools.includes('convoweave_structure_meeting'));
});

test('structureMeeting requires evidence quotes from supplied notes', () => {
  assert.throws(() => structureMeeting({
    meetingId: 'm1',
    notes: 'We agreed to launch Friday.',
    decisions: [{ statement: 'Launch Friday', evidenceQuote: 'Launch Monday' }],
  }), /evidenceQuote/);
});

test('structureMeeting returns proposed source-backed memory', () => {
  const result = structureMeeting({
    meetingId: 'm1',
    threadId: 't1',
    notes: 'We agreed to launch Friday. Andrew will prepare the release checklist by Thursday.',
    decisions: [{ statement: 'Launch Friday', evidenceQuote: 'agreed to launch Friday' }],
    commitments: [{ statement: 'Prepare release checklist', evidenceQuote: 'Andrew will prepare the release checklist by Thursday', owner: 'Andrew', dueAt: '2026-09-17' }],
    assumptions: [],
  });
  assert.equal(result.reviewRequired, true);
  assert.equal(result.decisions[0].status, 'proposed');
  assert.equal(result.commitments[0].evidence.source, 'host-supplied-notes');
  assert.equal(result.commitments[0].owner, 'Andrew');
});

test('prepareBrief surfaces overdue work and unresolved assumptions deterministically', () => {
  const result = prepareBrief({
    threadTitle: 'Launch',
    decisions: [{ id: 'd1', status: 'active', statement: 'Launch Friday' }],
    commitments: [{ id: 'c1', status: 'open', dueAt: '2026-09-10T00:00:00Z', statement: 'Checklist' }],
    assumptions: [{ id: 'a1', status: 'untested', statement: 'Store review clears' }],
  }, new Date('2026-09-14T12:00:00Z'));
  assert.deepEqual(result.overdueCommitmentIds, ['c1']);
  assert.deepEqual(result.unresolvedAssumptionIds, ['a1']);
  assert.match(result.title, /Launch/);
});

test('explainChanges reports added, removed, and changed state', () => {
  const result = explainChanges({
    prior: {
      decisions: [{ id: 'd1', status: 'active', statement: 'A' }],
      commitments: [{ id: 'c1', status: 'open', statement: 'Old' }],
      assumptions: [{ id: 'a1', status: 'untested', statement: 'X' }],
    },
    current: {
      decisions: [{ id: 'd1', status: 'superseded', statement: 'A' }, { id: 'd2', status: 'active', statement: 'B' }],
      commitments: [],
      assumptions: [{ id: 'a1', status: 'supported', statement: 'X' }],
    },
  });
  assert.equal(result.decisions.added[0].id, 'd2');
  assert.equal(result.decisions.changed[0].id, 'd1');
  assert.equal(result.commitments.removed[0].id, 'c1');
  assert.equal(result.assumptions.changed[0].id, 'a1');
});

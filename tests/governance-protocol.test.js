///
/// tests/governance-protocol.test.js
///
/// Comprehensive test coverage for sdk/governance-protocol/src/index.js
///
/// Covers:
///   - Proposal: construction, voting, outcome checking, JSON serialization
///   - PolicyRegistry: policy enactment, revocation, active policy tracking
///   - GovernanceEngine: proposal submission, voting, quorum, policy lifecycle
///

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  Proposal,
  PolicyRegistry,
  GovernanceEngine,
} from '../sdk/governance-protocol/src/index.js';

// ─── Proposal ─────────────────────────────────────────────────────────────────

describe('Proposal', () => {
  test('constructs with required fields', () => {
    const proposal = new Proposal({
      title: 'Test Proposal',
      description: 'A test proposal description',
      proposer: 'org1',
    });

    assert.ok(proposal.id.startsWith('prop_'));
    assert.strictEqual(proposal.title, 'Test Proposal');
    assert.strictEqual(proposal.description, 'A test proposal description');
    assert.strictEqual(proposal.proposer, 'org1');
    assert.strictEqual(proposal.impact, 'medium');
    assert.strictEqual(proposal.cost, 0);
    assert.strictEqual(proposal.status, 'voting');
    assert.deepStrictEqual(proposal.votes, { for: 0, against: 0, abstain: 0 });
  });

  test('constructs with custom impact and cost', () => {
    const proposal = new Proposal({
      title: 'Critical Proposal',
      description: 'High impact proposal',
      proposer: 'org1',
      impact: 'critical',
      cost: 10000,
    });

    assert.strictEqual(proposal.impact, 'critical');
    assert.strictEqual(proposal.cost, 10000);
  });

  test('isActive returns true for new proposals', () => {
    const proposal = new Proposal({
      title: 'Test',
      description: 'Test',
      proposer: 'org1',
    });

    assert.strictEqual(proposal.isActive(), true);
  });

  test('isActive returns false when status is not voting', () => {
    const proposal = new Proposal({
      title: 'Test',
      description: 'Test',
      proposer: 'org1',
    });

    proposal.status = 'passed';
    assert.strictEqual(proposal.isActive(), false);
  });

  test('castVote increments for votes', () => {
    const proposal = new Proposal({
      title: 'Test',
      description: 'Test',
      proposer: 'org1',
    });

    proposal.castVote('voter1', 'for');
    assert.strictEqual(proposal.votes.for, 1);
    assert.strictEqual(proposal.voters.size, 1);
  });

  test('castVote increments against votes', () => {
    const proposal = new Proposal({
      title: 'Test',
      description: 'Test',
      proposer: 'org1',
    });

    proposal.castVote('voter1', 'against');
    assert.strictEqual(proposal.votes.against, 1);
  });

  test('castVote increments abstain votes', () => {
    const proposal = new Proposal({
      title: 'Test',
      description: 'Test',
      proposer: 'org1',
    });

    proposal.castVote('voter1', 'abstain');
    assert.strictEqual(proposal.votes.abstain, 1);
  });

  test('castVote throws for duplicate voter', () => {
    const proposal = new Proposal({
      title: 'Test',
      description: 'Test',
      proposer: 'org1',
    });

    proposal.castVote('voter1', 'for');
    assert.throws(() => proposal.castVote('voter1', 'for'), /already voted/);
  });

  test('castVote throws when voting period ended', () => {
    const proposal = new Proposal({
      title: 'Test',
      description: 'Test',
      proposer: 'org1',
    });

    proposal.endsAt = Date.now() - 1000; // Expired
    assert.throws(() => proposal.castVote('voter1', 'for'), /voting period ended/);
  });

  test('checkOutcome returns pending for active proposal', () => {
    const proposal = new Proposal({
      title: 'Test',
      description: 'Test',
      proposer: 'org1',
    });

    const result = proposal.checkOutcome();
    assert.strictEqual(result.outcome, 'pending');
  });

  test('checkOutcome returns rejected when no votes after expiry', () => {
    const proposal = new Proposal({
      title: 'Test',
      description: 'Test',
      proposer: 'org1',
    });

    proposal.endsAt = Date.now() - 1000;
    const result = proposal.checkOutcome();
    assert.strictEqual(result.outcome, 'rejected');
    assert.strictEqual(result.reason, 'no_votes');
  });

  test('checkOutcome returns passed with supermajority', () => {
    const proposal = new Proposal({
      title: 'Test',
      description: 'Test',
      proposer: 'org1',
    });

    proposal.votes = { for: 7, against: 3, abstain: 0 };
    proposal.endsAt = Date.now() - 1000;

    const result = proposal.checkOutcome();
    assert.strictEqual(result.outcome, 'passed');
    assert.ok(result.approval >= 0.66);
  });

  test('checkOutcome returns rejected without supermajority', () => {
    const proposal = new Proposal({
      title: 'Test',
      description: 'Test',
      proposer: 'org1',
    });

    proposal.votes = { for: 4, against: 6, abstain: 0 };
    proposal.endsAt = Date.now() - 1000;

    const result = proposal.checkOutcome();
    assert.strictEqual(result.outcome, 'rejected');
    assert.ok(result.approval < 0.66);
  });

  test('toJSON returns expected structure', () => {
    const proposal = new Proposal({
      title: 'Test',
      description: 'Test description',
      proposer: 'org1',
      impact: 'high',
      cost: 500,
    });

    const json = proposal.toJSON();

    assert.ok('id' in json);
    assert.strictEqual(json.title, 'Test');
    assert.strictEqual(json.description, 'Test description');
    assert.strictEqual(json.proposer, 'org1');
    assert.strictEqual(json.impact, 'high');
    assert.strictEqual(json.cost, 500);
    assert.strictEqual(json.status, 'voting');
    assert.deepStrictEqual(json.votes, { for: 0, against: 0, abstain: 0 });
    assert.strictEqual(json.totalVoters, 0);
  });
});

// ─── PolicyRegistry ───────────────────────────────────────────────────────────

describe('PolicyRegistry', () => {
  test('constructs with empty state', () => {
    const registry = new PolicyRegistry();
    assert.strictEqual(registry.policies.size, 0);
    assert.strictEqual(registry.activeCount, 0);
  });

  test('enact creates policy from proposal', () => {
    const registry = new PolicyRegistry();
    const proposal = new Proposal({
      title: 'Test Policy',
      description: 'Test description',
      proposer: 'org1',
      impact: 'high',
    });

    const policy = registry.enact(proposal);

    assert.ok(policy.id.startsWith('policy_'));
    assert.strictEqual(policy.proposalId, proposal.id);
    assert.strictEqual(policy.title, 'Test Policy');
    assert.strictEqual(policy.description, 'Test description');
    assert.strictEqual(policy.enactedBy, 'org1');
    assert.strictEqual(policy.active, true);
    assert.strictEqual(policy.impact, 'high');
    assert.strictEqual(registry.activeCount, 1);
  });

  test('enact increments policy IDs', () => {
    const registry = new PolicyRegistry();

    const proposal1 = new Proposal({ title: 'P1', description: 'D1', proposer: 'org1' });
    const proposal2 = new Proposal({ title: 'P2', description: 'D2', proposer: 'org2' });

    const policy1 = registry.enact(proposal1);
    const policy2 = registry.enact(proposal2);

    assert.strictEqual(policy1.id, 'policy_1');
    assert.strictEqual(policy2.id, 'policy_2');
    assert.strictEqual(registry.activeCount, 2);
  });

  test('revoke deactivates policy', () => {
    const registry = new PolicyRegistry();
    const proposal = new Proposal({ title: 'Test', description: 'Test', proposer: 'org1' });
    const policy = registry.enact(proposal);

    const result = registry.revoke(policy.id);

    assert.strictEqual(result, true);
    assert.strictEqual(policy.active, false);
    assert.ok('revokedAt' in policy);
    assert.strictEqual(registry.activeCount, 0);
  });

  test('revoke returns false for unknown policy', () => {
    const registry = new PolicyRegistry();
    const result = registry.revoke('unknown_policy');
    assert.strictEqual(result, false);
  });

  test('revoke returns false for already revoked policy', () => {
    const registry = new PolicyRegistry();
    const proposal = new Proposal({ title: 'Test', description: 'Test', proposer: 'org1' });
    const policy = registry.enact(proposal);

    registry.revoke(policy.id);
    const result = registry.revoke(policy.id);

    assert.strictEqual(result, false);
  });

  test('getActive returns only active policies', () => {
    const registry = new PolicyRegistry();

    const p1 = new Proposal({ title: 'P1', description: 'D1', proposer: 'org1' });
    const p2 = new Proposal({ title: 'P2', description: 'D2', proposer: 'org2' });
    const p3 = new Proposal({ title: 'P3', description: 'D3', proposer: 'org3' });

    registry.enact(p1);
    const policy2 = registry.enact(p2);
    registry.enact(p3);

    registry.revoke(policy2.id);

    const active = registry.getActive();
    assert.strictEqual(active.length, 2);
    assert.ok(active.every(p => p.active === true));
  });

  test('get returns policy by ID', () => {
    const registry = new PolicyRegistry();
    const proposal = new Proposal({ title: 'Test', description: 'Test', proposer: 'org1' });
    const policy = registry.enact(proposal);

    const retrieved = registry.get(policy.id);
    assert.strictEqual(retrieved, policy);
  });

  test('get returns undefined for unknown ID', () => {
    const registry = new PolicyRegistry();
    const result = registry.get('unknown');
    assert.strictEqual(result, undefined);
  });
});

// ─── GovernanceEngine ─────────────────────────────────────────────────────────

describe('GovernanceEngine', () => {
  test('constructs with organismId', () => {
    const engine = new GovernanceEngine({ organismId: 'org1' });

    assert.strictEqual(engine.organismId, 'org1');
    assert.ok(engine.participants.has('org1'));
    assert.strictEqual(engine.proposals.size, 0);
    assert.strictEqual(engine.quorumRequirement, 0.3);
    assert.strictEqual(engine.approvalThreshold, 0.66);
  });

  test('constructs with additional participants', () => {
    const engine = new GovernanceEngine({
      organismId: 'org1',
      participants: ['org2', 'org3'],
    });

    assert.strictEqual(engine.participants.size, 3);
    assert.ok(engine.participants.has('org1'));
    assert.ok(engine.participants.has('org2'));
    assert.ok(engine.participants.has('org3'));
  });

  test('submitProposal creates and stores proposal', () => {
    const engine = new GovernanceEngine({ organismId: 'org1' });

    const proposal = engine.submitProposal({
      title: 'Test Proposal',
      description: 'Test description',
      impact: 'high',
      cost: 1000,
    });

    assert.ok(proposal instanceof Proposal);
    assert.strictEqual(proposal.title, 'Test Proposal');
    assert.strictEqual(proposal.proposer, 'org1');
    assert.strictEqual(engine.proposals.size, 1);
  });

  test('submitProposal throws without title', () => {
    const engine = new GovernanceEngine({ organismId: 'org1' });

    assert.throws(
      () => engine.submitProposal({ description: 'Test' }),
      /Title and description required/
    );
  });

  test('submitProposal throws without description', () => {
    const engine = new GovernanceEngine({ organismId: 'org1' });

    assert.throws(
      () => engine.submitProposal({ title: 'Test' }),
      /Title and description required/
    );
  });

  test('getProposal retrieves stored proposal', () => {
    const engine = new GovernanceEngine({ organismId: 'org1' });
    const proposal = engine.submitProposal({
      title: 'Test',
      description: 'Test',
    });

    const retrieved = engine.getProposal(proposal.id);
    assert.strictEqual(retrieved, proposal);
  });

  test('getActiveProposals returns only active proposals', () => {
    const engine = new GovernanceEngine({ organismId: 'org1' });

    const p1 = engine.submitProposal({ title: 'P1', description: 'D1' });
    const p2 = engine.submitProposal({ title: 'P2', description: 'D2' });

    p2.status = 'passed';

    const active = engine.getActiveProposals();
    assert.strictEqual(active.length, 1);
    assert.strictEqual(active[0].id, p1.id);
  });

  test('vote casts vote and records history', () => {
    const engine = new GovernanceEngine({ organismId: 'org1' });
    const proposal = engine.submitProposal({
      title: 'Test',
      description: 'Test',
    });

    const result = engine.vote(proposal.id, 'for');

    assert.strictEqual(result.outcome, 'pending');
    assert.strictEqual(proposal.votes.for, 1);
    assert.strictEqual(engine.votingHistory.length, 1);
    assert.strictEqual(engine.votingHistory[0].vote, 'for');
  });

  test('vote throws for unknown proposal', () => {
    const engine = new GovernanceEngine({ organismId: 'org1' });

    assert.throws(
      () => engine.vote('unknown', 'for'),
      /Proposal not found/
    );
  });

  test('checkQuorum returns correct participation', () => {
    const engine = new GovernanceEngine({
      organismId: 'org1',
      participants: ['org2', 'org3', 'org4', 'org5'],
    });

    const proposal = engine.submitProposal({
      title: 'Test',
      description: 'Test',
    });

    proposal.voters.add('org1');
    proposal.voters.add('org2');

    const quorum = engine.checkQuorum(proposal.id);

    assert.strictEqual(quorum.voters, 2);
    assert.strictEqual(quorum.totalParticipants, 5);
    assert.strictEqual(quorum.participation, 0.4);
    assert.strictEqual(quorum.met, true); // 40% >= 30%
  });

  test('checkQuorum returns not_found for unknown proposal', () => {
    const engine = new GovernanceEngine({ organismId: 'org1' });
    const result = engine.checkQuorum('unknown');
    assert.strictEqual(result.met, false);
    assert.strictEqual(result.reason, 'not_found');
  });

  test('countVotes calculates correct approval', () => {
    const engine = new GovernanceEngine({ organismId: 'org1' });
    const proposal = engine.submitProposal({
      title: 'Test',
      description: 'Test',
    });

    proposal.votes = { for: 7, against: 3, abstain: 2 };
    proposal.voters = new Set(['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10', 'v11', 'v12']);

    const counts = engine.countVotes(proposal.id);

    assert.strictEqual(counts.total, 12);
    assert.strictEqual(counts.approval, 0.7); // 7/(7+3)
    assert.strictEqual(counts.passed, true); // 70% >= 66%
  });

  test('countVotes returns null for unknown proposal', () => {
    const engine = new GovernanceEngine({ organismId: 'org1' });
    const result = engine.countVotes('unknown');
    assert.strictEqual(result, null);
  });

  test('enactProposal creates policy for passed proposal', () => {
    const engine = new GovernanceEngine({ organismId: 'org1' });
    const proposal = engine.submitProposal({
      title: 'Test Policy',
      description: 'Test description',
    });

    proposal.status = 'passed';

    const result = engine.enactProposal(proposal.id);

    assert.strictEqual(result.enacted, true);
    assert.ok('policy' in result);
    assert.strictEqual(result.policy.title, 'Test Policy');
    assert.strictEqual(proposal.status, 'enacted');
  });

  test('enactProposal throws for non-passed proposal', () => {
    const engine = new GovernanceEngine({ organismId: 'org1' });
    const proposal = engine.submitProposal({
      title: 'Test',
      description: 'Test',
    });

    assert.throws(
      () => engine.enactProposal(proposal.id),
      /has not passed/
    );
  });

  test('enactProposal throws for unknown proposal', () => {
    const engine = new GovernanceEngine({ organismId: 'org1' });

    assert.throws(
      () => engine.enactProposal('unknown'),
      /Proposal not found/
    );
  });

  test('revokePolicy delegates to registry', () => {
    const engine = new GovernanceEngine({ organismId: 'org1' });
    const proposal = engine.submitProposal({
      title: 'Test',
      description: 'Test',
    });

    proposal.status = 'passed';
    const { policy } = engine.enactProposal(proposal.id);

    const result = engine.revokePolicy(policy.id);
    assert.strictEqual(result, true);
  });

  test('addParticipant adds new participant', () => {
    const engine = new GovernanceEngine({ organismId: 'org1' });

    engine.addParticipant('org2');

    assert.strictEqual(engine.participants.size, 2);
    assert.ok(engine.participants.has('org2'));
  });

  test('removeParticipant removes participant', () => {
    const engine = new GovernanceEngine({
      organismId: 'org1',
      participants: ['org2'],
    });

    engine.removeParticipant('org2');

    assert.strictEqual(engine.participants.size, 1);
    assert.ok(!engine.participants.has('org2'));
  });

  test('getGovernanceStats returns expected structure', () => {
    const engine = new GovernanceEngine({
      organismId: 'org1',
      participants: ['org2', 'org3'],
    });

    const p1 = engine.submitProposal({ title: 'P1', description: 'D1' });
    const p2 = engine.submitProposal({ title: 'P2', description: 'D2' });

    p1.status = 'passed';
    p2.status = 'rejected';

    const stats = engine.getGovernanceStats();

    assert.strictEqual(stats.organismId, 'org1');
    assert.strictEqual(stats.participants, 3);
    assert.strictEqual(stats.totalProposals, 2);
    assert.strictEqual(stats.passedProposals, 1);
    assert.strictEqual(stats.rejectedProposals, 1);
    assert.strictEqual(stats.passRate, 0.5);
  });

  test('getStatus returns expected structure', () => {
    const engine = new GovernanceEngine({
      organismId: 'org1',
      participants: ['org2'],
    });

    engine.submitProposal({ title: 'Test', description: 'Test' });

    const status = engine.getStatus();

    assert.strictEqual(status.organismId, 'org1');
    assert.strictEqual(status.participants, 2);
    assert.strictEqual(status.proposals, 1);
    assert.strictEqual(status.activeProposals, 1);
    assert.strictEqual(status.quorumRequirement, 0.3);
    assert.strictEqual(status.approvalThreshold, 0.66);
  });
});

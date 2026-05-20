///
/// tests/consensus-protocol.test.js
///
/// Comprehensive test coverage for sdk/consensus-protocol/src/index.js
///
/// Covers:
///   - Vote: construction, signature generation, verify
///   - ConsensusRound: construction, castVote, checkComplete, tallyVotes, getStatus
///   - RaftLeader: construction, addFollower, removeFollower, incrementTerm, heartbeat
///   - ConsensusEngine: propose, vote, requestVote, becomeLeader, receiveHeartbeat
///   - Two-phase commit: prepareTransaction, commitTransaction, abortTransaction
///   - Tie-breaking: resolveTie with φ-based reputation
///

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  Vote,
  ConsensusRound,
  RaftLeader,
  ConsensusEngine,
} from '../sdk/consensus-protocol/src/index.js';

// ─── Vote ─────────────────────────────────────────────────────────────────

describe('Vote', () => {
  test('constructs with voterId and decision', () => {
    const vote = new Vote({ voterId: 'org1', decision: 'yes' });
    assert.strictEqual(vote.voterId, 'org1');
    assert.strictEqual(vote.decision, 'yes');
    assert.ok(vote.timestamp > 0);
    assert.ok(vote.signature !== null);
  });

  test('generates signature automatically if not provided', () => {
    const vote = new Vote({ voterId: 'org1', decision: 'approve' });
    assert.ok(typeof vote.signature === 'number');
    assert.ok(vote.signature > 0);
  });

  test('signature is deterministic for same inputs', () => {
    const ts = 1700000000000;
    const v1 = new Vote({ voterId: 'org1', decision: 'yes', timestamp: ts });
    const v2 = new Vote({ voterId: 'org1', decision: 'yes', timestamp: ts });
    assert.strictEqual(v1.signature, v2.signature);
  });

  test('signature differs for different decisions', () => {
    const ts = 1700000000000;
    const v1 = new Vote({ voterId: 'org1', decision: 'yes', timestamp: ts });
    const v2 = new Vote({ voterId: 'org1', decision: 'no', timestamp: ts });
    assert.notStrictEqual(v1.signature, v2.signature);
  });

  test('verify returns true for valid vote', () => {
    const vote = new Vote({ voterId: 'org1', decision: 'yes' });
    assert.ok(vote.verify());
  });

  test('verify returns false for tampered vote', () => {
    const vote = new Vote({ voterId: 'org1', decision: 'yes' });
    vote.decision = 'no'; // Tamper with the decision
    assert.ok(!vote.verify());
  });
});

// ─── ConsensusRound ───────────────────────────────────────────────────────

describe('ConsensusRound', () => {
  test('constructs with roundId and participants', () => {
    const round = new ConsensusRound({
      roundId: 'round_1',
      participants: ['org1', 'org2', 'org3'],
    });
    assert.strictEqual(round.roundId, 'round_1');
    assert.strictEqual(round.participants.size, 3);
    assert.strictEqual(round.status, 'pending');
    assert.strictEqual(round.result, null);
  });

  test('castVote adds valid vote to the round', () => {
    const round = new ConsensusRound({
      roundId: 'round_1',
      participants: ['org1', 'org2', 'org3'],
    });
    const vote = new Vote({ voterId: 'org1', decision: 'yes' });
    round.castVote(vote);
    assert.strictEqual(round.votes.size, 1);
    assert.ok(round.votes.has('org1'));
  });

  test('castVote throws for non-participant', () => {
    const round = new ConsensusRound({
      roundId: 'round_1',
      participants: ['org1', 'org2'],
    });
    const vote = new Vote({ voterId: 'org3', decision: 'yes' });
    assert.throws(() => round.castVote(vote), /not in participant list/);
  });

  test('castVote throws for invalid signature', () => {
    const round = new ConsensusRound({
      roundId: 'round_1',
      participants: ['org1', 'org2'],
    });
    const vote = new Vote({ voterId: 'org1', decision: 'yes' });
    vote.decision = 'no'; // Tamper to invalidate signature
    assert.throws(() => round.castVote(vote), /Invalid vote signature/);
  });

  test('castVote throws for non-pending round', () => {
    const round = new ConsensusRound({
      roundId: 'round_1',
      participants: ['org1', 'org2'],
      quorum: 0.5,
    });
    // Cast enough votes to complete
    round.castVote(new Vote({ voterId: 'org1', decision: 'yes' }));
    // Round should now be complete
    assert.strictEqual(round.status, 'complete');
    // Try to cast another vote
    const lateVote = new Vote({ voterId: 'org2', decision: 'yes' });
    assert.throws(() => round.castVote(lateVote), /is complete/);
  });

  test('checkComplete returns true when quorum reached', () => {
    const round = new ConsensusRound({
      roundId: 'round_1',
      participants: ['org1', 'org2', 'org3', 'org4'],
      quorum: 0.51,
    });
    round.castVote(new Vote({ voterId: 'org1', decision: 'yes' }));
    round.castVote(new Vote({ voterId: 'org2', decision: 'yes' }));
    // 2/4 = 50%, need 51% = 3 votes
    assert.strictEqual(round.status, 'pending');
    round.castVote(new Vote({ voterId: 'org3', decision: 'yes' }));
    // 3/4 = 75%, quorum reached
    assert.strictEqual(round.status, 'complete');
  });

  test('checkComplete detects timeout', () => {
    const round = new ConsensusRound({
      roundId: 'round_1',
      participants: ['org1', 'org2'],
      timeout: 1, // 1ms timeout
    });
    // Manually set startTime to trigger timeout
    round.startTime = Date.now() - 100;
    round.checkComplete();
    assert.strictEqual(round.status, 'timeout');
  });

  test('tallyVotes returns correct winner', () => {
    const round = new ConsensusRound({
      roundId: 'round_1',
      participants: ['org1', 'org2', 'org3', 'org4', 'org5'],
      quorum: 0.4,
    });
    round.castVote(new Vote({ voterId: 'org1', decision: 'approve' }));
    round.castVote(new Vote({ voterId: 'org2', decision: 'approve' }));
    // Quorum reached after 2/5 = 40%
    
    assert.strictEqual(round.result.decision, 'approve');
    assert.strictEqual(round.result.votes, 2);
  });

  test('tallyVotes handles mixed votes', () => {
    const round = new ConsensusRound({
      roundId: 'round_1',
      participants: ['org1', 'org2', 'org3', 'org4', 'org5'],
      quorum: 0.8, // Need 4 votes
    });
    round.castVote(new Vote({ voterId: 'org1', decision: 'yes' }));
    round.castVote(new Vote({ voterId: 'org2', decision: 'no' }));
    round.castVote(new Vote({ voterId: 'org3', decision: 'yes' }));
    round.castVote(new Vote({ voterId: 'org4', decision: 'yes' }));
    
    assert.strictEqual(round.result.decision, 'yes');
    assert.strictEqual(round.result.votes, 3);
    assert.strictEqual(round.result.tally['no'], 1);
  });

  test('getStatus returns expected shape', () => {
    const round = new ConsensusRound({
      roundId: 'round_1',
      participants: ['org1', 'org2'],
    });
    const status = round.getStatus();
    assert.strictEqual(status.roundId, 'round_1');
    assert.strictEqual(status.status, 'pending');
    assert.strictEqual(status.votes, 0);
    // ceil(2 * 0.51) = ceil(1.02) = 2
    assert.strictEqual(status.required, 2);
    assert.strictEqual(status.participants, 2);
    assert.ok('elapsed' in status);
    assert.strictEqual(status.result, null);
  });
});

// ─── RaftLeader ───────────────────────────────────────────────────────────

describe('RaftLeader', () => {
  test('constructs with leaderId and term', () => {
    const leader = new RaftLeader({ leaderId: 'leader1', term: 5 });
    assert.strictEqual(leader.leaderId, 'leader1');
    assert.strictEqual(leader.term, 5);
    assert.strictEqual(leader.followers.size, 0);
  });

  test('addFollower increases follower count', () => {
    const leader = new RaftLeader({ leaderId: 'leader1' });
    leader.addFollower('follower1');
    leader.addFollower('follower2');
    assert.strictEqual(leader.followers.size, 2);
    assert.ok(leader.followers.has('follower1'));
    assert.ok(leader.followers.has('follower2'));
  });

  test('removeFollower decreases follower count', () => {
    const leader = new RaftLeader({ leaderId: 'leader1' });
    leader.addFollower('follower1');
    leader.addFollower('follower2');
    leader.removeFollower('follower1');
    assert.strictEqual(leader.followers.size, 1);
    assert.ok(!leader.followers.has('follower1'));
    assert.ok(leader.followers.has('follower2'));
  });

  test('incrementTerm increases term by 1', () => {
    const leader = new RaftLeader({ leaderId: 'leader1', term: 0 });
    assert.strictEqual(leader.incrementTerm(), 1);
    assert.strictEqual(leader.incrementTerm(), 2);
    assert.strictEqual(leader.term, 2);
  });

  test('startHeartbeat calls callback with expected data', async () => {
    const leader = new RaftLeader({ leaderId: 'leader1', term: 3 });
    
    // Use a promise that resolves when the callback is called
    const receivedPromise = new Promise((resolve) => {
      leader.startHeartbeat((data) => {
        leader.stopHeartbeat(); // Stop after first callback
        resolve(data);
      });
    });
    
    // Set a reasonable timeout to wait for the first heartbeat
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Heartbeat timeout')), 1500)
    );
    
    const received = await Promise.race([receivedPromise, timeoutPromise]);
    
    assert.ok(received !== null);
    assert.strictEqual(received.leaderId, 'leader1');
    assert.strictEqual(received.term, 3);
    assert.ok('timestamp' in received);
  });

  test('stopHeartbeat clears the interval', () => {
    const leader = new RaftLeader({ leaderId: 'leader1' });
    leader.startHeartbeat(() => {});
    assert.ok(leader.heartbeatInterval !== null);
    leader.stopHeartbeat();
    assert.strictEqual(leader.heartbeatInterval, null);
  });
});

// ─── ConsensusEngine ──────────────────────────────────────────────────────

describe('ConsensusEngine', () => {
  test('constructs with organismId and participants', () => {
    const engine = new ConsensusEngine({
      organismId: 'org1',
      participants: ['org2', 'org3'],
    });
    assert.strictEqual(engine.organismId, 'org1');
    // org1 is added to participants automatically
    assert.strictEqual(engine.participants.size, 3);
    assert.ok(engine.participants.has('org1'));
  });

  test('propose creates a new ConsensusRound', () => {
    const engine = new ConsensusEngine({
      organismId: 'org1',
      participants: ['org2', 'org3'],
    });
    const round = engine.propose('approve-budget', 0.51);
    assert.ok(round instanceof ConsensusRound);
    assert.ok(round.roundId.startsWith('round_'));
    assert.strictEqual(engine.rounds.size, 1);
  });

  test('vote casts vote in the specified round', () => {
    const engine = new ConsensusEngine({
      organismId: 'org1',
      participants: ['org2', 'org3'],
    });
    const round = engine.propose('approve-budget', 0.4);
    engine.vote(round.roundId, 'yes');
    assert.strictEqual(round.votes.size, 1);
    assert.ok(round.votes.has('org1'));
  });

  test('vote throws for unknown round', () => {
    const engine = new ConsensusEngine({ organismId: 'org1' });
    assert.throws(() => engine.vote('unknown_round', 'yes'), /not found/);
  });

  test('requestVote grants vote for higher term', () => {
    const engine = new ConsensusEngine({ organismId: 'org1' });
    const result = engine.requestVote('candidate1', 5);
    assert.strictEqual(result.granted, true);
    assert.strictEqual(engine.currentTerm, 5);
  });

  test('requestVote denies for lower term', () => {
    const engine = new ConsensusEngine({ organismId: 'org1' });
    engine.currentTerm = 10;
    const result = engine.requestVote('candidate1', 5);
    assert.strictEqual(result.granted, false);
    assert.strictEqual(result.term, 10);
  });

  test('requestVote denies if already voted this term', () => {
    const engine = new ConsensusEngine({ organismId: 'org1' });
    engine.requestVote('candidate1', 5);
    const result = engine.requestVote('candidate2', 5);
    assert.strictEqual(result.granted, false);
  });

  test('becomeLeader creates a RaftLeader instance', () => {
    const engine = new ConsensusEngine({ organismId: 'org1' });
    const leader = engine.becomeLeader();
    assert.ok(leader instanceof RaftLeader);
    assert.strictEqual(leader.leaderId, 'org1');
    assert.strictEqual(engine.currentTerm, 1);
    leader.stopHeartbeat();
  });

  test('receiveHeartbeat acknowledges valid leader heartbeat', () => {
    const engine = new ConsensusEngine({ organismId: 'org1' });
    engine.currentTerm = 3;
    const result = engine.receiveHeartbeat('leader1', 5);
    assert.strictEqual(result.acknowledged, true);
    assert.strictEqual(engine.currentTerm, 5);
  });

  test('receiveHeartbeat rejects old term heartbeat', () => {
    const engine = new ConsensusEngine({ organismId: 'org1' });
    engine.currentTerm = 10;
    const result = engine.receiveHeartbeat('leader1', 5);
    assert.strictEqual(result.acknowledged, false);
  });

  test('prepareTransaction returns expected structure', () => {
    const engine = new ConsensusEngine({ organismId: 'org1' });
    const result = engine.prepareTransaction('tx_123', { amount: 100 });
    assert.strictEqual(result.transactionId, 'tx_123');
    assert.strictEqual(result.phase, 'prepare');
    assert.strictEqual(result.organismId, 'org1');
    assert.strictEqual(result.ready, true);
    assert.deepStrictEqual(result.data, { amount: 100 });
  });

  test('commitTransaction returns expected structure', () => {
    const engine = new ConsensusEngine({ organismId: 'org1' });
    const result = engine.commitTransaction('tx_123');
    assert.strictEqual(result.transactionId, 'tx_123');
    assert.strictEqual(result.phase, 'commit');
    assert.strictEqual(result.committed, true);
  });

  test('abortTransaction returns expected structure', () => {
    const engine = new ConsensusEngine({ organismId: 'org1' });
    const result = engine.abortTransaction('tx_123', 'insufficient funds');
    assert.strictEqual(result.transactionId, 'tx_123');
    assert.strictEqual(result.phase, 'abort');
    assert.strictEqual(result.aborted, true);
    assert.strictEqual(result.reason, 'insufficient funds');
  });

  test('resolveTie uses φ-weighted reputation', () => {
    const engine = new ConsensusEngine({ organismId: 'org1' });
    const options = ['optionA', 'optionB', 'optionC'];
    const reputations = {
      optionA: 0.3,
      optionB: 0.7,
      optionC: 0.5,
    };
    const winner = engine.resolveTie(options, reputations);
    // optionB has highest reputation (0.7 * φ ≈ 1.13)
    assert.strictEqual(winner, 'optionB');
  });

  test('resolveTie uses default reputation 0.5 for unknown options', () => {
    const engine = new ConsensusEngine({ organismId: 'org1' });
    const options = ['optionA', 'optionB'];
    const reputations = { optionA: 0.6 }; // optionB not in reputations
    const winner = engine.resolveTie(options, reputations);
    // optionA: 0.6 * φ ≈ 0.97, optionB: 0.5 * φ ≈ 0.81
    assert.strictEqual(winner, 'optionA');
  });

  test('getStatus returns expected shape', () => {
    const engine = new ConsensusEngine({
      organismId: 'org1',
      participants: ['org2', 'org3'],
    });
    const status = engine.getStatus();
    assert.strictEqual(status.organismId, 'org1');
    assert.strictEqual(status.participants, 3);
    assert.strictEqual(status.rounds, 0);
    assert.strictEqual(status.isLeader, false);
    assert.strictEqual(status.currentTerm, 0);
    assert.strictEqual(status.leader, null);
  });
});

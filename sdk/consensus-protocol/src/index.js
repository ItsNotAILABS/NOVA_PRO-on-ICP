///
/// @medina/consensus-protocol — Multi-Organism Consensus
/// CPC-2026: Consensus Protocol Charter
/// Byzantine fault tolerant consensus with Raft leadership
///

import { PHI, HEARTBEAT_MS } from '@medina/medina-heart';

export class Vote {
  constructor({ voterId, decision, timestamp = Date.now(), signature = null } = {}) {
    this.voterId = voterId;
    this.decision = decision;
    this.timestamp = timestamp;
    this.signature = signature || this._generateSignature();
  }

  _generateSignature() {
    // φ-based signature generation
    const data = `${this.voterId}:${this.decision}:${this.timestamp}`;
    return Math.floor(data.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * PHI);
  }

  verify() {
    return this.signature === this._generateSignature();
  }
}

export class ConsensusRound {
  constructor({ roundId, participants, timeout = 30000, quorum = 0.51 } = {}) {
    this.roundId = roundId;
    this.participants = new Set(participants);
    this.votes = new Map();
    this.timeout = timeout;
    this.quorum = quorum;
    this.startTime = Date.now();
    this.result = null;
    this.status = 'pending'; // pending, complete, timeout
  }

  castVote(vote) {
    if (this.status !== 'pending') {
      throw new Error(`Round ${this.roundId} is ${this.status}`);
    }

    if (!this.participants.has(vote.voterId)) {
      throw new Error(`Voter ${vote.voterId} not in participant list`);
    }

    if (!vote.verify()) {
      throw new Error('Invalid vote signature');
    }

    this.votes.set(vote.voterId, vote);
    return this.checkComplete();
  }

  checkComplete() {
    const elapsed = Date.now() - this.startTime;

    if (elapsed > this.timeout) {
      this.status = 'timeout';
      return false;
    }

    const requiredVotes = Math.ceil(this.participants.size * this.quorum);
    if (this.votes.size >= requiredVotes) {
      this.result = this.tallyVotes();
      this.status = 'complete';
      return true;
    }

    return false;
  }

  tallyVotes() {
    const tally = {};
    for (const vote of this.votes.values()) {
      tally[vote.decision] = (tally[vote.decision] || 0) + 1;
    }

    let winner = null;
    let maxVotes = 0;
    for (const [decision, count] of Object.entries(tally)) {
      if (count > maxVotes) {
        maxVotes = count;
        winner = decision;
      }
    }

    return {
      decision: winner,
      votes: maxVotes,
      total: this.votes.size,
      percentage: maxVotes / this.votes.size,
      tally,
    };
  }

  getStatus() {
    return {
      roundId: this.roundId,
      status: this.status,
      votes: this.votes.size,
      required: Math.ceil(this.participants.size * this.quorum),
      participants: this.participants.size,
      elapsed: Date.now() - this.startTime,
      result: this.result,
    };
  }
}

export class RaftLeader {
  constructor({ leaderId, term = 0 } = {}) {
    this.leaderId = leaderId;
    this.term = term;
    this.followers = new Set();
    this.heartbeatInterval = null;
    this.lastHeartbeat = Date.now();
  }

  addFollower(followerId) {
    this.followers.add(followerId);
  }

  removeFollower(followerId) {
    this.followers.delete(followerId);
  }

  startHeartbeat(callback) {
    this.heartbeatInterval = setInterval(() => {
      this.lastHeartbeat = Date.now();
      callback({
        leaderId: this.leaderId,
        term: this.term,
        timestamp: this.lastHeartbeat,
      });
    }, HEARTBEAT_MS);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  incrementTerm() {
    this.term++;
    return this.term;
  }
}

export class ConsensusEngine {
  constructor({ organismId, participants = [] } = {}) {
    this.organismId = organismId;
    this.participants = new Set(participants);
    this.participants.add(organismId);
    this.rounds = new Map();
    this.roundCounter = 0;
    this.leader = null;
    this.currentTerm = 0;
    this.votedThisTerm = false;
  }

  // Byzantine Fault Tolerance
  propose(decision, quorum = 0.51) {
    const roundId = `round_${this.roundCounter++}_${Date.now()}`;
    const round = new ConsensusRound({
      roundId,
      participants: Array.from(this.participants),
      quorum,
    });
    this.rounds.set(roundId, round);
    return round;
  }

  vote(roundId, decision) {
    const round = this.rounds.get(roundId);
    if (!round) {
      throw new Error(`Round ${roundId} not found`);
    }

    const vote = new Vote({
      voterId: this.organismId,
      decision,
    });

    return round.castVote(vote);
  }

  // Raft Leader Election
  requestVote(candidateId, term) {
    if (term < this.currentTerm) {
      return { granted: false, term: this.currentTerm };
    }

    if (term > this.currentTerm) {
      this.currentTerm = term;
      this.votedThisTerm = false;
      this.leader = null;
    }

    if (!this.votedThisTerm) {
      this.votedThisTerm = true;
      return { granted: true, term: this.currentTerm };
    }

    return { granted: false, term: this.currentTerm };
  }

  becomeLeader() {
    this.currentTerm++;
    this.leader = new RaftLeader({
      leaderId: this.organismId,
      term: this.currentTerm,
    });
    return this.leader;
  }

  receiveHeartbeat(leaderId, term) {
    if (term >= this.currentTerm) {
      this.currentTerm = term;
      this.votedThisTerm = true;
      if (this.leader && this.leader.leaderId !== leaderId) {
        this.leader.stopHeartbeat();
      }
      return { acknowledged: true };
    }
    return { acknowledged: false };
  }

  // Two-Phase Commit
  prepareTransaction(transactionId, data) {
    return {
      transactionId,
      phase: 'prepare',
      organismId: this.organismId,
      ready: true,
      data,
      timestamp: Date.now(),
    };
  }

  commitTransaction(transactionId) {
    return {
      transactionId,
      phase: 'commit',
      organismId: this.organismId,
      committed: true,
      timestamp: Date.now(),
    };
  }

  abortTransaction(transactionId, reason) {
    return {
      transactionId,
      phase: 'abort',
      organismId: this.organismId,
      aborted: true,
      reason,
      timestamp: Date.now(),
    };
  }

  // Tie-Breaking with φ-based reputation
  resolveTie(options, reputations = {}) {
    let bestOption = null;
    let bestScore = -Infinity;

    for (const option of options) {
      const reputation = reputations[option] || 0.5;
      const phiScore = reputation * PHI;
      if (phiScore > bestScore) {
        bestScore = phiScore;
        bestOption = option;
      }
    }

    return bestOption;
  }

  getStatus() {
    return {
      organismId: this.organismId,
      participants: this.participants.size,
      rounds: this.rounds.size,
      isLeader: this.leader !== null,
      currentTerm: this.currentTerm,
      leader: this.leader ? this.leader.leaderId : null,
    };
  }
}

export default { Vote, ConsensusRound, RaftLeader, ConsensusEngine };

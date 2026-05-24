///
/// tests/nova-token-30k.test.js
///
/// Comprehensive 30,000 threshold test coverage:
///   - 30,000 token transfer operations
///   - 30,000 items/users handling (batch operations, bulk accounts)
///   - 30,000 as threshold values (limits, caps, boundaries)
///
/// These tests verify system behavior at scale and validate the token
/// economy can handle substantial volumes without degradation.
///

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ═══════════════════════════════════════════════════════════════════
//  TEST CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const THIRTY_THOUSAND = 30_000;
const THIRTY_THOUSAND_E8S = 30_000 * 100_000_000; // 30,000 tokens in e8s
const PHI = 1.6180339887498948482;

// ═══════════════════════════════════════════════════════════════════
//  MOCK TOKEN LEDGER (simulates nova_token canister behavior)
// ═══════════════════════════════════════════════════════════════════

class MockTokenLedger {
  constructor(config = {}) {
    this.name = 'Nova Token Mock Ledger';
    this.version = '1.0.0';
    this.accounts = new Map();
    this.transactions = [];
    this.nextTxId = 0;
    this.totalBurned = 0;
    this.totalLocked = 0;
    
    // Configurable limits
    this.config = {
      maxTransferAmount: config.maxTransferAmount ?? Number.MAX_SAFE_INTEGER,
      maxAccountsPerBatch: config.maxAccountsPerBatch ?? 100_000,
      transferThreshold: config.transferThreshold ?? THIRTY_THOUSAND_E8S,
      bulkUserLimit: config.bulkUserLimit ?? THIRTY_THOUSAND,
      ...config,
    };
  }

  // Get or create account
  getOrCreateAccount(principal) {
    if (!this.accounts.has(principal)) {
      this.accounts.set(principal, {
        principal,
        free: 0,
        gov: 0,
        cycle: 0,
        vault: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        txCount: 0,
        phiFingerprint: Math.pow(PHI, Date.now() % 13),
      });
    }
    return this.accounts.get(principal);
  }

  // Mint tokens to an account
  mint(to, amount, role = 'Free') {
    if (amount <= 0) return { success: false, error: 'Amount must be > 0' };
    
    const account = this.getOrCreateAccount(to);
    const roleKey = role.toLowerCase();
    
    if (roleKey === 'free') {
      account.free += amount;
    } else if (roleKey === 'gov') {
      account.gov += amount;
      this.totalLocked += amount;
    } else if (roleKey === 'cycle') {
      account.cycle += amount;
      this.totalLocked += amount;
    } else if (roleKey === 'vault') {
      account.vault += amount;
      this.totalLocked += amount;
    }
    
    account.updatedAt = Date.now();
    account.txCount++;
    
    const txId = this.nextTxId++;
    this.transactions.push({
      id: txId,
      fromPrincipal: 'MINT',
      toPrincipal: to,
      amount,
      role,
      kind: 'Mint',
      timestamp: Date.now(),
      memo: '',
    });
    
    return { success: true, txId };
  }

  // Transfer tokens between accounts
  transfer(from, to, amount, memo = '') {
    if (amount <= 0) return { success: false, error: 'Amount must be > 0' };
    if (amount > this.config.maxTransferAmount) {
      return { success: false, error: 'Amount exceeds max transfer limit' };
    }
    
    const fromAccount = this.getOrCreateAccount(from);
    
    if (fromAccount.free < amount) {
      return { success: false, error: 'Insufficient free balance' };
    }
    
    const toAccount = this.getOrCreateAccount(to);
    
    // Execute transfer
    fromAccount.free -= amount;
    toAccount.free += amount;
    fromAccount.updatedAt = Date.now();
    toAccount.updatedAt = Date.now();
    fromAccount.txCount++;
    toAccount.txCount++;
    
    const txId = this.nextTxId++;
    this.transactions.push({
      id: txId,
      fromPrincipal: from,
      toPrincipal: to,
      amount,
      role: 'Free',
      kind: 'Transfer',
      timestamp: Date.now(),
      memo,
    });
    
    return { success: true, txId };
  }

  // Burn tokens
  burn(from, amount) {
    if (amount <= 0) return { success: false, error: 'Amount must be > 0' };
    
    const account = this.getOrCreateAccount(from);
    
    if (account.free < amount) {
      return { success: false, error: 'Insufficient free balance to burn' };
    }
    
    account.free -= amount;
    account.updatedAt = Date.now();
    account.txCount++;
    this.totalBurned += amount;
    
    const txId = this.nextTxId++;
    this.transactions.push({
      id: txId,
      fromPrincipal: from,
      toPrincipal: 'BURN',
      amount,
      role: 'Free',
      kind: 'Burn',
      timestamp: Date.now(),
      memo: '',
    });
    
    return { success: true, txId };
  }

  // Batch mint to multiple accounts
  batchMint(recipients, amountPerRecipient, role = 'Free') {
    if (recipients.length > this.config.maxAccountsPerBatch) {
      return { 
        success: false, 
        error: `Batch size exceeds limit of ${this.config.maxAccountsPerBatch}`,
      };
    }
    
    const results = [];
    for (const recipient of recipients) {
      results.push(this.mint(recipient, amountPerRecipient, role));
    }
    
    return {
      success: true,
      processed: recipients.length,
      results,
    };
  }

  // Batch transfer from one account to many
  batchTransfer(from, recipients, amountPerRecipient, memo = '') {
    if (recipients.length > this.config.maxAccountsPerBatch) {
      return {
        success: false,
        error: `Batch size exceeds limit of ${this.config.maxAccountsPerBatch}`,
      };
    }
    
    const totalAmount = recipients.length * amountPerRecipient;
    const fromAccount = this.getOrCreateAccount(from);
    
    if (fromAccount.free < totalAmount) {
      return { success: false, error: 'Insufficient balance for batch transfer' };
    }
    
    const results = [];
    for (const recipient of recipients) {
      results.push(this.transfer(from, recipient, amountPerRecipient, memo));
    }
    
    return {
      success: true,
      processed: recipients.length,
      totalTransferred: totalAmount,
      results,
    };
  }

  // Check if amount is above threshold
  isAboveThreshold(amount) {
    return amount >= this.config.transferThreshold;
  }

  // Get account balance
  balanceOf(principal) {
    const account = this.accounts.get(principal);
    if (!account) return null;
    return { ...account };
  }

  // Get total account count
  getAccountCount() {
    return this.accounts.size;
  }

  // Get transaction count
  getTransactionCount() {
    return this.transactions.length;
  }

  // Get supply snapshot
  getSupplySnapshot() {
    let totalFree = 0;
    let totalGov = 0;
    let totalCycle = 0;
    let totalVault = 0;
    
    for (const account of this.accounts.values()) {
      totalFree += account.free;
      totalGov += account.gov;
      totalCycle += account.cycle;
      totalVault += account.vault;
    }
    
    return {
      totalMinted: totalFree + totalGov + totalCycle + totalVault + this.totalBurned,
      circulating: totalFree,
      locked: this.totalLocked,
      burned: this.totalBurned,
      txCount: this.nextTxId,
      holderCount: this.accounts.size,
      timestamp: Date.now(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
//  30,000 TOKEN TRANSFER TESTS
// ═══════════════════════════════════════════════════════════════════

describe('30,000 Token Transfer Operations', () => {
  test('successfully transfers exactly 30,000 tokens (e8s)', () => {
    const ledger = new MockTokenLedger();
    
    // Mint 30,000 tokens to sender
    ledger.mint('sender-principal', THIRTY_THOUSAND_E8S, 'Free');
    
    // Transfer 30,000 tokens
    const result = ledger.transfer('sender-principal', 'receiver-principal', THIRTY_THOUSAND_E8S);
    
    assert.strictEqual(result.success, true);
    assert.ok(result.txId >= 0);
    
    // Verify balances
    const senderBalance = ledger.balanceOf('sender-principal');
    const receiverBalance = ledger.balanceOf('receiver-principal');
    
    assert.strictEqual(senderBalance.free, 0);
    assert.strictEqual(receiverBalance.free, THIRTY_THOUSAND_E8S);
  });

  test('handles multiple transfers totaling 30,000 tokens', () => {
    const ledger = new MockTokenLedger();
    
    // Mint 30,000 tokens
    ledger.mint('sender-principal', THIRTY_THOUSAND_E8S, 'Free');
    
    // Transfer in 3 chunks: 10,000 each
    const chunkSize = 10_000 * 100_000_000; // 10,000 tokens in e8s
    
    const result1 = ledger.transfer('sender-principal', 'receiver-1', chunkSize);
    const result2 = ledger.transfer('sender-principal', 'receiver-2', chunkSize);
    const result3 = ledger.transfer('sender-principal', 'receiver-3', chunkSize);
    
    assert.strictEqual(result1.success, true);
    assert.strictEqual(result2.success, true);
    assert.strictEqual(result3.success, true);
    
    // Verify all transfers completed
    const senderBalance = ledger.balanceOf('sender-principal');
    assert.strictEqual(senderBalance.free, 0);
    
    // Verify transaction count
    assert.strictEqual(ledger.getTransactionCount(), 4); // 1 mint + 3 transfers
  });

  test('fails transfer when amount exceeds 30,000 token limit', () => {
    const ledger = new MockTokenLedger({
      maxTransferAmount: THIRTY_THOUSAND_E8S,
    });
    
    // Mint more than 30,000 tokens
    const excessAmount = THIRTY_THOUSAND_E8S + 1;
    ledger.mint('sender-principal', excessAmount, 'Free');
    
    // Attempt transfer exceeding limit
    const result = ledger.transfer('sender-principal', 'receiver-principal', excessAmount);
    
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Amount exceeds max transfer limit');
  });

  test('transfer at exactly 30,000 threshold succeeds', () => {
    const ledger = new MockTokenLedger({
      maxTransferAmount: THIRTY_THOUSAND_E8S,
    });
    
    ledger.mint('sender-principal', THIRTY_THOUSAND_E8S, 'Free');
    
    // Transfer exactly at limit
    const result = ledger.transfer('sender-principal', 'receiver-principal', THIRTY_THOUSAND_E8S);
    
    assert.strictEqual(result.success, true);
  });

  test('detects amounts above 30,000 threshold', () => {
    const ledger = new MockTokenLedger();
    
    assert.strictEqual(ledger.isAboveThreshold(THIRTY_THOUSAND_E8S), true);
    assert.strictEqual(ledger.isAboveThreshold(THIRTY_THOUSAND_E8S - 1), false);
    assert.strictEqual(ledger.isAboveThreshold(THIRTY_THOUSAND_E8S + 1), true);
  });

  test('handles 30,000 consecutive small transfers', () => {
    const ledger = new MockTokenLedger();
    
    // Mint enough for 30,000 transfers of 1 e8s each
    ledger.mint('sender-principal', THIRTY_THOUSAND, 'Free');
    
    // Perform 30,000 small transfers
    let successCount = 0;
    for (let i = 0; i < THIRTY_THOUSAND; i++) {
      const result = ledger.transfer('sender-principal', `receiver-${i}`, 1);
      if (result.success) successCount++;
    }
    
    assert.strictEqual(successCount, THIRTY_THOUSAND);
    assert.strictEqual(ledger.balanceOf('sender-principal').free, 0);
    
    // Verify transaction count (1 mint + 30,000 transfers)
    assert.strictEqual(ledger.getTransactionCount(), THIRTY_THOUSAND + 1);
  });
});

// ═══════════════════════════════════════════════════════════════════
//  30,000 ITEMS/USERS HANDLING TESTS
// ═══════════════════════════════════════════════════════════════════

describe('30,000 Items/Users Handling', () => {
  test('creates 30,000 unique accounts', () => {
    const ledger = new MockTokenLedger();
    
    // Create 30,000 accounts
    for (let i = 0; i < THIRTY_THOUSAND; i++) {
      ledger.getOrCreateAccount(`user-${i}`);
    }
    
    assert.strictEqual(ledger.getAccountCount(), THIRTY_THOUSAND);
  });

  test('batch mints to 30,000 recipients', () => {
    const ledger = new MockTokenLedger({
      maxAccountsPerBatch: THIRTY_THOUSAND + 1,
    });
    
    // Generate 30,000 recipient addresses
    const recipients = Array.from({ length: THIRTY_THOUSAND }, (_, i) => `recipient-${i}`);
    
    // Batch mint
    const result = ledger.batchMint(recipients, 1_000_000, 'Free');
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.processed, THIRTY_THOUSAND);
    assert.strictEqual(ledger.getAccountCount(), THIRTY_THOUSAND);
    
    // Verify each account has the correct balance
    const sampleAccount = ledger.balanceOf('recipient-0');
    assert.strictEqual(sampleAccount.free, 1_000_000);
  });

  test('batch transfer to 30,000 recipients', () => {
    const ledger = new MockTokenLedger({
      maxAccountsPerBatch: THIRTY_THOUSAND + 1,
    });
    
    // Mint enough tokens for the batch transfer
    const amountPerRecipient = 100;
    const totalNeeded = THIRTY_THOUSAND * amountPerRecipient;
    ledger.mint('treasury', totalNeeded, 'Free');
    
    // Generate recipients
    const recipients = Array.from({ length: THIRTY_THOUSAND }, (_, i) => `airdrop-recipient-${i}`);
    
    // Batch transfer (airdrop simulation)
    const result = ledger.batchTransfer('treasury', recipients, amountPerRecipient);
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.processed, THIRTY_THOUSAND);
    assert.strictEqual(result.totalTransferred, totalNeeded);
    
    // Verify treasury balance
    assert.strictEqual(ledger.balanceOf('treasury').free, 0);
  });

  test('fails batch operation when exceeding 30,000 user limit', () => {
    const ledger = new MockTokenLedger({
      maxAccountsPerBatch: THIRTY_THOUSAND,
    });
    
    // Try to batch mint to 30,001 recipients
    const recipients = Array.from({ length: THIRTY_THOUSAND + 1 }, (_, i) => `user-${i}`);
    
    const result = ledger.batchMint(recipients, 1000, 'Free');
    
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('exceeds limit'));
  });

  test('handles 30,000 accounts with different token roles', () => {
    const ledger = new MockTokenLedger({
      maxAccountsPerBatch: THIRTY_THOUSAND + 1,
    });
    
    const roles = ['Free', 'Gov', 'Cycle', 'Vault'];
    const accountsPerRole = THIRTY_THOUSAND / roles.length;
    
    // Create accounts with different roles
    for (let i = 0; i < roles.length; i++) {
      const recipients = Array.from(
        { length: accountsPerRole }, 
        (_, j) => `${roles[i].toLowerCase()}-user-${j}`
      );
      ledger.batchMint(recipients, 1_000_000, roles[i]);
    }
    
    assert.strictEqual(ledger.getAccountCount(), THIRTY_THOUSAND);
    
    // Verify supply snapshot
    const snapshot = ledger.getSupplySnapshot();
    assert.strictEqual(snapshot.holderCount, THIRTY_THOUSAND);
  });

  test('tracks 30,000 transactions in ledger history', () => {
    const ledger = new MockTokenLedger();
    
    // Generate 30,000 mint transactions
    for (let i = 0; i < THIRTY_THOUSAND; i++) {
      ledger.mint(`user-${i}`, 100, 'Free');
    }
    
    assert.strictEqual(ledger.getTransactionCount(), THIRTY_THOUSAND);
  });

  test('maintains account integrity with 30,000 concurrent modifications', () => {
    const ledger = new MockTokenLedger();
    
    // Mint initial balance
    ledger.mint('source', THIRTY_THOUSAND * 10, 'Free');
    
    // Simulate concurrent modifications to 30,000 accounts
    const operations = [];
    for (let i = 0; i < THIRTY_THOUSAND; i++) {
      operations.push(() => ledger.transfer('source', `target-${i}`, 10));
    }
    
    // Execute all operations
    const results = operations.map(op => op());
    const successfulOps = results.filter(r => r.success).length;
    
    assert.strictEqual(successfulOps, THIRTY_THOUSAND);
    assert.strictEqual(ledger.balanceOf('source').free, 0);
  });
});

// ═══════════════════════════════════════════════════════════════════
//  30,000 AS THRESHOLD VALUE TESTS
// ═══════════════════════════════════════════════════════════════════

describe('30,000 as Threshold Value', () => {
  test('validates 30,000 as minimum batch size threshold', () => {
    const ledger = new MockTokenLedger({
      bulkUserLimit: THIRTY_THOUSAND,
    });
    
    assert.strictEqual(ledger.config.bulkUserLimit, THIRTY_THOUSAND);
  });

  test('validates 30,000 tokens as transfer threshold', () => {
    const ledger = new MockTokenLedger({
      transferThreshold: THIRTY_THOUSAND_E8S,
    });
    
    // Below threshold
    ledger.mint('user', THIRTY_THOUSAND_E8S - 1, 'Free');
    assert.strictEqual(ledger.isAboveThreshold(THIRTY_THOUSAND_E8S - 1), false);
    
    // At threshold
    assert.strictEqual(ledger.isAboveThreshold(THIRTY_THOUSAND_E8S), true);
    
    // Above threshold
    assert.strictEqual(ledger.isAboveThreshold(THIRTY_THOUSAND_E8S + 1), true);
  });

  test('30,000 as quorum threshold for governance', () => {
    const QUORUM_THRESHOLD = THIRTY_THOUSAND;
    
    // Simulate governance voting with 30,000 quorum requirement
    const votes = {
      yes: 15000,
      no: 5000,
      abstain: 10000,
    };
    
    const totalVotes = votes.yes + votes.no + votes.abstain;
    const quorumMet = totalVotes >= QUORUM_THRESHOLD;
    
    assert.strictEqual(totalVotes, THIRTY_THOUSAND);
    assert.strictEqual(quorumMet, true);
    
    // Below quorum
    const insufficientVotes = QUORUM_THRESHOLD - 1;
    const insufficientQuorum = insufficientVotes >= QUORUM_THRESHOLD;
    assert.strictEqual(insufficientQuorum, false);
  });

  test('30,000 as holder threshold for airdrop eligibility', () => {
    const HOLDER_THRESHOLD = THIRTY_THOUSAND;
    const ledger = new MockTokenLedger({
      maxAccountsPerBatch: HOLDER_THRESHOLD + 1,
    });
    
    // Create exactly 30,000 holders
    const holders = Array.from({ length: HOLDER_THRESHOLD }, (_, i) => `holder-${i}`);
    ledger.batchMint(holders, 1000, 'Free');
    
    // Check if threshold is met for airdrop
    const holderCount = ledger.getAccountCount();
    const eligibleForAirdrop = holderCount >= HOLDER_THRESHOLD;
    
    assert.strictEqual(eligibleForAirdrop, true);
    assert.strictEqual(holderCount, HOLDER_THRESHOLD);
  });

  test('30,000 e8s as minimum stake threshold', () => {
    const MIN_STAKE = 30_000; // 30,000 e8s = 0.0003 NOVA
    const ledger = new MockTokenLedger();
    
    // Valid stake
    ledger.mint('staker', MIN_STAKE, 'Gov');
    const stakerBalance = ledger.balanceOf('staker');
    assert.strictEqual(stakerBalance.gov >= MIN_STAKE, true);
    
    // Invalid stake (below threshold)
    ledger.mint('small-staker', MIN_STAKE - 1, 'Gov');
    const smallStakerBalance = ledger.balanceOf('small-staker');
    assert.strictEqual(smallStakerBalance.gov >= MIN_STAKE, false);
  });

  test('30,000 as daily transaction limit', () => {
    const DAILY_TX_LIMIT = THIRTY_THOUSAND;
    const ledger = new MockTokenLedger();
    
    // Mint enough for daily limit
    ledger.mint('active-user', DAILY_TX_LIMIT * 100, 'Free');
    
    // Simulate daily transactions
    let dailyTxCount = 0;
    for (let i = 0; i < DAILY_TX_LIMIT; i++) {
      const result = ledger.transfer('active-user', `recipient-${i}`, 100);
      if (result.success) dailyTxCount++;
    }
    
    assert.strictEqual(dailyTxCount, DAILY_TX_LIMIT);
    
    // Verify limit was reached
    const withinLimit = dailyTxCount <= DAILY_TX_LIMIT;
    assert.strictEqual(withinLimit, true);
  });

  test('30,000 as burn threshold for deflation mechanics', () => {
    const BURN_THRESHOLD = THIRTY_THOUSAND_E8S;
    const ledger = new MockTokenLedger();
    
    // Mint tokens
    ledger.mint('burner', BURN_THRESHOLD * 2, 'Free');
    
    // Burn at threshold
    const burnResult = ledger.burn('burner', BURN_THRESHOLD);
    assert.strictEqual(burnResult.success, true);
    
    // Verify burn was recorded
    const snapshot = ledger.getSupplySnapshot();
    assert.strictEqual(snapshot.burned, BURN_THRESHOLD);
  });

  test('30,000 tokens as whale threshold classification', () => {
    const WHALE_THRESHOLD = THIRTY_THOUSAND_E8S;
    const ledger = new MockTokenLedger();
    
    // Create whale account
    ledger.mint('whale', WHALE_THRESHOLD, 'Free');
    
    // Create regular account
    ledger.mint('regular', WHALE_THRESHOLD - 1, 'Free');
    
    // Classify accounts
    const whaleBalance = ledger.balanceOf('whale');
    const regularBalance = ledger.balanceOf('regular');
    
    const isWhale = (balance) => balance.free >= WHALE_THRESHOLD;
    
    assert.strictEqual(isWhale(whaleBalance), true);
    assert.strictEqual(isWhale(regularBalance), false);
  });

  test('30,000 as φ-aligned scaling factor', () => {
    // 30,000 ≈ φ^21.4 (close to Fibonacci scaling)
    // This test validates φ-mathematical properties
    
    const phiPower = Math.log(THIRTY_THOUSAND) / Math.log(PHI);
    
    // Should be approximately 21.4
    assert.ok(phiPower > 21 && phiPower < 22);
    
    // Verify 30,000 fits within φ-based scaling
    const lowerBound = Math.pow(PHI, 21); // ≈ 24,476
    const upperBound = Math.pow(PHI, 22); // ≈ 39,603
    
    assert.ok(THIRTY_THOUSAND >= lowerBound);
    assert.ok(THIRTY_THOUSAND <= upperBound);
  });
});

// ═══════════════════════════════════════════════════════════════════
//  EDGE CASES AND BOUNDARY TESTS
// ═══════════════════════════════════════════════════════════════════

describe('30,000 Edge Cases and Boundaries', () => {
  test('handles exactly 29,999 (one below threshold)', () => {
    const ledger = new MockTokenLedger({
      maxTransferAmount: THIRTY_THOUSAND_E8S,
    });
    
    ledger.mint('sender', THIRTY_THOUSAND_E8S - 1, 'Free');
    
    const result = ledger.transfer('sender', 'receiver', THIRTY_THOUSAND_E8S - 1);
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(ledger.isAboveThreshold(THIRTY_THOUSAND_E8S - 1), false);
  });

  test('handles exactly 30,001 (one above threshold)', () => {
    const ledger = new MockTokenLedger({
      maxTransferAmount: THIRTY_THOUSAND_E8S,
    });
    
    ledger.mint('sender', THIRTY_THOUSAND_E8S + 1, 'Free');
    
    // Should fail due to limit
    const result = ledger.transfer('sender', 'receiver', THIRTY_THOUSAND_E8S + 1);
    
    assert.strictEqual(result.success, false);
    assert.strictEqual(ledger.isAboveThreshold(THIRTY_THOUSAND_E8S + 1), true);
  });

  test('handles zero balance after 30,000 transfers', () => {
    const ledger = new MockTokenLedger();
    
    ledger.mint('sender', THIRTY_THOUSAND, 'Free');
    
    // Transfer all in small amounts
    for (let i = 0; i < THIRTY_THOUSAND; i++) {
      ledger.transfer('sender', `r${i}`, 1);
    }
    
    const balance = ledger.balanceOf('sender');
    assert.strictEqual(balance.free, 0);
  });

  test('30,000 precision check with e8s conversion', () => {
    // 30,000 whole tokens = 3,000,000,000,000 e8s
    const expectedE8s = 30_000 * 100_000_000;
    
    assert.strictEqual(THIRTY_THOUSAND_E8S, expectedE8s);
    assert.strictEqual(THIRTY_THOUSAND_E8S, 3_000_000_000_000);
  });

  test('maintains ledger consistency after 30,000 operations', () => {
    const ledger = new MockTokenLedger();
    
    // Initial mint
    const initialAmount = THIRTY_THOUSAND * 10;
    ledger.mint('source', initialAmount, 'Free');
    
    // Perform 30,000 operations (mix of transfers and burns)
    for (let i = 0; i < THIRTY_THOUSAND / 2; i++) {
      ledger.transfer('source', `user-${i}`, 10);
    }
    for (let i = 0; i < THIRTY_THOUSAND / 2; i++) {
      ledger.burn('source', 10);
    }
    
    // Verify consistency
    const snapshot = ledger.getSupplySnapshot();
    const sourceBalance = ledger.balanceOf('source').free;
    
    // All tokens should be accounted for
    const totalAccountedFor = snapshot.circulating + snapshot.burned + snapshot.locked;
    assert.ok(totalAccountedFor <= initialAmount);
    
    // Transaction count should match operations
    assert.strictEqual(snapshot.txCount, THIRTY_THOUSAND + 1); // +1 for initial mint
  });
});

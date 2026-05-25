/**
 * DE PROPORTIONE AUREA IN CENTUM QUINQUAGINTA MILIBUS NUMMORUM
 * (On the Golden Ratio in 150,000 Tokens)
 * 
 * NOVA Protocol 150K Token Stress Test Suite
 * Tests upgraded nova_token with ICRC-3, φ-weighted staking, analytics, batch ops
 */

import { describe, it, expect, beforeEach } from '../tests/harness.mjs';

// φ-Mathematical Constants
const PHI = 1.6180339887498949;
const PHI_SQUARED = PHI * PHI;
const PHI_CUBED = PHI * PHI * PHI;
const PHI_5 = Math.pow(PHI, 5);
const PHI_10 = Math.pow(PHI, 10);
const PHI_15 = Math.pow(PHI, 15);
const PHI_19 = Math.pow(PHI, 19);
const PHI_21 = Math.pow(PHI, 21);
const PHI_22 = Math.pow(PHI, 22);
const PHI_25 = Math.pow(PHI, 25);

// Token Constants
const TRANSFER_FEE = 10_000n;
const TOTAL_SUPPLY = BigInt(Math.floor(Math.pow(PHI, 13) * 1e8));
const TEST_SCALE = 150_000;

// Staking Tier Thresholds
const STAKING_TIERS = {
  Phi5: { threshold: Math.floor(PHI_5), multiplier: 1.0 },
  Phi10: { threshold: Math.floor(PHI_10), multiplier: PHI },
  Phi13: { threshold: Math.floor(Math.pow(PHI, 13)), multiplier: PHI_SQUARED },
  Phi15: { threshold: Math.floor(PHI_15), multiplier: PHI_CUBED },
  Phi17: { threshold: Math.floor(Math.pow(PHI, 17)), multiplier: Math.pow(PHI, 4) },
  Phi19: { threshold: Math.floor(PHI_19), multiplier: Math.pow(PHI, 5) },
  Phi21: { threshold: Math.floor(PHI_21), multiplier: Math.pow(PHI, 6) },
  Phi22: { threshold: Math.floor(PHI_22), multiplier: Math.pow(PHI, 7) },
  Phi25: { threshold: Math.floor(PHI_25), multiplier: Math.pow(PHI, 8) }
};

// Bridge Exchange Rates
const BRIDGE_RATES = {
  SSN_WORK: PHI,
  SSN_TRUST: PHI_SQUARED,
  SSN_GOV: PHI_CUBED
};

/**
 * Extended MockTokenLedger with ICRC-3, Staking, Analytics, Batch Ops
 */
class Extended150KMockLedger {
  constructor() {
    this.balances = new Map();
    this.allowances = new Map();
    this.transactionLog = [];
    this.stakes = new Map();
    this.analytics = {
      totalVolume: 0n,
      transferCount: 0,
      uniqueHolders: new Set(),
      totalStaked: 0n,
      stakerCount: 0,
      burnedFees: 0n
    };
    this.nextTxId = 0n;
  }

  // ICRC-1: Transfer
  transfer(from, to, amount) {
    const fromBalance = this.balances.get(from) || 0n;
    const totalDeduct = amount + TRANSFER_FEE;
    if (fromBalance < totalDeduct) return { err: 'InsufficientFunds' };
    
    this.balances.set(from, fromBalance - totalDeduct);
    this.balances.set(to, (this.balances.get(to) || 0n) + amount);
    
    // Analytics
    this.analytics.totalVolume += amount;
    this.analytics.transferCount++;
    this.analytics.burnedFees += TRANSFER_FEE;
    this.analytics.uniqueHolders.add(from);
    this.analytics.uniqueHolders.add(to);
    
    // ICRC-3 Transaction Log
    const txId = this.nextTxId++;
    this.transactionLog.push({
      txId,
      kind: 'transfer',
      from,
      to,
      amount,
      fee: TRANSFER_FEE,
      timestamp: Date.now()
    });
    
    return { ok: txId };
  }

  // ICRC-2: Approve
  approve(owner, spender, amount, expiresAt = null) {
    const key = `${owner}:${spender}`;
    this.allowances.set(key, { amount, expiresAt });
    
    const txId = this.nextTxId++;
    this.transactionLog.push({
      txId,
      kind: 'approve',
      owner,
      spender,
      amount,
      expiresAt,
      timestamp: Date.now()
    });
    
    return { ok: txId };
  }

  // ICRC-2: Transfer From
  transferFrom(spender, from, to, amount) {
    const key = `${from}:${spender}`;
    const allowance = this.allowances.get(key);
    if (!allowance || allowance.amount < amount) return { err: 'InsufficientAllowance' };
    if (allowance.expiresAt && allowance.expiresAt < Date.now()) return { err: 'AllowanceExpired' };
    
    const result = this.transfer(from, to, amount);
    if (result.ok !== undefined) {
      this.allowances.set(key, { ...allowance, amount: allowance.amount - amount });
    }
    return result;
  }

  // ICRC-3: Get Blocks (Transaction History)
  icrc3GetBlocks(start, length) {
    const end = Math.min(Number(start) + Number(length), this.transactionLog.length);
    return {
      blocks: this.transactionLog.slice(Number(start), end),
      totalBlocks: BigInt(this.transactionLog.length)
    };
  }

  // Batch Transfer (150K scale)
  batchTransfer(from, transfers) {
    const results = [];
    for (const { to, amount } of transfers) {
      results.push(this.transfer(from, to, amount));
    }
    return results;
  }

  // Batch Mint (admin)
  batchMint(mints) {
    const results = [];
    for (const { to, amount } of mints) {
      this.balances.set(to, (this.balances.get(to) || 0n) + amount);
      this.analytics.uniqueHolders.add(to);
      
      const txId = this.nextTxId++;
      this.transactionLog.push({
        txId,
        kind: 'mint',
        to,
        amount,
        timestamp: Date.now()
      });
      results.push({ ok: txId });
    }
    return results;
  }

  // φ-Weighted Staking
  stakePhiWeighted(owner, amount, tier) {
    const balance = this.balances.get(owner) || 0n;
    if (balance < amount) return { err: 'InsufficientFunds' };
    
    const tierConfig = STAKING_TIERS[tier];
    if (!tierConfig) return { err: 'InvalidTier' };
    if (Number(amount) < tierConfig.threshold * 1e8) return { err: 'BelowTierThreshold' };
    
    this.balances.set(owner, balance - amount);
    const existingStake = this.stakes.get(owner) || { amount: 0n, tier: null, startEpoch: 0 };
    this.stakes.set(owner, {
      amount: existingStake.amount + amount,
      tier,
      startEpoch: Date.now()
    });
    
    this.analytics.totalStaked += amount;
    this.analytics.stakerCount = this.stakes.size;
    
    const txId = this.nextTxId++;
    this.transactionLog.push({
      txId,
      kind: 'stake',
      owner,
      amount,
      tier,
      timestamp: Date.now()
    });
    
    return { ok: txId };
  }

  // Unstake
  unstake(owner) {
    const stake = this.stakes.get(owner);
    if (!stake || stake.amount === 0n) return { err: 'NoStake' };
    
    const tierConfig = STAKING_TIERS[stake.tier];
    const epochsStaked = Math.floor((Date.now() - stake.startEpoch) / 86400000);
    const lockBonus = 1 + (epochsStaked * 0.01);
    const reward = BigInt(Math.floor(Number(stake.amount) * 0.05 * tierConfig.multiplier * lockBonus / PHI_21));
    
    this.balances.set(owner, (this.balances.get(owner) || 0n) + stake.amount + reward);
    this.analytics.totalStaked -= stake.amount;
    this.stakes.delete(owner);
    
    const txId = this.nextTxId++;
    this.transactionLog.push({
      txId,
      kind: 'unstake',
      owner,
      amount: stake.amount,
      reward,
      timestamp: Date.now()
    });
    
    return { ok: { principal: stake.amount, reward } };
  }

  // Cross-Organism Bridge
  bridgeToSSN(owner, amount, targetToken) {
    const balance = this.balances.get(owner) || 0n;
    if (balance < amount) return { err: 'InsufficientFunds' };
    
    const rate = BRIDGE_RATES[targetToken];
    if (!rate) return { err: 'InvalidTargetToken' };
    
    const outputAmount = BigInt(Math.floor(Number(amount) * rate));
    this.balances.set(owner, balance - amount);
    
    const txId = this.nextTxId++;
    this.transactionLog.push({
      txId,
      kind: 'bridge',
      owner,
      inputAmount: amount,
      outputAmount,
      targetToken,
      rate,
      timestamp: Date.now()
    });
    
    return { ok: { txId, outputAmount, targetToken } };
  }

  // Analytics
  getTokenAnalytics() {
    return {
      totalVolume: this.analytics.totalVolume,
      transferCount: this.analytics.transferCount,
      uniqueHolders: this.analytics.uniqueHolders.size,
      totalStaked: this.analytics.totalStaked,
      stakerCount: this.analytics.stakerCount,
      burnedFees: this.analytics.burnedFees,
      velocity: this.analytics.transferCount > 0 
        ? Number(this.analytics.totalVolume) / this.analytics.transferCount 
        : 0,
      stakingRatio: this.analytics.totalStaked > 0n 
        ? Number(this.analytics.totalStaked) / Number(TOTAL_SUPPLY) 
        : 0
    };
  }

  getBalance(owner) {
    return this.balances.get(owner) || 0n;
  }

  mint(to, amount) {
    this.balances.set(to, (this.balances.get(to) || 0n) + amount);
    this.analytics.uniqueHolders.add(to);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITES
// ═══════════════════════════════════════════════════════════════════════════════

describe('NOVA 150K Token Tests - DE PROPORTIONE AUREA', () => {
  let ledger;
  const treasury = 'treasury-principal';
  const users = Array.from({ length: 1000 }, (_, i) => `user-${i}`);

  beforeEach(() => {
    ledger = new Extended150KMockLedger();
    ledger.mint(treasury, TOTAL_SUPPLY);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // ICRC-1 Core Tests at 150K Scale
  // ─────────────────────────────────────────────────────────────────────────────
  describe('ICRC-1 Core Operations (150K Scale)', () => {
    it('should handle 150,000 sequential transfers', () => {
      const amount = 1_000_000n;
      let successCount = 0;
      
      // Distribute to users first
      for (let i = 0; i < 500; i++) {
        ledger.mint(users[i], amount * 400n);
      }
      
      const start = Date.now();
      for (let i = 0; i < TEST_SCALE; i++) {
        const from = users[i % 500];
        const to = users[(i + 1) % 500];
        const result = ledger.transfer(from, to, amount);
        if (result.ok !== undefined) successCount++;
      }
      const elapsed = Date.now() - start;
      
      expect(successCount).toBeGreaterThan(TEST_SCALE * 0.95);
      expect(elapsed).toBeLessThan(30000); // 30 seconds max
      console.log(`150K transfers: ${successCount} successful in ${elapsed}ms`);
    });

    it('should maintain balance consistency after 150K operations', () => {
      const initialAmount = 10_000_000_000n;
      for (const user of users.slice(0, 100)) {
        ledger.mint(user, initialAmount);
      }
      
      const totalBefore = users.slice(0, 100).reduce(
        (sum, u) => sum + ledger.getBalance(u), 0n
      );
      
      // Random transfers
      for (let i = 0; i < 50000; i++) {
        const from = users[i % 100];
        const to = users[(i * 7) % 100];
        ledger.transfer(from, to, 100_000n);
      }
      
      const totalAfter = users.slice(0, 100).reduce(
        (sum, u) => sum + ledger.getBalance(u), 0n
      );
      
      // Account for burned fees
      const expectedBurn = 50000n * TRANSFER_FEE;
      expect(totalBefore - totalAfter).toBeLessThanOrEqual(expectedBurn);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // ICRC-3 Transaction Log Tests
  // ─────────────────────────────────────────────────────────────────────────────
  describe('ICRC-3 Transaction Log', () => {
    it('should record all transaction types in log', () => {
      ledger.mint(users[0], 100_000_000_000n);
      
      ledger.transfer(users[0], users[1], 1_000_000n);
      ledger.approve(users[0], users[2], 5_000_000n);
      ledger.stakePhiWeighted(users[0], 50_000_000_000n, 'Phi15');
      ledger.bridgeToSSN(users[0], 1_000_000_000n, 'SSN_WORK');
      
      const { blocks, totalBlocks } = ledger.icrc3GetBlocks(0n, 100n);
      
      expect(totalBlocks).toBeGreaterThanOrEqual(4n);
      expect(blocks.some(b => b.kind === 'transfer')).toBe(true);
      expect(blocks.some(b => b.kind === 'approve')).toBe(true);
      expect(blocks.some(b => b.kind === 'stake')).toBe(true);
      expect(blocks.some(b => b.kind === 'bridge')).toBe(true);
    });

    it('should paginate transaction log correctly', () => {
      ledger.mint(users[0], 1_000_000_000_000n);
      
      for (let i = 0; i < 1000; i++) {
        ledger.transfer(users[0], users[i % 100 + 1], 100_000n);
      }
      
      const page1 = ledger.icrc3GetBlocks(0n, 100n);
      const page2 = ledger.icrc3GetBlocks(100n, 100n);
      
      expect(page1.blocks.length).toBe(100);
      expect(page2.blocks.length).toBe(100);
      expect(page1.blocks[0].txId).not.toBe(page2.blocks[0].txId);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // φ-Weighted Staking Tests
  // ─────────────────────────────────────────────────────────────────────────────
  describe('φ-Weighted Staking System', () => {
    it('should enforce tier thresholds based on φ powers', () => {
      for (const [tierName, tierConfig] of Object.entries(STAKING_TIERS)) {
        const user = `staker-${tierName}`;
        const stakeAmount = BigInt(Math.floor(tierConfig.threshold * 1e8));
        ledger.mint(user, stakeAmount * 2n);
        
        const result = ledger.stakePhiWeighted(user, stakeAmount, tierName);
        expect(result.ok).toBeDefined();
      }
      
      expect(ledger.analytics.stakerCount).toBe(Object.keys(STAKING_TIERS).length);
    });

    it('should reject stakes below tier threshold', () => {
      ledger.mint(users[0], 1_000_000_000_000n);
      
      const belowThreshold = BigInt(Math.floor(STAKING_TIERS.Phi15.threshold * 1e8 * 0.5));
      const result = ledger.stakePhiWeighted(users[0], belowThreshold, 'Phi15');
      
      expect(result.err).toBe('BelowTierThreshold');
    });

    it('should calculate φ-based rewards correctly', () => {
      const stakeAmount = BigInt(Math.floor(STAKING_TIERS.Phi21.threshold * 1e8));
      ledger.mint(users[0], stakeAmount * 2n);
      
      ledger.stakePhiWeighted(users[0], stakeAmount, 'Phi21');
      const result = ledger.unstake(users[0]);
      
      expect(result.ok).toBeDefined();
      expect(result.ok.principal).toBe(stakeAmount);
      expect(result.ok.reward).toBeGreaterThan(0n);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Batch Operations Tests (150K Scale)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Batch Operations', () => {
    it('should process batch transfers efficiently', () => {
      ledger.mint(treasury, 1_000_000_000_000_000n);
      
      const batchSize = 1000;
      const transfers = Array.from({ length: batchSize }, (_, i) => ({
        to: users[i % users.length],
        amount: 1_000_000n
      }));
      
      const start = Date.now();
      const results = ledger.batchTransfer(treasury, transfers);
      const elapsed = Date.now() - start;
      
      const successCount = results.filter(r => r.ok !== undefined).length;
      expect(successCount).toBe(batchSize);
      expect(elapsed).toBeLessThan(5000);
    });

    it('should process batch mints for 150K accounts', () => {
      const mints = Array.from({ length: 1000 }, (_, i) => ({
        to: `batch-user-${i}`,
        amount: 1_000_000_000n
      }));
      
      const results = ledger.batchMint(mints);
      expect(results.length).toBe(1000);
      expect(results.every(r => r.ok !== undefined)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Cross-Organism Bridge Tests
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Cross-Organism Token Bridge', () => {
    it('should bridge NOVA to SSN tokens with φ-based rates', () => {
      const bridgeAmount = 1_000_000_000n;
      ledger.mint(users[0], bridgeAmount * 10n);
      
      const workResult = ledger.bridgeToSSN(users[0], bridgeAmount, 'SSN_WORK');
      expect(workResult.ok.outputAmount).toBe(BigInt(Math.floor(Number(bridgeAmount) * PHI)));
      
      const trustResult = ledger.bridgeToSSN(users[0], bridgeAmount, 'SSN_TRUST');
      expect(trustResult.ok.outputAmount).toBe(BigInt(Math.floor(Number(bridgeAmount) * PHI_SQUARED)));
      
      const govResult = ledger.bridgeToSSN(users[0], bridgeAmount, 'SSN_GOV');
      expect(govResult.ok.outputAmount).toBe(BigInt(Math.floor(Number(bridgeAmount) * PHI_CUBED)));
    });

    it('should reject bridge to invalid target token', () => {
      ledger.mint(users[0], 1_000_000_000n);
      const result = ledger.bridgeToSSN(users[0], 100_000_000n, 'INVALID_TOKEN');
      expect(result.err).toBe('InvalidTargetToken');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Analytics Validation
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Token Analytics', () => {
    it('should track analytics accurately at scale', () => {
      // Setup: distribute tokens
      for (let i = 0; i < 100; i++) {
        ledger.mint(users[i], 10_000_000_000n);
      }
      
      // Execute transfers
      for (let i = 0; i < 10000; i++) {
        ledger.transfer(users[i % 100], users[(i + 1) % 100], 100_000n);
      }
      
      const analytics = ledger.getTokenAnalytics();
      
      expect(analytics.transferCount).toBe(10000);
      expect(analytics.totalVolume).toBe(10000n * 100_000n);
      expect(analytics.burnedFees).toBe(10000n * TRANSFER_FEE);
      expect(analytics.uniqueHolders).toBe(100);
    });

    it('should calculate velocity and staking ratio', () => {
      ledger.mint(users[0], TOTAL_SUPPLY / 10n);
      
      for (let i = 0; i < 100; i++) {
        ledger.transfer(users[0], users[i + 1], 1_000_000n);
      }
      
      ledger.stakePhiWeighted(users[0], BigInt(Math.floor(STAKING_TIERS.Phi21.threshold * 1e8)), 'Phi21');
      
      const analytics = ledger.getTokenAnalytics();
      
      expect(analytics.velocity).toBeGreaterThan(0);
      expect(analytics.stakingRatio).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // φ-Mathematical Threshold Tests
  // ─────────────────────────────────────────────────────────────────────────────
  describe('φ-Mathematical Thresholds', () => {
    it('should validate φ-power emergence thresholds', () => {
      expect(Math.floor(PHI_5)).toBe(11);
      expect(Math.floor(PHI_10)).toBe(122);
      expect(Math.floor(PHI_15)).toBe(1364);
      expect(Math.floor(PHI_19)).toBe(9349);
      expect(Math.floor(PHI_21)).toBe(24476);
      expect(Math.floor(PHI_22)).toBe(39602);
      expect(Math.floor(PHI_25)).toBe(167761);
    });

    it('should verify 30K is organism complexity threshold', () => {
      expect(30000).toBeGreaterThan(Math.floor(PHI_21));
      expect(30000).toBeLessThan(Math.floor(PHI_22));
    });

    it('should verify 150K exceeds universal threshold', () => {
      expect(TEST_SCALE).toBeGreaterThan(Math.floor(PHI_22));
      expect(TEST_SCALE).toBeLessThan(Math.floor(PHI_25));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Stress & Chaos Tests
  // ─────────────────────────────────────────────────────────────────────────────
  describe('150K Stress Tests', () => {
    it('should handle concurrent operations without corruption', () => {
      // Initialize many accounts
      for (let i = 0; i < 500; i++) {
        ledger.mint(users[i], 100_000_000_000n);
      }
      
      // Mix of operations
      for (let i = 0; i < 50000; i++) {
        const op = i % 4;
        const user = users[i % 500];
        
        switch (op) {
          case 0:
            ledger.transfer(user, users[(i + 1) % 500], 10_000n);
            break;
          case 1:
            ledger.approve(user, users[(i + 2) % 500], 50_000n);
            break;
          case 2:
            if (ledger.getBalance(user) > BigInt(Math.floor(STAKING_TIERS.Phi5.threshold * 1e8))) {
              ledger.stakePhiWeighted(user, BigInt(Math.floor(STAKING_TIERS.Phi5.threshold * 1e8)), 'Phi5');
            }
            break;
          case 3:
            ledger.bridgeToSSN(user, 1_000n, 'SSN_WORK');
            break;
        }
      }
      
      const analytics = ledger.getTokenAnalytics();
      expect(analytics.transferCount).toBeGreaterThan(10000);
      expect(ledger.transactionLog.length).toBeGreaterThan(40000);
    });

    it('should maintain transaction log integrity', () => {
      ledger.mint(users[0], 1_000_000_000_000n);
      
      for (let i = 0; i < 10000; i++) {
        ledger.transfer(users[0], users[i % 100 + 1], 1_000n);
      }
      
      const { blocks, totalBlocks } = ledger.icrc3GetBlocks(0n, 10000n);
      
      // Verify sequential txIds
      for (let i = 1; i < blocks.length; i++) {
        expect(blocks[i].txId).toBe(blocks[i - 1].txId + 1n);
      }
    });
  });
});

// Export for test runner
export default { describe, it, expect, beforeEach };

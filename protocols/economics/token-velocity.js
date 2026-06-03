///
/// TOKEN VELOCITY — MV=PQ Tracking, Sink/Source Analysis, Economic Health
///
/// This module implements the token analysis models defined in TA-AEC-2026.
/// It provides real-time velocity computation, sink/source flow mapping,
/// equilibrium analysis, and Monte Carlo simulation infrastructure.
///
/// Key Models:
///   1. Fisher equation (MV = PQ) adapted for token economies
///   2. Sink/source flow accounting
///   3. φ-harmonic price equilibrium
///   4. Fibonacci retracement levels
///   5. Monte Carlo stress testing framework
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

import { PHI, PHI_INV, PHI_SQ, PHI_CB, PHI_4, FIBONACCI } from './behavioral-engine.js';

// ═══════════════════════════════════════════════════════════════════════════
//  TOKEN SUPPLY CONSTANTS (from nova_token)
// ═══════════════════════════════════════════════════════════════════════════

export const TOTAL_SUPPLY_E8S = 52_100_196_600;
export const TREASURY_E8S = 19_918_285_500;
export const COMMUNITY_E8S = 12_297_756_900;
export const FOUNDER_E8S = 19_884_154_200;
export const E8S_PER_NOVA = 100_000_000;
export const TRANSFER_FEE_E8S = 10_000;

// ═══════════════════════════════════════════════════════════════════════════
//  VELOCITY ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute token velocity: average number of times each circulating token transacts per epoch.
 *
 * V = total_tx_volume / circulating_supply
 *
 * @param {number} txVolumeE8s - Total transaction volume in e8s for the epoch
 * @param {number} circulatingSupply - Circulating supply (total - burned - locked)
 * @returns {number} Velocity
 */
export function computeVelocity(txVolumeE8s, circulatingSupply) {
  if (circulatingSupply <= 0) return 0;
  return txVolumeE8s / circulatingSupply;
}

/**
 * Compute rolling velocity with φ-weighted exponential decay over past epochs.
 *
 * @param {number[]} epochVolumes - Array of tx volumes per epoch (most recent first)
 * @param {number} circulatingSupply - Current circulating supply
 * @returns {number} Weighted average velocity
 */
export function rollingVelocity(epochVolumes, circulatingSupply) {
  if (circulatingSupply <= 0 || epochVolumes.length === 0) return 0;

  let weightedSum = 0;
  let weightTotal = 0;

  for (let i = 0; i < epochVolumes.length; i++) {
    const weight = Math.pow(PHI_INV, i); // Recent epochs weighted more
    weightedSum += epochVolumes[i] * weight;
    weightTotal += weight;
  }

  return (weightedSum / weightTotal) / circulatingSupply;
}

/**
 * Velocity health assessment — returns alert level and recommendation.
 *
 * @param {number} velocity - Current velocity
 * @returns {{level: string, alert: string, recommendation: string}}
 */
export function velocityHealth(velocity) {
  if (velocity > PHI_CB) {
    return {
      level: 'CRITICAL_HIGH',
      alert: `Velocity ${velocity.toFixed(3)} exceeds φ³ (extreme speculation)`,
      recommendation: 'Activate circuit breakers, increase transfer fees',
    };
  }
  if (velocity > PHI_SQ) {
    return {
      level: 'WARNING_HIGH',
      alert: `Velocity ${velocity.toFixed(3)} exceeds φ² (elevated activity)`,
      recommendation: 'Monitor closely, consider fee adjustment',
    };
  }
  if (velocity < 1 / PHI_CB) {
    return {
      level: 'CRITICAL_LOW',
      alert: `Velocity ${velocity.toFixed(3)} below 1/φ³ (frozen economy)`,
      recommendation: 'Reduce staking incentives, lower transfer fees',
    };
  }
  if (velocity < 1 / PHI_SQ) {
    return {
      level: 'WARNING_LOW',
      alert: `Velocity ${velocity.toFixed(3)} below 1/φ² (liquidity drought)`,
      recommendation: 'Monitor, consider liquidity incentives',
    };
  }
  return {
    level: 'HEALTHY',
    alert: `Velocity ${velocity.toFixed(3)} within optimal range [${(1/PHI_SQ).toFixed(3)}, ${PHI_SQ.toFixed(3)}]`,
    recommendation: 'No action needed',
  };
}

/**
 * Decompose velocity by transaction type.
 *
 * @param {object} volumes - Volume by type { transfers, staking, governance, compute }
 * @param {number} circulatingSupply - Current circulating supply
 * @returns {object} Velocity decomposition
 */
export function velocityDecomposition(volumes, circulatingSupply) {
  const cs = circulatingSupply || 1;
  return {
    total: (volumes.transfers + volumes.staking + volumes.governance + volumes.compute) / cs,
    transfers: volumes.transfers / cs,
    staking: volumes.staking / cs,
    governance: volumes.governance / cs,
    compute: volumes.compute / cs,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  SINK/SOURCE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute source rate — new tokens entering circulation per epoch.
 *
 * @param {number} epochIndex - Current epoch (0-indexed)
 * @param {number} grants - Additional governance-approved grants this epoch
 * @returns {number} Total source inflow in e8s
 */
export function sourceRate(epochIndex, grants = 0) {
  const epochBudget = epochIssuanceBudget(epochIndex);
  return epochBudget + grants;
}

/**
 * Compute epoch issuance budget using φ-weighted schedule.
 *
 * Budget(n) = COMMUNITY_E8S × φ^(-n) / Σ(φ^(-k), k=0..12)
 *
 * @param {number} epochIndex - Epoch number (0-12)
 * @returns {number} Budget in e8s for this epoch
 */
export function epochIssuanceBudget(epochIndex) {
  if (epochIndex < 0 || epochIndex > 12) return 0;

  // Normalization sum: Σ(φ^(-k), k=0..12)
  let normSum = 0;
  for (let k = 0; k <= 12; k++) {
    normSum += Math.pow(PHI_INV, k);
  }

  const weight = Math.pow(PHI_INV, epochIndex);
  return Math.floor(COMMUNITY_E8S * weight / normSum);
}

/**
 * Compute sink rate — tokens destroyed or locked per epoch.
 *
 * @param {number} txCount - Number of transfers (each burns TRANSFER_FEE_E8S)
 * @param {number} redemptions - NOVA burned for NNC (e8s)
 * @param {number} slashes - Governance slashes (e8s)
 * @param {number} voluntaryBurns - User-initiated burns (e8s)
 * @param {number} epochDecay - Unclaimed rewards burned (e8s)
 * @returns {number} Total sink outflow in e8s
 */
export function sinkRate(txCount, redemptions = 0, slashes = 0, voluntaryBurns = 0, epochDecay = 0) {
  const feeBurns = txCount * TRANSFER_FEE_E8S;
  return feeBurns + redemptions + slashes + voluntaryBurns + epochDecay;
}

/**
 * Compute net supply change for an epoch.
 *
 * @param {number} epochIndex - Current epoch
 * @param {number} grants - Governance grants
 * @param {number} txCount - Transfer count
 * @param {number} redemptions - NNC redemptions
 * @param {number} slashes - Slashes
 * @param {number} voluntaryBurns - Burns
 * @param {number} epochDecay - Decayed unclaimed rewards
 * @returns {{netChange: number, sources: number, sinks: number, ssr: number, isDeflationary: boolean}}
 */
export function netSupplyChange(epochIndex, grants, txCount, redemptions, slashes, voluntaryBurns, epochDecay) {
  const sources = sourceRate(epochIndex, grants);
  const sinks = sinkRate(txCount, redemptions, slashes, voluntaryBurns, epochDecay);
  const netChange = sources - sinks;
  const ssr = sources > 0 ? sinks / sources : Infinity;

  return {
    netChange,
    sources,
    sinks,
    ssr,
    isDeflationary: netChange < 0,
  };
}

/**
 * Compute supply half-life at a given burn rate (assuming no new issuance).
 *
 * @param {number} currentSupply - Current circulating supply (e8s)
 * @param {number} dailyBurnRate - Daily burn rate (e8s/day)
 * @returns {number} Days until supply halves (Infinity if no burn)
 */
export function supplyHalfLife(currentSupply, dailyBurnRate) {
  if (dailyBurnRate <= 0) return Infinity;
  return currentSupply / (2 * dailyBurnRate);
}

// ═══════════════════════════════════════════════════════════════════════════
//  φ-HARMONIC PRICE EQUILIBRIUM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute the fundamental price of NOVA using DCF model.
 *
 * P* = (Treasury_backing + PV_future_earnings) / circulating_supply
 *
 * @param {number} treasuryValueICP - Treasury ICP value
 * @param {number} steadyStateEarnings - Steady-state earnings per epoch (ICP)
 * @param {number} circulatingSupply - Circulating supply in NOVA (not e8s)
 * @returns {number} Fundamental price in ICP per NOVA
 */
export function fundamentalPrice(treasuryValueICP, steadyStateEarnings, circulatingSupply) {
  if (circulatingSupply <= 0) return 0;
  // PV of perpetuity at discount rate (1 - 1/φ) = 1/φ²
  // PV = E / (1 - 1/φ) = E × φ
  const pvEarnings = steadyStateEarnings * PHI;
  return (treasuryValueICP + pvEarnings) / circulatingSupply;
}

/**
 * Compute φ-harmonic support and resistance levels from a reference price.
 *
 * @param {number} refPrice - Reference price (e.g., current market price or fundamental)
 * @returns {{supports: number[], resistances: number[], fibLevels: object}}
 */
export function phiPriceLevels(refPrice) {
  const supports = [
    refPrice * PHI_INV,         // S1: P × 1/φ
    refPrice / PHI_SQ,          // S2: P × 1/φ²
    refPrice / PHI_CB,          // S3: P × 1/φ³
  ];

  const resistances = [
    refPrice * PHI,             // R1: P × φ
    refPrice * PHI_SQ,          // R2: P × φ²
    refPrice * PHI_CB,          // R3: P × φ³
  ];

  const fibLevels = {
    '23.6%': refPrice * (1 - 1 / PHI_CB),
    '38.2%': refPrice * (1 - 1 / PHI_SQ),
    '50.0%': refPrice * 0.5,
    '61.8%': refPrice * (1 - PHI_INV),
    '78.6%': refPrice * (1 - 1 / Math.sqrt(PHI)),
  };

  return { supports, resistances, fibLevels };
}

/**
 * Compute price deviation from fundamental and assess health.
 *
 * @param {number} marketPrice - Current market price
 * @param {number} fundPrice - Fundamental price
 * @returns {{deviation: number, zone: string, action: string}}
 */
export function priceDeviation(marketPrice, fundPrice) {
  if (fundPrice <= 0) return { deviation: 0, zone: 'unknown', action: 'none' };

  const deviation = (marketPrice - fundPrice) / fundPrice;

  let zone, action;
  if (marketPrice < fundPrice / PHI) {
    zone = 'deeply_oversold';
    action = 'treasury_buyback';
  } else if (marketPrice < fundPrice * PHI_INV) {
    zone = 'oversold';
    action = 'monitor_closely';
  } else if (marketPrice > fundPrice * PHI) {
    zone = 'overbought';
    action = 'treasury_sell';
  } else if (marketPrice > fundPrice * Math.sqrt(PHI)) {
    zone = 'elevated';
    action = 'caution';
  } else {
    zone = 'fair_value';
    action = 'none';
  }

  return { deviation, zone, action };
}

/**
 * Mean-reversion prediction using Ornstein-Uhlenbeck model.
 * Predicts expected price after t epochs given current deviation.
 *
 * E[P(t)] = μ + (P₀ - μ) × e^(-θt)
 *
 * @param {number} currentPrice - Current price
 * @param {number} equilibriumPrice - Long-run equilibrium (fundamental)
 * @param {number} epochsAhead - How many epochs to predict
 * @returns {number} Expected price at t epochs ahead
 */
export function meanReversionForecast(currentPrice, equilibriumPrice, epochsAhead) {
  const theta = PHI_INV; // Mean-reversion speed = 1/φ
  const deviation = currentPrice - equilibriumPrice;
  return equilibriumPrice + deviation * Math.exp(-theta * epochsAhead);
}

// ═══════════════════════════════════════════════════════════════════════════
//  FIBONACCI RETRACEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute Fibonacci retracement levels between two price points.
 *
 * @param {number} high - Epoch high price
 * @param {number} low - Epoch low price
 * @returns {object} Retracement levels
 */
export function fibonacciRetracement(high, low) {
  const range = high - low;
  return {
    '0%': high,
    '23.6%': high - range * 0.236,
    '38.2%': high - range * 0.382,
    '50.0%': high - range * 0.5,
    '61.8%': high - range * 0.618,
    '78.6%': high - range * 0.786,
    '100%': low,
  };
}

/**
 * Compute expected price band for a given epoch.
 *
 * @param {number} startPrice - Price at epoch start
 * @param {number} epochIndex - Current epoch index (0-12)
 * @returns {{high: number, low: number, bandwidth: number}}
 */
export function epochPriceBand(startPrice, epochIndex) {
  const weight = Math.pow(PHI_INV, epochIndex);
  const high = startPrice * Math.pow(PHI, weight);
  const low = startPrice * Math.pow(PHI, -weight);
  return {
    high,
    low,
    bandwidth: (high - low) / startPrice,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  MONTE CARLO SIMULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * φ-derived quasi-random number generator (golden ratio sequence).
 * Produces low-discrepancy sequence for simulation uniformity.
 *
 * @param {number} index - Sequence index
 * @returns {number} Quasi-random value in [0,1)
 */
export function phiRandom(index) {
  return (index * PHI_INV) % 1.0;
}

/**
 * Generate a log-normal random variable using Box-Muller with φ-seed.
 *
 * @param {number} mu - Mean of underlying normal
 * @param {number} sigma - Std dev of underlying normal
 * @param {number} seed1 - First seed value [0,1)
 * @param {number} seed2 - Second seed value [0,1)
 * @returns {number} Log-normal random variate
 */
export function logNormalVariate(mu, sigma, seed1, seed2) {
  // Box-Muller transform
  const u1 = Math.max(seed1, 1e-10); // Avoid log(0)
  const u2 = seed2;
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.exp(mu + sigma * z);
}

/**
 * Run a single Monte Carlo simulation of protocol economics over N epochs.
 *
 * @param {object} params - Simulation parameters
 * @param {number} params.epochs - Number of epochs to simulate (default: 13)
 * @param {number} params.initialSupply - Starting circulating supply
 * @param {number} params.initialPrice - Starting price
 * @param {number} params.avgTxPerEpoch - Average transactions per epoch
 * @param {number} params.seed - Random seed offset
 * @returns {object} Simulation results
 */
export function simulateEpoch(params) {
  const {
    epochs = 13,
    initialSupply = TOTAL_SUPPLY_E8S - TREASURY_E8S,
    initialPrice = 1.0,
    avgTxPerEpoch = 10_000,
    seed = 0,
  } = params;

  let supply = initialSupply;
  let price = initialPrice;
  const results = [];

  for (let epoch = 0; epoch < epochs; epoch++) {
    // Generate stochastic variables
    const s1 = phiRandom(seed + epoch * 2);
    const s2 = phiRandom(seed + epoch * 2 + 1);

    // Transaction volume (log-normal)
    const txCount = Math.floor(logNormalVariate(Math.log(avgTxPerEpoch), PHI_INV, s1, s2));

    // Issuance this epoch
    const issuance = epochIssuanceBudget(epoch);

    // Burns this epoch
    const burns = sinkRate(txCount, 0, 0, 0, 0);

    // Net supply change
    const netChange = issuance - burns;
    supply += netChange;

    // Price dynamics (mean-reversion + random)
    const fundamentalP = fundamentalPrice(TREASURY_E8S / E8S_PER_NOVA, issuance / E8S_PER_NOVA, supply / E8S_PER_NOVA);
    price = meanReversionForecast(price, fundamentalP || price, 1) * (1 + (s1 - 0.5) * PHI_INV * 0.1);

    // Velocity
    const velocity = computeVelocity(txCount * E8S_PER_NOVA * 0.01, supply);

    results.push({
      epoch,
      supply,
      price,
      txCount,
      issuance,
      burns,
      netChange,
      velocity,
      ssr: issuance > 0 ? burns / issuance : Infinity,
    });
  }

  return {
    finalSupply: supply,
    finalPrice: price,
    epochResults: results,
    avgVelocity: results.reduce((s, r) => s + r.velocity, 0) / results.length,
    totalBurned: results.reduce((s, r) => s + r.burns, 0),
    totalIssued: results.reduce((s, r) => s + r.issuance, 0),
  };
}

/**
 * Run full Monte Carlo simulation with multiple iterations.
 *
 * @param {object} params - Base simulation parameters
 * @param {number} iterations - Number of runs (default: φ^8 ≈ 47)
 * @returns {object} Aggregate statistics across all runs
 */
export function monteCarloSimulation(params, iterations = 47) {
  const runs = [];

  for (let i = 0; i < iterations; i++) {
    const result = simulateEpoch({ ...params, seed: i * 7 + 1 });
    runs.push(result);
  }

  // Aggregate statistics
  const finalSupplies = runs.map(r => r.finalSupply);
  const finalPrices = runs.map(r => r.finalPrice);
  const avgVelocities = runs.map(r => r.avgVelocity);

  const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const stdDev = arr => {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length);
  };
  const percentile = (arr, p) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.floor(p * sorted.length);
    return sorted[Math.min(idx, sorted.length - 1)];
  };

  return {
    iterations,
    supply: { mean: mean(finalSupplies), stdDev: stdDev(finalSupplies), min: Math.min(...finalSupplies), max: Math.max(...finalSupplies) },
    price: { mean: mean(finalPrices), stdDev: stdDev(finalPrices), min: Math.min(...finalPrices), max: Math.max(...finalPrices) },
    velocity: { mean: mean(avgVelocities), stdDev: stdDev(avgVelocities) },
    var_61_8: percentile(finalPrices, 1 - PHI_INV), // Value-at-Risk at φ% confidence
    protocolFailures: runs.filter(r => r.finalSupply > TOTAL_SUPPLY_E8S).length,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  ECONOMIC HEALTH DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a comprehensive economic health report.
 *
 * @param {object} state - Current protocol state
 * @returns {object} Full health report with KPIs
 */
export function economicHealthReport(state) {
  const {
    circulatingSupply,
    totalBurned = 0,
    totalLocked = 0,
    txVolumeThisEpoch,
    marketPrice,
    treasuryICP,
    steadyEarnings,
    holderCount = 0,
    epochIndex = 0,
  } = state;

  const velocity = computeVelocity(txVolumeThisEpoch, circulatingSupply);
  const velocityStatus = velocityHealth(velocity);
  const fundPrice = fundamentalPrice(treasuryICP, steadyEarnings, circulatingSupply / E8S_PER_NOVA);
  const priceStatus = priceDeviation(marketPrice, fundPrice);
  const levels = phiPriceLevels(fundPrice);
  const band = epochPriceBand(marketPrice, epochIndex);
  const epochBudget = epochIssuanceBudget(epochIndex);

  return {
    // Velocity
    velocity,
    velocityTarget: 1.0,
    velocityStatus: velocityStatus.level,
    velocityRecommendation: velocityStatus.recommendation,

    // Supply
    circulatingSupply,
    effectiveSupply: TOTAL_SUPPLY_E8S - totalBurned,
    totalBurned,
    totalLocked,
    lockupRatio: totalLocked / (circulatingSupply + totalLocked),

    // Price
    marketPrice,
    fundamentalPrice: fundPrice,
    priceDeviation: priceStatus.deviation,
    priceZone: priceStatus.zone,
    priceAction: priceStatus.action,
    supportLevel: levels.supports[0],
    resistanceLevel: levels.resistances[0],

    // Epoch
    epochIndex,
    epochBudgetRemaining: epochBudget,
    epochPriceBand: band,

    // Health
    holderCount,
    treasuryRunway: steadyEarnings > 0 ? treasuryICP / steadyEarnings : Infinity,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  TOTAL_SUPPLY_E8S, TREASURY_E8S, COMMUNITY_E8S, FOUNDER_E8S, E8S_PER_NOVA, TRANSFER_FEE_E8S,
  computeVelocity, rollingVelocity, velocityHealth, velocityDecomposition,
  sourceRate, epochIssuanceBudget, sinkRate, netSupplyChange, supplyHalfLife,
  fundamentalPrice, phiPriceLevels, priceDeviation, meanReversionForecast,
  fibonacciRetracement, epochPriceBand,
  phiRandom, logNormalVariate, simulateEpoch, monteCarloSimulation,
  economicHealthReport,
};

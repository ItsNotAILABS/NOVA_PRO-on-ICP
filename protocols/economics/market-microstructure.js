///
/// MARKET MICROSTRUCTURE — Orderbook Simulation, Liquidity, AMM Design
///
/// This module implements the market microstructure models defined in AEC-2026 Section 4.
/// It provides AMM invariant calculations, liquidity provisioning, slippage analysis,
/// circuit breaker logic, and price discovery mechanisms.
///
/// Key Models:
///   1. φ-weighted Constant Product AMM (x^(1/φ) × y^(1/φ) = k^(1/φ))
///   2. Liquidity depth and slippage calculation
///   3. LP reward distribution
///   4. Circuit breaker conditions
///   5. Orderbook simulation for limit orders
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

import { PHI, PHI_INV, PHI_SQ, PHI_CB, PHI_4, FIBONACCI } from './behavioral-engine.js';

// ═══════════════════════════════════════════════════════════════════════════
//  MARKET CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

// Tick size: minimum price increment = 1/φ⁴
export const TICK_SIZE = 1 / PHI_4;  // ≈ 0.1459

// Lot size: minimum order quantity = φ^8
export const LOT_SIZE = Math.pow(PHI, 8);  // ≈ 46.979 NNC

// LP fee per trade: 1/φ³
export const LP_FEE_RATE = 1 / PHI_CB;  // ≈ 0.2360 (23.6%)

// Circuit breaker thresholds (in standard deviations)
export const CIRCUIT_BREAKERS = {
  LEVEL_1: PHI_SQ,  // φ² std devs → 1 epoch pause
  LEVEL_2: PHI_CB,  // φ³ std devs → 2 epoch pause + governance alert
  LEVEL_3: PHI_4,   // φ⁴ volume multiplier → halt + emergency vote
};

// Anti-manipulation thresholds
export const MAX_CONCENTRATION = 1 / PHI_SQ;  // 38.2% of liquidity
export const LARGE_ORDER_THRESHOLD = Math.pow(PHI, 8) * LOT_SIZE;  // φ^8 × lot_size

// ═══════════════════════════════════════════════════════════════════════════
//  φ-WEIGHTED AMM (Constant Product Variant)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute the invariant k for the φ-weighted AMM.
 *
 * Invariant: x^(1/φ) × y^(1/φ) = k^(1/φ)
 * Equivalently: k = x × y (same as standard CPMM when simplified)
 *
 * The φ-weighting affects the SWAP curve shape, not the invariant storage.
 * Actual formula: (x + Δx)^(1/φ) × (y - Δy)^(1/φ) = k^(1/φ)
 *
 * @param {number} reserveX - NNC reserves
 * @param {number} reserveY - NOVA reserves
 * @returns {number} Invariant k
 */
export function computeInvariant(reserveX, reserveY) {
  // k^(1/φ) = x^(1/φ) × y^(1/φ)
  // k = (x^(1/φ) × y^(1/φ))^φ
  const xPhi = Math.pow(reserveX, PHI_INV);
  const yPhi = Math.pow(reserveY, PHI_INV);
  return Math.pow(xPhi * yPhi, PHI);
}

/**
 * Compute the output amount for a swap given input.
 *
 * Given: (x + Δx)^(1/φ) × (y - Δy)^(1/φ) = k^(1/φ)
 * Solve for Δy.
 *
 * @param {number} inputAmount - Amount of token being sold (Δx)
 * @param {number} reserveIn - Reserve of the input token (x)
 * @param {number} reserveOut - Reserve of the output token (y)
 * @returns {number} Output amount (Δy) after fee
 */
export function swapOutput(inputAmount, reserveIn, reserveOut) {
  if (inputAmount <= 0 || reserveIn <= 0 || reserveOut <= 0) return 0;

  // Apply fee: effective input = input × (1 - fee)
  const effectiveInput = inputAmount * (1 - LP_FEE_RATE);

  // k^(1/φ) = reserveIn^(1/φ) × reserveOut^(1/φ)
  const kPhi = Math.pow(reserveIn, PHI_INV) * Math.pow(reserveOut, PHI_INV);

  // New reserveIn after trade
  const newReserveIn = reserveIn + effectiveInput;

  // Solve: newReserveIn^(1/φ) × newReserveOut^(1/φ) = kPhi
  // newReserveOut^(1/φ) = kPhi / newReserveIn^(1/φ)
  // newReserveOut = (kPhi / newReserveIn^(1/φ))^φ
  const newReserveOut = Math.pow(kPhi / Math.pow(newReserveIn, PHI_INV), PHI);

  const output = reserveOut - newReserveOut;
  return Math.max(0, output);
}

/**
 * Compute the spot price (marginal rate) from the AMM.
 *
 * Price = dy/dx at current reserves.
 * For φ-weighted AMM: price = (y/x)^(1-1/φ) × (1/φ) ... simplified:
 * Spot price ≈ reserveOut / reserveIn (adjusted by φ-weighting)
 *
 * @param {number} reserveIn - Reserve of numeraire token
 * @param {number} reserveOut - Reserve of quoted token
 * @returns {number} Spot price (units of out per unit of in)
 */
export function spotPrice(reserveIn, reserveOut) {
  if (reserveIn <= 0) return 0;
  // For φ-weighted: price = (1/φ) × (y/x)^(1 - 1/φ) × y/x ... simplifies to:
  // price = (reserveOut / reserveIn) × φ^(2/φ - 2) ... approximately:
  return reserveOut / reserveIn;
}

/**
 * Compute price impact (slippage) for a given trade size.
 *
 * @param {number} tradeSize - Size of the trade
 * @param {number} reserveIn - Reserve of input token
 * @param {number} reserveOut - Reserve of output token
 * @returns {{output: number, effectivePrice: number, spotPrice: number, slippage: number, priceImpact: number}}
 */
export function priceImpact(tradeSize, reserveIn, reserveOut) {
  const spot = spotPrice(reserveIn, reserveOut);
  const output = swapOutput(tradeSize, reserveIn, reserveOut);
  const effectivePrice = tradeSize > 0 ? output / tradeSize : 0;
  const slippage = spot > 0 ? (spot - effectivePrice) / spot : 0;

  return {
    output,
    effectivePrice,
    spotPrice: spot,
    slippage,
    priceImpact: slippage, // Same concept, different name for clarity
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  LIQUIDITY PROVISIONING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute LP token share for adding liquidity.
 *
 * @param {number} amountX - NNC being added
 * @param {number} amountY - NOVA being added
 * @param {number} reserveX - Current NNC reserve
 * @param {number} reserveY - Current NOVA reserve
 * @param {number} totalLPTokens - Current total LP tokens outstanding
 * @returns {{lpTokensMinted: number, shareOfPool: number}}
 */
export function addLiquidity(amountX, amountY, reserveX, reserveY, totalLPTokens) {
  if (totalLPTokens === 0 || reserveX === 0) {
    // Initial liquidity: LP tokens = sqrt(amountX × amountY)
    const minted = Math.sqrt(amountX * amountY);
    return { lpTokensMinted: minted, shareOfPool: 1.0 };
  }

  // Proportional addition: mint LP tokens proportional to contribution
  const ratioX = amountX / reserveX;
  const ratioY = amountY / reserveY;
  const mintRatio = Math.min(ratioX, ratioY); // Use the smaller ratio
  const lpTokensMinted = mintRatio * totalLPTokens;

  return {
    lpTokensMinted,
    shareOfPool: lpTokensMinted / (totalLPTokens + lpTokensMinted),
  };
}

/**
 * Compute the amounts returned when removing liquidity.
 *
 * @param {number} lpTokensToRemove - LP tokens being redeemed
 * @param {number} totalLPTokens - Total LP tokens outstanding
 * @param {number} reserveX - Current NNC reserve
 * @param {number} reserveY - Current NOVA reserve
 * @returns {{amountX: number, amountY: number}}
 */
export function removeLiquidity(lpTokensToRemove, totalLPTokens, reserveX, reserveY) {
  if (totalLPTokens <= 0) return { amountX: 0, amountY: 0 };
  const share = lpTokensToRemove / totalLPTokens;
  return {
    amountX: reserveX * share,
    amountY: reserveY * share,
  };
}

/**
 * Compute impermanent loss for an LP given price change.
 *
 * IL(r) = 2×r^(1/φ) / (1 + r^(1/φ)) - 1
 *
 * @param {number} priceRatio - Current price / entry price
 * @returns {number} Impermanent loss as a fraction (negative = loss)
 */
export function impermanentLoss(priceRatio) {
  if (priceRatio <= 0) return -1;
  const rPhi = Math.pow(priceRatio, PHI_INV);
  return (2 * rPhi) / (1 + rPhi) - 1;
}

/**
 * Compute LP rewards for a given trading volume.
 *
 * @param {number} tradeVolume - Total trading volume this epoch
 * @param {number} lpShare - LP's share of the pool [0,1]
 * @returns {number} LP reward in fee tokens
 */
export function lpReward(tradeVolume, lpShare) {
  return tradeVolume * LP_FEE_RATE * lpShare;
}

/**
 * Compute break-even volume for LP (where fees offset impermanent loss).
 *
 * @param {number} liquidityProvided - Total liquidity provided (in NOVA equivalent)
 * @param {number} priceRatio - Expected price change ratio
 * @param {number} lpShare - LP's share of the pool
 * @returns {number} Required trading volume to break even
 */
export function lpBreakEvenVolume(liquidityProvided, priceRatio, lpShare) {
  const il = Math.abs(impermanentLoss(priceRatio)) * liquidityProvided;
  if (LP_FEE_RATE * lpShare <= 0) return Infinity;
  return il / (LP_FEE_RATE * lpShare);
}

// ═══════════════════════════════════════════════════════════════════════════
//  CIRCUIT BREAKERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if circuit breaker conditions are met.
 *
 * @param {number} priceMove - Price move as multiple of standard deviation
 * @param {number} volumeMultiple - Current volume as multiple of average
 * @returns {{triggered: boolean, level: number, action: string, pauseEpochs: number}}
 */
export function checkCircuitBreaker(priceMove, volumeMultiple) {
  const absMove = Math.abs(priceMove);

  if (volumeMultiple > CIRCUIT_BREAKERS.LEVEL_3) {
    return {
      triggered: true,
      level: 3,
      action: 'HALT_AND_EMERGENCY_VOTE',
      pauseEpochs: Infinity, // Until governance resolves
    };
  }

  if (absMove > CIRCUIT_BREAKERS.LEVEL_2) {
    return {
      triggered: true,
      level: 2,
      action: 'PAUSE_AND_GOVERNANCE_ALERT',
      pauseEpochs: 2,
    };
  }

  if (absMove > CIRCUIT_BREAKERS.LEVEL_1) {
    return {
      triggered: true,
      level: 1,
      action: 'PAUSE_ONE_EPOCH',
      pauseEpochs: 1,
    };
  }

  return {
    triggered: false,
    level: 0,
    action: 'NORMAL_OPERATIONS',
    pauseEpochs: 0,
  };
}

/**
 * Compute rolling volatility (standard deviation of returns).
 *
 * @param {number[]} prices - Array of historical prices (most recent last)
 * @returns {number} Standard deviation of log returns
 */
export function computeVolatility(prices) {
  if (prices.length < 2) return 0;

  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
  }

  if (returns.length === 0) return 0;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance);
}

// ═══════════════════════════════════════════════════════════════════════════
//  ANTI-MANIPULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect potential wash trading pattern.
 *
 * @param {object} trade - Trade data
 * @param {string} trade.buyer - Buyer principal
 * @param {string} trade.seller - Seller principal
 * @param {number} trade.timestamp - Trade timestamp
 * @param {object[]} recentTrades - Recent trades for context
 * @returns {{isWashTrade: boolean, reason: string}}
 */
export function detectWashTrade(trade, recentTrades = []) {
  // Same principal on both sides
  if (trade.buyer === trade.seller) {
    return { isWashTrade: true, reason: 'Self-trade: buyer equals seller' };
  }

  // Same principal pair trading back and forth within 1/φ epochs
  const epochDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  const washWindow = epochDuration * PHI_INV; // 1/φ epochs

  const reverseTrades = recentTrades.filter(t =>
    t.buyer === trade.seller &&
    t.seller === trade.buyer &&
    Math.abs(t.timestamp - trade.timestamp) < washWindow
  );

  if (reverseTrades.length > 0) {
    return { isWashTrade: true, reason: 'Reverse trade detected within wash window' };
  }

  return { isWashTrade: false, reason: '' };
}

/**
 * Check concentration limit for a single account.
 *
 * @param {number} accountLiquidity - Account's liquidity position
 * @param {number} totalLiquidity - Total pool liquidity
 * @returns {{exceeded: boolean, share: number, maxAllowed: number}}
 */
export function checkConcentration(accountLiquidity, totalLiquidity) {
  if (totalLiquidity <= 0) return { exceeded: false, share: 0, maxAllowed: 0 };
  const share = accountLiquidity / totalLiquidity;
  return {
    exceeded: share > MAX_CONCENTRATION,
    share,
    maxAllowed: MAX_CONCENTRATION,
  };
}

/**
 * Determine if an order requires commit-reveal (anti-front-running).
 *
 * @param {number} orderSize - Size of the order
 * @returns {boolean} True if commit-reveal is required
 */
export function requiresCommitReveal(orderSize) {
  return orderSize > LARGE_ORDER_THRESHOLD;
}

// ═══════════════════════════════════════════════════════════════════════════
//  ORDERBOOK SIMULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Simple limit orderbook with φ-tick price levels.
 */
export class OrderBook {
  constructor() {
    this.bids = []; // Buy orders, sorted descending by price
    this.asks = []; // Sell orders, sorted ascending by price
    this.nextOrderId = 1;
    this.trades = [];
  }

  /**
   * Add a limit order to the book.
   *
   * @param {'buy'|'sell'} side
   * @param {number} price - Limit price (must be on tick grid)
   * @param {number} quantity - Order quantity
   * @param {string} principal - Owner principal
   * @returns {object} Order result (filled amount, remaining, trades)
   */
  addOrder(side, price, quantity, principal) {
    // Snap to tick grid
    const tickedPrice = Math.round(price / TICK_SIZE) * TICK_SIZE;

    // Enforce lot size
    const lotQuantity = Math.floor(quantity / LOT_SIZE) * LOT_SIZE;
    if (lotQuantity <= 0) return { filled: 0, remaining: 0, trades: [] };

    const order = {
      id: this.nextOrderId++,
      side,
      price: tickedPrice,
      quantity: lotQuantity,
      remaining: lotQuantity,
      principal,
      timestamp: Date.now(),
    };

    // Try to match against opposite side
    const matchResult = this._match(order);

    // If remaining, add to book
    if (order.remaining > 0) {
      if (side === 'buy') {
        this.bids.push(order);
        this.bids.sort((a, b) => b.price - a.price); // Best bid first
      } else {
        this.asks.push(order);
        this.asks.sort((a, b) => a.price - b.price); // Best ask first
      }
    }

    return {
      orderId: order.id,
      filled: lotQuantity - order.remaining,
      remaining: order.remaining,
      trades: matchResult,
    };
  }

  /**
   * Match an incoming order against the book.
   * @private
   */
  _match(order) {
    const matchedTrades = [];
    const oppositeBook = order.side === 'buy' ? this.asks : this.bids;

    let i = 0;
    while (i < oppositeBook.length && order.remaining > 0) {
      const resting = oppositeBook[i];

      // Check price compatibility
      const canMatch = order.side === 'buy'
        ? order.price >= resting.price
        : order.price <= resting.price;

      if (!canMatch) break;

      // Execute trade
      const fillQty = Math.min(order.remaining, resting.remaining);
      const fillPrice = resting.price; // Price-time priority: resting order's price

      order.remaining -= fillQty;
      resting.remaining -= fillQty;

      const trade = {
        price: fillPrice,
        quantity: fillQty,
        buyer: order.side === 'buy' ? order.principal : resting.principal,
        seller: order.side === 'sell' ? order.principal : resting.principal,
        timestamp: Date.now(),
      };
      matchedTrades.push(trade);
      this.trades.push(trade);

      if (resting.remaining <= 0) {
        oppositeBook.splice(i, 1); // Remove filled order
      } else {
        i++;
      }
    }

    return matchedTrades;
  }

  /**
   * Get current best bid and ask.
   * @returns {{bestBid: number|null, bestAsk: number|null, spread: number|null, midPrice: number|null}}
   */
  getBBO() {
    const bestBid = this.bids.length > 0 ? this.bids[0].price : null;
    const bestAsk = this.asks.length > 0 ? this.asks[0].price : null;
    const spread = bestBid && bestAsk ? bestAsk - bestBid : null;
    const midPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : null;
    return { bestBid, bestAsk, spread, midPrice };
  }

  /**
   * Get orderbook depth at N levels.
   * @param {number} levels - Number of price levels to show
   * @returns {{bids: Array, asks: Array}}
   */
  getDepth(levels = 5) {
    const aggregateLevels = (orders, n) => {
      const levelMap = new Map();
      for (const order of orders) {
        const existing = levelMap.get(order.price) || 0;
        levelMap.set(order.price, existing + order.remaining);
      }
      return [...levelMap.entries()]
        .slice(0, n)
        .map(([price, quantity]) => ({ price, quantity }));
    };

    return {
      bids: aggregateLevels(this.bids, levels),
      asks: aggregateLevels(this.asks, levels),
    };
  }

  /**
   * Get total liquidity in the book.
   * @returns {{bidLiquidity: number, askLiquidity: number, totalLiquidity: number}}
   */
  getLiquidity() {
    const bidLiquidity = this.bids.reduce((s, o) => s + o.remaining * o.price, 0);
    const askLiquidity = this.asks.reduce((s, o) => s + o.remaining, 0);
    return {
      bidLiquidity,
      askLiquidity,
      totalLiquidity: bidLiquidity + askLiquidity,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  // Constants
  TICK_SIZE, LOT_SIZE, LP_FEE_RATE, CIRCUIT_BREAKERS, MAX_CONCENTRATION,

  // AMM
  computeInvariant, swapOutput, spotPrice, priceImpact,

  // Liquidity
  addLiquidity, removeLiquidity, impermanentLoss, lpReward, lpBreakEvenVolume,

  // Circuit Breakers
  checkCircuitBreaker, computeVolatility,

  // Anti-Manipulation
  detectWashTrade, checkConcentration, requiresCommitReveal,

  // Orderbook
  OrderBook,
};

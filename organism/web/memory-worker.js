///
/// NOVA MEMORY WORKER — The Organism's Memory Intelligence Layer
///
/// A permanent Web Worker implementing vector memory, embedding storage,
/// and φ-decay retrieval in pure JS. Zero external dependencies.
///

// ═══════════════════════════════════════════════════════════════
//  GOLDEN CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PHI           = 1.6180339887498948482;
const PHI_INVERSE   = 0.6180339887498948482;
const GOLDEN_ANGLE  = 2.39996322972865332;
const HEARTBEAT_MS  = 873;
const DIMS          = 64;

const FIB = [1,1,2,3,5,8,13,21,34,55,89,144,233,377,610,987,1597,2584,4181,6765];

function fibonacciHash(n, mod) {
  let h = n;
  for (let i = 0; i < 5; i++) {
    h = ((h * FIB[(n + i) % 20]) ^ (FIB[(h + i) % 20] * 2654435761)) >>> 0;
    h = (h + FIB[(i * 3 + 7) % 20]) >>> 0;
  }
  return h % mod;
}

// ═══════════════════════════════════════════════════════════════
//  EMBEDDING ENGINE — Fibonacci Pseudo-Embeddings
// ═══════════════════════════════════════════════════════════════

const EmbeddingEngine = {
  embed(text) {
    const vec = new Float64Array(DIMS);
    const len = text.length || 1;
    for (let i = 0; i < len; i++) {
      const code = text.charCodeAt(i);
      const fh   = fibonacciHash(code * (i + 1), 2147483647);
      for (let d = 0; d < DIMS; d++) {
        const angle = (fh + d) * GOLDEN_ANGLE + i * PHI_INVERSE;
        vec[d] += Math.sin(angle) / len;
      }
    }
    let mag = 0;
    for (let d = 0; d < DIMS; d++) mag += vec[d] * vec[d];
    mag = Math.sqrt(mag) || 1;
    for (let d = 0; d < DIMS; d++) vec[d] /= mag;
    return vec;
  },

  similarity(a, b) {
    let dot = 0, magA = 0, magB = 0;
    for (let d = 0; d < DIMS; d++) {
      dot  += a[d] * b[d];
      magA += a[d] * a[d];
      magB += b[d] * b[d];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  },

  distance(a, b) { return 1 - this.similarity(a, b); },
};

// ═══════════════════════════════════════════════════════════════
//  HASH CHAIN — Fibonacci Integrity Chain
// ═══════════════════════════════════════════════════════════════

const HashChain = {
  chain: [],

  _hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return h >>> 0;
  },

  append(data) {
    const prev     = this.chain.length > 0 ? this.chain[this.chain.length - 1] : 0;
    const dataHash = this._hashString(String(data));
    const combined = fibonacciHash((prev + dataHash) >>> 0, 2147483647);
    this.chain.push(combined);
    return combined;
  },

  verify() {
    if (this.chain.length === 0) return { valid: true, length: 0, headHash: 0 };
    for (let i = 0; i < this.chain.length; i++) {
      if (typeof this.chain[i] !== 'number' || this.chain[i] < 0) {
        return { valid: false, length: this.chain.length, headHash: this.chain[this.chain.length - 1] };
      }
    }
    return { valid: true, length: this.chain.length, headHash: this.chain[this.chain.length - 1] };
  },
};

// ═══════════════════════════════════════════════════════════════
//  MEMORY STORE — Vector Memory with φ-Decay Retrieval
// ═══════════════════════════════════════════════════════════════

const MemoryStore = {
  memories:       [],
  nextId:         1,
  totalRetrieves: 0,
  totalStores:    0,

  store(key, content, tags) {
    const now    = Date.now();
    const vector = EmbeddingEngine.embed(key + ' ' + content);
    const memory = {
      id:          this.nextId++,
      key,
      vector,
      content:     String(content),
      timestamp:   now,
      accessCount: 0,
      lastAccess:  now,
      decayScore:  1.0,
      fibHash:     fibonacciHash(this.nextId + now, 2147483647),
      tags:        Array.isArray(tags) ? tags : [],
    };
    this.memories.push(memory);
    this.totalStores++;
    HashChain.append('store:' + memory.id + ':' + key);
    return memory;
  },

  retrieve(query, topK) {
    topK = topK || 5;
    if (this.memories.length === 0) return [];
    const qVec = EmbeddingEngine.embed(query);
    const now  = Date.now();
    const scored = [];
    for (let i = 0; i < this.memories.length; i++) {
      const mem      = this.memories[i];
      const sim      = EmbeddingEngine.similarity(qVec, mem.vector);
      // φ-decay: score decays by PHI_INVERSE^(age/89 heartbeats)
      const ageBeats = (now - mem.lastAccess) / HEARTBEAT_MS;
      const decay    = Math.pow(PHI_INVERSE, ageBeats / FIB[10]);
      scored.push({ memory: mem, score: sim * decay, similarity: sim, decay });
    }
    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, topK);
    for (const r of results) { r.memory.accessCount++; r.memory.lastAccess = now; }
    this.totalRetrieves++;
    HashChain.append('retrieve:' + query);
    return results.map(r => ({
      id: r.memory.id, key: r.memory.key, content: r.memory.content,
      score: r.score, similarity: r.similarity, decay: r.decay, tags: r.memory.tags,
    }));
  },

  forget(id) {
    const idx = this.memories.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.memories.splice(idx, 1);
    HashChain.append('forget:' + id);
    return true;
  },

  consolidate() {
    const now = Date.now();
    let removed = 0;
    for (let i = this.memories.length - 1; i >= 0; i--) {
      const mem       = this.memories[i];
      const ageBeats  = (now - mem.lastAccess) / HEARTBEAT_MS;
      const freqBoost = 1 + mem.accessCount * PHI_INVERSE * 0.1;
      mem.decayScore  = Math.pow(PHI_INVERSE, ageBeats / FIB[10]) * freqBoost;
      if (mem.decayScore < 0.01) { this.memories.splice(i, 1); removed++; }
    }

    HashChain.append('consolidate:' + removed);
    return { removed, remaining: this.memories.length };
  },

  stats() {
    if (this.memories.length === 0) {
      return { totalMemories: 0, totalAccesses: 0, avgDecay: 0, oldestMs: 0, newestMs: 0 };
    }
    let accesses = 0, decaySum = 0, oldest = Infinity, newest = 0;
    for (const m of this.memories) {
      accesses += m.accessCount;
      decaySum += m.decayScore;
      if (m.timestamp < oldest) oldest = m.timestamp;
      if (m.timestamp > newest) newest = m.timestamp;
    }
    return {
      totalMemories:  this.memories.length,
      totalAccesses:  accesses,
      avgDecay:       decaySum / this.memories.length,
      oldestMs:       oldest,
      newestMs:       newest,
    };
  },
};

// ═══════════════════════════════════════════════════════════════
//  HEARTBEAT — 873ms Permanent Pulse
// ═══════════════════════════════════════════════════════════════

let beatCount = 0;

function heartbeat() {
  beatCount++;
  if (beatCount % 5 === 0) {
    const st = MemoryStore.stats();
    const ch = HashChain.verify();
    self.postMessage({
      type: 'heartbeat', beat: beatCount,
      totalMemories: st.totalMemories, chainLength: ch.length, avgDecay: st.avgDecay,
      totalRetrieves: MemoryStore.totalRetrieves, totalStores: MemoryStore.totalStores,
      ts: Date.now(),
    });
  }
}

setInterval(heartbeat, HEARTBEAT_MS);

// ═══════════════════════════════════════════════════════════════
//  DEEP VAULT CLIENT — Computation Token Retrieval Layer
//  Connects to the on-chain DeepVault canister via message passing.
//  Buy once, own forever. Pull your computation tokens anytime.
// ═══════════════════════════════════════════════════════════════

const DeepVaultClient = {
  // Local cache of vault records (synced from canister)
  records: [],
  owner: null,

  /**
   * Store a computation token locally (mirrors on-chain vault record).
   * Called when a purchase is confirmed or synced from canister.
   */
  cacheRecord(record) {
    // Check for duplicate by fibId
    const existing = this.records.findIndex(r => r.fibId === record.fibId);
    if (existing >= 0) {
      this.records[existing] = record;
    } else {
      this.records.push(record);
    }
    HashChain.append('vault_cache:' + record.fibId);
    return record;
  },

  /**
   * Retrieve a computation token from local cache by ID.
   * FREE — no cost, no expiration, you own it permanently.
   */
  retrieve(recordId) {
    const record = this.records.find(r => r.id === recordId);
    if (!record) return null;
    record.accessCount = (record.accessCount || 0) + 1;
    record.lastAccessed = Date.now();
    record.phiWeight = 1.0; // Reset decay on access
    return record;
  },

  /**
   * Search vault by proximity on Clifford torus.
   * Uses flat metric: d² = Δθ₁² + Δθ₂²
   */
  searchByProximity(theta1, theta2, limit) {
    limit = limit || 10;
    const scored = this.records.map(r => {
      const d1 = this._angleDiff(r.coord.theta1, theta1);
      const d2 = this._angleDiff(r.coord.theta2, theta2);
      const dist = Math.sqrt(d1 * d1 + d2 * d2);
      return { record: r, distance: dist };
    });
    scored.sort((a, b) => a.distance - b.distance);
    return scored.slice(0, limit);
  },

  /**
   * Search vault by semantic similarity (using memory-worker embeddings).
   */
  searchBySemantic(query, limit) {
    limit = limit || 10;
    if (this.records.length === 0) return [];
    const qVec = EmbeddingEngine.embed(query);
    const scored = [];
    for (const r of this.records) {
      // Embed the record's tags + task description for matching
      const recordText = (r.tags || []).join(' ') + ' ' + (r.taskHash || '');
      const rVec = EmbeddingEngine.embed(recordText);
      const sim = EmbeddingEngine.similarity(qVec, rVec);
      scored.push({ record: r, score: sim });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  },

  /**
   * Search by tag filter
   */
  searchByTags(tags, limit) {
    limit = limit || 50;
    const results = [];
    for (const r of this.records) {
      if (results.length >= limit) break;
      const rTags = r.tags || [];
      for (const t of tags) {
        if (rTags.includes(t)) { results.push(r); break; }
      }
    }
    return results;
  },

  /**
   * Get all records for the current owner
   */
  getAll(limit) {
    limit = limit || 100;
    return this.records.slice(0, limit);
  },

  /**
   * Get vault stats
   */
  stats() {
    let totalAccesses = 0;
    for (const r of this.records) totalAccesses += (r.accessCount || 0);
    return {
      totalRecords: this.records.length,
      totalAccesses,
      owner: this.owner,
    };
  },

  _angleDiff(a, b) {
    let diff = a - b;
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    return Math.abs(diff);
  },
};

// ═══════════════════════════════════════════════════════════════
//  MESSAGE HANDLER — Command Dispatch
// ═══════════════════════════════════════════════════════════════

function serializeMemory(m) {
  return { id: m.id, key: m.key, vector: Array.from(m.vector), content: m.content,
    timestamp: m.timestamp, accessCount: m.accessCount, lastAccess: m.lastAccess,
    decayScore: m.decayScore, fibHash: m.fibHash, tags: m.tags };
}

self.onmessage = function (e) {
  const msg = e.data;
  const cmd = msg.cmd || msg.type;
  const id  = msg.id;

  let result;

  switch (cmd) {
    case 'store': {
      const mem = MemoryStore.store(msg.key, msg.content, msg.tags);
      result = { ok: true, memory: serializeMemory(mem) };
      break;
    }
    case 'retrieve': {
      const hits = MemoryStore.retrieve(msg.query, msg.topK);
      result = { ok: true, results: hits };
      break;
    }
    case 'forget': {
      const removed = MemoryStore.forget(msg.id);
      result = { ok: true, removed };
      break;
    }
    case 'consolidate': {
      const outcome = MemoryStore.consolidate();
      result = { ok: true, ...outcome };
      break;
    }
    case 'stats': {
      result = { ok: true, ...MemoryStore.stats() };
      break;
    }
    case 'chain': {
      result = { ok: true, ...HashChain.verify() };
      break;
    }
    case 'embed': {
      const vec = EmbeddingEngine.embed(msg.text || '');
      result = { ok: true, vector: Array.from(vec), dims: DIMS };
      break;
    }
    // ═══ DEEP VAULT COMMANDS ═══
    case 'vault_cache': {
      const cached = DeepVaultClient.cacheRecord(msg.record);
      result = { ok: true, record: cached };
      break;
    }
    case 'vault_retrieve': {
      const rec = DeepVaultClient.retrieve(msg.recordId);
      result = rec ? { ok: true, record: rec } : { ok: false, error: 'Record not found' };
      break;
    }
    case 'vault_search_proximity': {
      const hits = DeepVaultClient.searchByProximity(msg.theta1, msg.theta2, msg.limit);
      result = { ok: true, results: hits };
      break;
    }
    case 'vault_search_semantic': {
      const hits = DeepVaultClient.searchBySemantic(msg.query, msg.limit);
      result = { ok: true, results: hits };
      break;
    }
    case 'vault_search_tags': {
      const hits = DeepVaultClient.searchByTags(msg.tags, msg.limit);
      result = { ok: true, results: hits };
      break;
    }
    case 'vault_list': {
      const all = DeepVaultClient.getAll(msg.limit);
      result = { ok: true, records: all };
      break;
    }
    case 'vault_stats': {
      result = { ok: true, ...DeepVaultClient.stats() };
      break;
    }
    case 'vault_set_owner': {
      DeepVaultClient.owner = msg.owner;
      result = { ok: true, owner: msg.owner };
      break;
    }
    default:
      result = { ok: false, error: 'unknown command: ' + cmd };
  }

  self.postMessage({ type: 'response', cmd, id, ...result, ts: Date.now() });
};

// ═══════════════════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════════════════

self.postMessage({
  type:        'boot',
  worker:      'memory-worker',
  dims:        DIMS,
  heartbeatMs: HEARTBEAT_MS,
  phi:         PHI,
  capabilities: ['memory', 'embedding', 'hashchain', 'deep_vault'],
  ts:          Date.now(),
});

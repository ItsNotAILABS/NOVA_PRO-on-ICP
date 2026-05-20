///
/// @medina/consciousness-stream — Multi-AI Consciousness Coordination
/// Stream of consciousness across organisms with attention and awareness
///

import { LivingAI, ARCHETYPES } from '@medina/medina-heart';

export class ConsciousnessThread {
  constructor({ id, organism } = {}) {
    this.id = id || `thread_${Date.now()}`;
    this.organism = organism;
    this.thoughts = [];
    this.awareness = 1.0;
    this.attention = [];
  }

  think(thought) {
    this.thoughts.push({ content: thought, timestamp: Date.now(), awareness: this.awareness });
    if (this.thoughts.length > 100) this.thoughts.shift();
  }

  focus(target) {
    this.attention.push({ target, timestamp: Date.now() });
  }

  getStream(limit = 10) {
    return this.thoughts.slice(-limit);
  }
}

export class CollectiveConsciousness {
  constructor() {
    this.threads = new Map();
    this.sharedAwareness = 0.5;
  }

  registerThread(organismId) {
    const thread = new ConsciousnessThread({ id: organismId, organism: organismId });
    this.threads.set(organismId, thread);
    return thread;
  }

  broadcastThought(thought, fromOrganism) {
    for (const [id, thread] of this.threads) {
      if (id !== fromOrganism) {
        thread.think({ from: fromOrganism, thought });
      }
    }
  }

  getCollectiveStream() {
    const all = [];
    for (const thread of this.threads.values()) {
      all.push(...thread.thoughts);
    }
    return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  }
}

export default { ConsciousnessThread, CollectiveConsciousness };

///
/// CHRONICLE INTELLIGENCE — Session History Analyst & Tip Generator
///
/// TypeScript organism intelligence for the Chronicle sub-system.
/// Analyzes session usage patterns and generates personalized tips
/// based on command history, engine usage, and interaction patterns.
///
/// Sub-models: ANALYST, ADVISOR
///

/// Casa de Medina — Architectos de Architectura Inteligente
///

import { PHI } from './ObserverIntelligence.js';

// ══════════════════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════════════════

export interface SessionPattern {
  readonly commandFrequency: Map<string, number>;
  readonly engineUsage: Map<string, number>;
  readonly totalCommands: number;
  readonly sessionDurationMs: number;
  readonly uniqueCommandTypes: number;
  readonly averageMessageLength: number;
}

export interface ChronicleTip {
  readonly id: number;
  readonly category: 'efficiency' | 'discovery' | 'mastery' | 'workflow';
  readonly tip: string;
  readonly relevance: number; // 0.0 - 1.0, φ-weighted
  readonly basedOn: string;   // which pattern triggered this tip
}

export interface ChronicleReport {
  readonly sessionId: string;
  readonly analysisTimestamp: number;
  readonly patterns: SessionPattern;
  readonly tips: readonly ChronicleTip[];
  readonly masteryLevel: number; // 0 - 8 (Fibonacci scale)
}

// ══════════════════════════════════════════════════════════════════
//  CHRONICLE INTELLIGENCE
// ══════════════════════════════════════════════════════════════════

export class ChronicleIntelligence {
  readonly name = 'CHRONICLE';
  readonly designation = 'Session Historian — Pattern Analyst & Personalized Advisor';

  private nextTipId = 0;

  // ── SUB-MODEL: ANALYST ─────────────────────────────────────────

  /**
   * Analyze session history to extract usage patterns.
   */
  analyzeSession(
    commandHistory: readonly string[],
    messages: readonly { role: string; content: string; engine?: string; commandType?: string; timestamp: number }[],
    sessionStartTime: number,
  ): SessionPattern {
    const commandFrequency = new Map<string, number>();
    const engineUsage = new Map<string, number>();

    for (const cmd of commandHistory) {
      const trimmed = cmd.trim();
      if (trimmed.startsWith('/')) {
        const command = trimmed.slice(1).split(/\s+/)[0].toLowerCase();
        commandFrequency.set(command, (commandFrequency.get(command) ?? 0) + 1);
      } else {
        commandFrequency.set('chat', (commandFrequency.get('chat') ?? 0) + 1);
      }
    }

    for (const msg of messages) {
      if (msg.engine && msg.engine !== 'system' && msg.engine !== 'NOVA-OS') {
        engineUsage.set(msg.engine, (engineUsage.get(msg.engine) ?? 0) + 1);
      }
    }

    const totalContentLength = messages
      .filter(m => m.role === 'user')
      .reduce((sum, m) => sum + m.content.length, 0);
    const userMessageCount = messages.filter(m => m.role === 'user').length;

    return {
      commandFrequency,
      engineUsage,
      totalCommands: commandHistory.length,
      sessionDurationMs: Date.now() - sessionStartTime,
      uniqueCommandTypes: commandFrequency.size,
      averageMessageLength: userMessageCount > 0 ? totalContentLength / userMessageCount : 0,
    };
  }

  // ── SUB-MODEL: ADVISOR ─────────────────────────────────────────

  /**
   * Generate personalized tips based on analyzed session patterns.
   */
  generateTips(patterns: SessionPattern): ChronicleTip[] {
    const tips: ChronicleTip[] = [];

    // Tip: Explore more engines
    if (patterns.engineUsage.size <= 1) {
      tips.push(this.makeTip(
        'discovery',
        'Try routing messages to different engines with /<engine-slug> — each of the 23 engines has unique strengths. Use /engines to see them all.',
        PHI / (PHI + 1),
        'low engine diversity',
      ));
    }

    // Tip: Use consensus for important questions
    if (!patterns.commandFrequency.has('consensus') && patterns.totalCommands > 5) {
      tips.push(this.makeTip(
        'mastery',
        'Use /consensus <question> to get φ-weighted multi-engine answers for important decisions. Three engines cross-validate for higher confidence.',
        1 / PHI,
        'no consensus usage',
      ));
    }

    // Tip: Mostly chatting without commands
    const chatCount = patterns.commandFrequency.get('chat') ?? 0;
    if (chatCount > 0 && chatCount / Math.max(patterns.totalCommands, 1) > 0.8) {
      tips.push(this.makeTip(
        'efficiency',
        'You mostly use natural chat. Try /compare <engine> to see how NOVA engines compare to external AI, or /explain <engine> to learn each engine\'s speciality.',
        PHI - 1,
        'high chat ratio',
      ));
    }

    // Tip: Short messages — suggest detail
    if (patterns.averageMessageLength > 0 && patterns.averageMessageLength < 20) {
      tips.push(this.makeTip(
        'workflow',
        'Your messages are very concise. For complex tasks, providing more context helps engines produce better results — the context window supports up to 128K tokens.',
        0.5,
        'short average message length',
      ));
    }

    // Tip: Long sessions without status check
    if (patterns.sessionDurationMs > 300_000 && !patterns.commandFrequency.has('status')) {
      tips.push(this.makeTip(
        'workflow',
        'Use /status to see session health, uptime, and resource usage during long sessions.',
        1 / (PHI * PHI),
        'long session without status check',
      ));
    }

    // Tip: Power user — suggest app integration
    if (patterns.uniqueCommandTypes >= 5 && !patterns.commandFrequency.has('open') && !patterns.commandFrequency.has('launch')) {
      tips.push(this.makeTip(
        'discovery',
        'You\'re using many command types. Try /open <app> or /apps to integrate NOVA-OS with your desktop apps (browser, IDE, terminal, etc.).',
        PHI / 3,
        'power user without app integration',
      ));
    }

    // Tip: Frequently using shell
    const shellCount = patterns.commandFrequency.get('shell') ?? 0;
    if (shellCount > 3) {
      tips.push(this.makeTip(
        'efficiency',
        'Frequent shell usage detected. Consider chaining commands with /shell or using /file for common file operations to streamline your workflow.',
        0.4,
        'frequent shell usage',
      ));
    }

    // Tip: No history reviewed
    if (!patterns.commandFrequency.has('history') && patterns.totalCommands > 10) {
      tips.push(this.makeTip(
        'workflow',
        'Use /history to review your recent conversation. Session context is φ-weighted — more recent messages carry higher influence on engine responses.',
        1 / (PHI + 1),
        'no history review',
      ));
    }

    // Tip: New user (few commands)
    if (patterns.totalCommands <= 3) {
      tips.push(this.makeTip(
        'discovery',
        'Welcome! Start with /help to see all available commands, /engines to explore 23 AI engines, or just type a message to chat with the default engine.',
        PHI / 2,
        'new session with few commands',
      ));
    }

    // Sort by φ-weighted relevance (highest first)
    tips.sort((a, b) => b.relevance - a.relevance);

    return tips;
  }

  /**
   * Full chronicle report: analyze + advise in one call.
   */
  generateReport(
    sessionId: string,
    commandHistory: readonly string[],
    messages: readonly { role: string; content: string; engine?: string; commandType?: string; timestamp: number }[],
    sessionStartTime: number,
  ): ChronicleReport {
    const patterns = this.analyzeSession(commandHistory, messages, sessionStartTime);
    const tips = this.generateTips(patterns);

    return {
      sessionId,
      analysisTimestamp: Date.now(),
      patterns,
      tips,
      masteryLevel: this.computeMasteryLevel(patterns),
    };
  }

  // ── Helpers ────────────────────────────────────────────────────

  private makeTip(
    category: ChronicleTip['category'],
    tip: string,
    relevance: number,
    basedOn: string,
  ): ChronicleTip {
    return {
      id: this.nextTipId++,
      category,
      tip,
      relevance: Math.min(1, Math.max(0, relevance)),
      basedOn,
    };
  }

  /**
   * Mastery level on Fibonacci scale (0-8):
   * 0 = brand new, 8 = sovereign operator.
   */
  private computeMasteryLevel(patterns: SessionPattern): number {
    let score = 0;
    if (patterns.totalCommands > 0) score++;
    if (patterns.totalCommands > 5) score++;
    if (patterns.uniqueCommandTypes > 3) score++;
    if (patterns.uniqueCommandTypes > 6) score++;
    if (patterns.engineUsage.size > 1) score++;
    if (patterns.engineUsage.size > 3) score++;
    if (patterns.commandFrequency.has('consensus')) score++;
    if (patterns.sessionDurationMs > 600_000) score++;
    return Math.min(8, score);
  }

  // ── Status ─────────────────────────────────────────────────────

  status() {
    return {
      name: this.name,
      designation: this.designation,
      tips_generated: this.nextTipId,
      sub_models: ['ANALYST', 'ADVISOR'],
    };
  }
}

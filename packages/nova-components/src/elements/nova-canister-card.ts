/**
 * <nova-canister-card> — Canister Status Card
 *
 * A Lit Web Component displaying canister status with φ-weighted styling.
 * Element class (gold/silver/crimson) determines visual appearance.
 *
 * Usage:
 *   <nova-canister-card
 *     canister-id="brain"
 *     name="Brain"
 *     status="active"
 *     element-class="crimson"
 *     cycles="1000000000"
 *     memory="100000000"
 *   ></nova-canister-card>
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { PHI, PHI_INV, ELEMENT_COLORS, type ElementClass } from '../phi-utils.js';

export type CanisterStatus = 'dormant' | 'initializing' | 'active' | 'migrating' | 'evolved' | 'error';

@customElement('nova-canister-card')
export class NovaCanisterCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .card {
      background: #141414;
      border: 1px solid #2a2a2a;
      border-radius: 0.618rem;
      padding: 1.618rem 1.25rem;
      transition: all 233ms ease-out;
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--element-color);
      opacity: 0.8;
    }

    .card:hover {
      border-color: var(--element-color);
      transform: translateY(-2px);
      box-shadow: 0 8px 32px var(--element-glow);
    }

    .card.gold { --element-color: #c9a84c; --element-glow: rgba(201, 168, 76, 0.2); }
    .card.silver { --element-color: #94a3b8; --element-glow: rgba(148, 163, 184, 0.2); }
    .card.crimson { --element-color: #dc2626; --element-glow: rgba(220, 38, 38, 0.2); }

    .header {
      display: flex;
      align-items: center;
      gap: 0.618rem;
      margin-bottom: 1rem;
    }

    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--status-color);
      box-shadow: 0 0 8px var(--status-color);
      animation: pulse 1.618s ease-in-out infinite;
    }

    .status-indicator.dormant { --status-color: #555; animation: none; }
    .status-indicator.initializing { --status-color: #fbbf24; }
    .status-indicator.active { --status-color: #22c55e; }
    .status-indicator.migrating { --status-color: #3b82f6; }
    .status-indicator.evolved { --status-color: #a855f7; }
    .status-indicator.error { --status-color: #ef4444; animation: pulse-error 0.618s ease-in-out infinite; }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.618; }
    }

    @keyframes pulse-error {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.382; }
    }

    .name {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--element-color);
      flex: 1;
    }

    .element-badge {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      background: rgba(255, 255, 255, 0.05);
      color: var(--element-color);
      border: 1px solid var(--element-color);
      opacity: 0.8;
    }

    .metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.618rem;
      margin-top: 1rem;
    }

    .metric {
      background: rgba(255, 255, 255, 0.02);
      padding: 0.618rem;
      border-radius: 0.382rem;
    }

    .metric-label {
      font-size: 0.75rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }

    .metric-value {
      font-size: 0.95rem;
      color: #e8e8e8;
      font-weight: 500;
      font-family: 'JetBrains Mono', monospace;
    }

    .status-text {
      font-size: 0.85rem;
      color: #888;
      margin-top: 0.618rem;
      display: flex;
      align-items: center;
      gap: 0.382rem;
    }

    .status-text span {
      text-transform: capitalize;
    }
  `;

  @property({ type: String, attribute: 'canister-id' })
  canisterId = '';

  @property({ type: String })
  name = '';

  @property({ type: String })
  status: CanisterStatus = 'dormant';

  @property({ type: String, attribute: 'element-class' })
  elementClass: ElementClass = 'silver';

  @property({ type: Number })
  cycles = 0;

  @property({ type: Number })
  memory = 0;

  @state()
  private _formattedCycles = '0';

  @state()
  private _formattedMemory = '0';

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('cycles')) {
      this._formattedCycles = this._formatNumber(this.cycles);
    }
    if (changedProperties.has('memory')) {
      this._formattedMemory = this._formatBytes(this.memory);
    }
  }

  private _formatNumber(n: number): string {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
    return n.toString();
  }

  private _formatBytes(bytes: number): string {
    if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
    if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(2)} KB`;
    return `${bytes} B`;
  }

  override render() {
    return html`
      <div class="card ${this.elementClass}">
        <div class="header">
          <div class="status-indicator ${this.status}"></div>
          <span class="name">${this.name || this.canisterId}</span>
          <span class="element-badge">${this.elementClass}</span>
        </div>

        <div class="metrics">
          <div class="metric">
            <div class="metric-label">Cycles</div>
            <div class="metric-value">${this._formattedCycles}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Memory</div>
            <div class="metric-value">${this._formattedMemory}</div>
          </div>
        </div>

        <div class="status-text">
          Status: <span>${this.status}</span>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'nova-canister-card': NovaCanisterCard;
  }
}

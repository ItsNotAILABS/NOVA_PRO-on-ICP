/**
 * <nova-health-gauge> — φ-Weighted System Health Display
 *
 * A circular gauge displaying system health with golden-ratio segments.
 * Visual design inspired by sovereign elements (gold/silver/crimson).
 *
 * Usage:
 *   <nova-health-gauge
 *     value="0.85"
 *     label="System Health"
 *     element-class="gold"
 *   ></nova-health-gauge>
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { PHI, PHI_INV, type ElementClass } from '../phi-utils.js';

@customElement('nova-health-gauge')
export class NovaHealthGauge extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .gauge-container {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.618rem;
    }

    .gauge {
      position: relative;
      width: 120px;
      height: 120px;
    }

    svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .track {
      fill: none;
      stroke: #2a2a2a;
      stroke-width: 8;
    }

    .progress {
      fill: none;
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dashoffset 610ms ease-out, stroke 233ms ease-out;
    }

    .progress.gold { stroke: #c9a84c; }
    .progress.silver { stroke: #94a3b8; }
    .progress.crimson { stroke: #dc2626; }

    /* Health-based color override */
    .progress.health-critical { stroke: #dc2626; }
    .progress.health-warning { stroke: #fbbf24; }
    .progress.health-good { stroke: #22c55e; }
    .progress.health-excellent { stroke: #c9a84c; }

    .value-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .value {
      font-size: 1.618rem;
      font-weight: 700;
      color: #e8e8e8;
      line-height: 1;
    }

    .percentage {
      font-size: 0.75rem;
      color: #888;
    }

    .label {
      font-size: 0.85rem;
      color: #888;
      text-align: center;
      max-width: 120px;
    }

    /* Glow effect based on health */
    .gauge.excellent {
      filter: drop-shadow(0 0 8px rgba(201, 168, 76, 0.4));
    }

    .gauge.good {
      filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.3));
    }

    .gauge.warning {
      filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.4));
    }

    .gauge.critical {
      filter: drop-shadow(0 0 8px rgba(220, 38, 38, 0.5));
      animation: pulse-critical 0.618s ease-in-out infinite;
    }

    @keyframes pulse-critical {
      0%, 100% { filter: drop-shadow(0 0 8px rgba(220, 38, 38, 0.5)); }
      50% { filter: drop-shadow(0 0 16px rgba(220, 38, 38, 0.7)); }
    }

    /* Fibonacci tick marks */
    .tick-marks {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
    }

    .tick {
      position: absolute;
      width: 2px;
      height: 6px;
      background: #555;
      transform-origin: center 60px;
      left: calc(50% - 1px);
      top: 0;
    }

    .tick.major {
      height: 10px;
      width: 2px;
      background: #888;
    }
  `;

  /** Health value (0-1) */
  @property({ type: Number })
  value = 1;

  /** Display label */
  @property({ type: String })
  label = 'Health';

  /** Element class for styling */
  @property({ type: String, attribute: 'element-class' })
  elementClass: ElementClass = 'gold';

  /** Whether to show color based on health value */
  @property({ type: Boolean, attribute: 'health-colors' })
  healthColors = true;

  /** Size of the gauge */
  @property({ type: Number })
  size = 120;

  @state()
  private _circumference = 0;

  @state()
  private _offset = 0;

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('value') || changedProperties.has('size')) {
      const radius = (this.size - 16) / 2;  // Subtract stroke width
      this._circumference = 2 * Math.PI * radius;
      this._offset = this._circumference * (1 - Math.max(0, Math.min(1, this.value)));
    }
  }

  private _getHealthClass(): string {
    if (!this.healthColors) return this.elementClass;

    // φ-thresholds: 1/φ³ ≈ 0.236, 1/φ² ≈ 0.382, 1/φ ≈ 0.618
    if (this.value < 0.236) return 'health-critical';
    if (this.value < 0.382) return 'health-warning';
    if (this.value < 0.618) return 'health-good';
    return 'health-excellent';
  }

  private _getGaugeClass(): string {
    if (this.value < 0.236) return 'critical';
    if (this.value < 0.382) return 'warning';
    if (this.value < 0.618) return 'good';
    return 'excellent';
  }

  private _generateTicks(): number[] {
    // Fibonacci-based tick positions: F(n)/F(12) at 0, 0.007, 0.014, 0.021, 0.035, 0.056, 0.09, 0.146, 0.236, 0.382, 0.618, 1
    // Simplified to major ticks at φ-thresholds
    return [0, 0.236, 0.382, 0.618, 1];
  }

  override render() {
    const radius = (this.size - 16) / 2;
    const center = this.size / 2;
    const percentage = Math.round(this.value * 100);
    const healthClass = this._getHealthClass();
    const gaugeClass = this._getGaugeClass();

    return html`
      <div class="gauge-container">
        <div class="gauge ${gaugeClass}" style="width: ${this.size}px; height: ${this.size}px;">
          <svg viewBox="0 0 ${this.size} ${this.size}">
            <!-- Track -->
            <circle
              class="track"
              cx="${center}"
              cy="${center}"
              r="${radius}"
            />
            <!-- Progress -->
            <circle
              class="progress ${healthClass}"
              cx="${center}"
              cy="${center}"
              r="${radius}"
              stroke-dasharray="${this._circumference}"
              stroke-dashoffset="${this._offset}"
            />
          </svg>

          <!-- Tick marks (Fibonacci positions) -->
          <div class="tick-marks">
            ${this._generateTicks().map((pos) => {
              const angle = pos * 360 - 90;  // -90 to start from top
              return html`
                <div
                  class="tick ${pos === 0 || pos === 1 || pos === 0.618 ? 'major' : ''}"
                  style="transform: rotate(${angle}deg);"
                ></div>
              `;
            })}
          </div>

          <!-- Value display -->
          <div class="value-container">
            <div class="value">${percentage}</div>
            <div class="percentage">%</div>
          </div>
        </div>

        ${this.label ? html`<div class="label">${this.label}</div>` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'nova-health-gauge': NovaHealthGauge;
  }
}

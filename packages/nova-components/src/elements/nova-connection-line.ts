/**
 * <nova-connection-line> — Organism Connection Visualizer
 *
 * A Lit Web Component that draws animated connection lines between organisms.
 * Line thickness and glow based on signal strength (φ-weighted).
 *
 * Usage:
 *   <nova-connection-line
 *     from-x="100"
 *     from-y="100"
 *     to-x="300"
 *     to-y="200"
 *     signal-strength="0.85"
 *     element-class="silver"
 *   ></nova-connection-line>
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { PHI, type ElementClass, ELEMENT_COLORS } from '../phi-utils.js';

@customElement('nova-connection-line')
export class NovaConnectionLine extends LitElement {
  static override styles = css`
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: visible;
    }

    svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .connection-line {
      fill: none;
      stroke-linecap: round;
      transition: stroke-width 233ms ease-out, opacity 144ms ease-out;
    }

    .connection-line.gold { stroke: #c9a84c; }
    .connection-line.silver { stroke: #94a3b8; }
    .connection-line.crimson { stroke: #dc2626; }

    /* Signal pulse animation */
    .signal-pulse {
      fill: currentColor;
      opacity: 0.8;
    }

    .signal-pulse.gold { color: #c9a84c; }
    .signal-pulse.silver { color: #94a3b8; }
    .signal-pulse.crimson { color: #dc2626; }

    @keyframes pulse-along-path {
      0% {
        offset-distance: 0%;
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      90% {
        opacity: 1;
      }
      100% {
        offset-distance: 100%;
        opacity: 0;
      }
    }

    .animated-pulse {
      offset-path: var(--connection-path);
      animation: pulse-along-path var(--pulse-duration) linear infinite;
    }

    /* Glow filter */
    .glow {
      filter: drop-shadow(0 0 4px currentColor) drop-shadow(0 0 8px currentColor);
    }
  `;

  @property({ type: Number, attribute: 'from-x' })
  fromX = 0;

  @property({ type: Number, attribute: 'from-y' })
  fromY = 0;

  @property({ type: Number, attribute: 'to-x' })
  toX = 100;

  @property({ type: Number, attribute: 'to-y' })
  toY = 100;

  /** Signal strength (0-1), affects line thickness and animation speed */
  @property({ type: Number, attribute: 'signal-strength' })
  signalStrength = 0.5;

  @property({ type: String, attribute: 'element-class' })
  elementClass: ElementClass = 'silver';

  /** Whether to animate signal pulses */
  @property({ type: Boolean })
  animated = true;

  /** Whether to show glow effect */
  @property({ type: Boolean })
  glow = true;

  @state()
  private _pathD = '';

  @state()
  private _strokeWidth = 2;

  @state()
  private _pulseDuration = '1618ms';

  override willUpdate(changedProperties: PropertyValues) {
    if (
      changedProperties.has('fromX') ||
      changedProperties.has('fromY') ||
      changedProperties.has('toX') ||
      changedProperties.has('toY')
    ) {
      this._calculatePath();
    }

    if (changedProperties.has('signalStrength')) {
      // Stroke width: 1-4px based on signal strength (φ-scaled)
      this._strokeWidth = 1 + this.signalStrength * 3 * PHI;

      // Pulse duration: faster for stronger signals (inverse relationship)
      // Range: 2618ms (weak) to 610ms (strong) — Fibonacci values
      const baseDuration = 2618;
      const minDuration = 610;
      const duration = baseDuration - (baseDuration - minDuration) * this.signalStrength;
      this._pulseDuration = `${Math.round(duration)}ms`;
    }
  }

  private _calculatePath() {
    // Create a curved path between points (quadratic bezier)
    const midX = (this.fromX + this.toX) / 2;
    const midY = (this.fromY + this.toY) / 2;

    // Control point offset perpendicular to the line (φ-scaled)
    const dx = this.toX - this.fromX;
    const dy = this.toY - this.fromY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const curveOffset = length * 0.2 * PHI;  // φ-weighted curve

    // Perpendicular direction
    const perpX = -dy / length;
    const perpY = dx / length;

    const ctrlX = midX + perpX * curveOffset;
    const ctrlY = midY + perpY * curveOffset;

    this._pathD = `M ${this.fromX} ${this.fromY} Q ${ctrlX} ${ctrlY} ${this.toX} ${this.toY}`;
  }

  private _getOpacity(): number {
    // Opacity based on signal strength with φ minimum
    return 0.382 + this.signalStrength * 0.618;  // Range: 0.382 - 1.0
  }

  override render() {
    const opacity = this._getOpacity();
    const colors = ELEMENT_COLORS[this.elementClass];

    // Calculate SVG viewBox to contain the path
    const minX = Math.min(this.fromX, this.toX) - 20;
    const minY = Math.min(this.fromY, this.toY) - 20;
    const maxX = Math.max(this.fromX, this.toX) + 20;
    const maxY = Math.max(this.fromY, this.toY) + 20;

    return html`
      <svg viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}">
        <defs>
          <!-- Gradient for line -->
          <linearGradient id="lineGradient-${this.elementClass}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${colors.primary}" stop-opacity="0.5" />
            <stop offset="50%" stop-color="${colors.primary}" stop-opacity="1" />
            <stop offset="100%" stop-color="${colors.primary}" stop-opacity="0.5" />
          </linearGradient>

          <!-- Glow filter -->
          <filter id="glow-${this.elementClass}" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Main connection line -->
        <path
          class="connection-line ${this.elementClass} ${this.glow ? 'glow' : ''}"
          d="${this._pathD}"
          stroke-width="${this._strokeWidth}"
          opacity="${opacity}"
          ${this.glow ? `filter="url(#glow-${this.elementClass})"` : ''}
        />

        <!-- Signal pulse (animated dot along path) -->
        ${this.animated && this.signalStrength > 0.1 ? html`
          <circle
            class="signal-pulse ${this.elementClass}"
            r="${2 + this.signalStrength * 3}"
            style="
              offset-path: path('${this._pathD}');
              animation: pulse-along-path ${this._pulseDuration} linear infinite;
            "
          >
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes="0;0.1;0.9;1"
              dur="${this._pulseDuration}"
              repeatCount="indefinite"
            />
          </circle>
        ` : ''}

        <!-- Endpoint markers -->
        <circle
          cx="${this.fromX}"
          cy="${this.fromY}"
          r="4"
          fill="${colors.primary}"
          opacity="${opacity * 0.8}"
        />
        <circle
          cx="${this.toX}"
          cy="${this.toY}"
          r="4"
          fill="${colors.primary}"
          opacity="${opacity * 0.8}"
        />
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'nova-connection-line': NovaConnectionLine;
  }
}

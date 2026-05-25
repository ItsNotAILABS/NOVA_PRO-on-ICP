/**
 * <nova-organism-grid> — Golden-Spiral Organism Layout
 *
 * A Lit Web Component that arranges child elements in a golden-spiral
 * phyllotaxis pattern. Each element is positioned using φ-mathematics.
 *
 * Usage:
 *   <nova-organism-grid scale="30" center-offset="200">
 *     <nova-canister-card ...></nova-canister-card>
 *     <nova-canister-card ...></nova-canister-card>
 *   </nova-organism-grid>
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { phyllotaxisXY, PHI, GOLDEN_ANGLE_DEG } from '../phi-utils.js';

@customElement('nova-organism-grid')
export class NovaOrganismGrid extends LitElement {
  static override styles = css`
    :host {
      display: block;
      position: relative;
      width: 100%;
      min-height: 400px;
    }

    .grid-container {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: inherit;
    }

    .item-wrapper {
      position: absolute;
      transition: transform 377ms ease-out, opacity 233ms ease-out;
      transform-origin: center center;
    }

    .item-wrapper:hover {
      z-index: 10;
      transform: scale(1.05);
    }

    .center-marker {
      position: absolute;
      width: 20px;
      height: 20px;
      background: radial-gradient(circle, rgba(201, 168, 76, 0.5) 0%, transparent 70%);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }

    /* Spiral visualization (optional debug) */
    .spiral-path {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      opacity: 0.1;
    }

    ::slotted(*) {
      display: block;
    }

    /* Animation for items appearing */
    @keyframes phi-appear {
      from {
        opacity: 0;
        transform: scale(0.618) rotate(calc(var(--phi-index) * 137.5deg));
      }
      to {
        opacity: 1;
        transform: scale(1) rotate(0deg);
      }
    }

    .item-wrapper.animate-in {
      animation: phi-appear 377ms ease-out forwards;
      animation-delay: calc(var(--phi-index) * 55ms);
    }
  `;

  /** Scale factor for spiral radius */
  @property({ type: Number })
  scale = 30;

  /** Offset from container center (pixels) */
  @property({ type: Number, attribute: 'center-offset' })
  centerOffset = 200;

  /** Whether to animate items on appearance */
  @property({ type: Boolean })
  animate = true;

  /** Show center marker */
  @property({ type: Boolean, attribute: 'show-center' })
  showCenter = false;

  @state()
  private _itemPositions: Array<{ x: number; y: number; index: number }> = [];

  @query('.grid-container')
  private _container!: HTMLElement;

  private _resizeObserver: ResizeObserver | null = null;
  private _slotObserver: MutationObserver | null = null;

  override connectedCallback() {
    super.connectedCallback();

    // Observe container size changes
    this._resizeObserver = new ResizeObserver(() => {
      this._updateLayout();
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._slotObserver?.disconnect();
  }

  override firstUpdated() {
    if (this._container && this._resizeObserver) {
      this._resizeObserver.observe(this._container);
    }

    // Observe slot changes
    const slot = this.shadowRoot?.querySelector('slot');
    if (slot) {
      slot.addEventListener('slotchange', () => this._updateLayout());
    }

    this._updateLayout();
  }

  override updated(changedProperties: PropertyValues) {
    if (changedProperties.has('scale') || changedProperties.has('centerOffset')) {
      this._updateLayout();
    }
  }

  private _updateLayout() {
    const slot = this.shadowRoot?.querySelector('slot');
    if (!slot) return;

    const items = (slot as HTMLSlotElement).assignedElements();
    const containerRect = this._container?.getBoundingClientRect();

    if (!containerRect) return;

    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;

    // Calculate positions using phyllotaxis
    this._itemPositions = items.map((_, i) => {
      const { x, y } = phyllotaxisXY(i, this.scale);
      return {
        x: x + centerX,
        y: y + centerY,
        index: i,
      };
    });

    // Apply positions to wrappers
    this._positionItems();
  }

  private _positionItems() {
    const wrappers = this.shadowRoot?.querySelectorAll('.item-wrapper');
    if (!wrappers) return;

    wrappers.forEach((wrapper, i) => {
      const pos = this._itemPositions[i];
      if (pos) {
        const el = wrapper as HTMLElement;
        el.style.left = `${pos.x}px`;
        el.style.top = `${pos.y}px`;
        el.style.transform = 'translate(-50%, -50%)';
        el.style.setProperty('--phi-index', String(pos.index));
      }
    });
  }

  override render() {
    const slot = this.shadowRoot?.querySelector('slot');
    const items = slot ? (slot as HTMLSlotElement).assignedElements() : [];

    return html`
      <div class="grid-container">
        ${this.showCenter ? html`
          <div
            class="center-marker"
            style="left: 50%; top: 50%;"
          ></div>
        ` : ''}

        ${this._itemPositions.map((pos, i) => html`
          <div
            class="item-wrapper ${this.animate ? 'animate-in' : ''}"
            style="--phi-index: ${pos.index};"
          >
          </div>
        `)}

        <slot @slotchange=${this._handleSlotChange}></slot>
      </div>
    `;
  }

  private _handleSlotChange() {
    this._updateLayout();

    // Re-render to create wrappers
    this.requestUpdate();

    // Position items after a microtask
    queueMicrotask(() => {
      this._positionSlottedItems();
    });
  }

  private _positionSlottedItems() {
    const slot = this.shadowRoot?.querySelector('slot');
    if (!slot) return;

    const items = (slot as HTMLSlotElement).assignedElements();
    const containerRect = this._container?.getBoundingClientRect();

    if (!containerRect) return;

    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;

    items.forEach((item, i) => {
      const { x, y } = phyllotaxisXY(i, this.scale);
      const el = item as HTMLElement;

      el.style.position = 'absolute';
      el.style.left = `${x + centerX}px`;
      el.style.top = `${y + centerY}px`;
      el.style.transform = 'translate(-50%, -50%)';
      el.style.setProperty('--phi-index', String(i));

      if (this.animate) {
        el.style.animation = `phi-appear 377ms ease-out forwards`;
        el.style.animationDelay = `${i * 55}ms`;
      }
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'nova-organism-grid': NovaOrganismGrid;
  }
}

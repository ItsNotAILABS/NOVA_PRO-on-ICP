/**
 * Tailwind CSS Configuration — φ-Mathematics Foundation
 *
 * Golden-ratio spacing, Fibonacci grid tracks, and sovereign color palette.
 * All spacing values derived from φ (1.618) and Fibonacci sequence.
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // ─── φ-Derived Spacing Scale ───────────────────────────────────────────
      // Based on PHI = 1.6180339887498948482
      spacing: {
        // Golden ratio progression (base: 1rem = 16px)
        'phi-0': '0.618rem',     // 1/φ ≈ 0.618
        'phi-1': '1rem',         // 1
        'phi-2': '1.618rem',     // φ
        'phi-3': '2.618rem',     // φ²
        'phi-4': '4.236rem',     // φ³
        'phi-5': '6.854rem',     // φ⁴
        'phi-6': '11.09rem',     // φ⁵
        'phi-7': '17.944rem',    // φ⁶

        // Fibonacci sequence spacing (fib(n)/8 rem for practical sizes)
        'fib-1': '0.125rem',     // F(1)/8 = 1/8 = 2px
        'fib-2': '0.125rem',     // F(2)/8 = 1/8 = 2px
        'fib-3': '0.25rem',      // F(3)/8 = 2/8 = 4px
        'fib-5': '0.625rem',     // F(5)/8 = 5/8 = 10px
        'fib-8': '1rem',         // F(8)/8 = 8/8 = 16px
        'fib-13': '1.625rem',    // F(13)/8 = 13/8 = 26px
        'fib-21': '2.625rem',    // F(21)/8 = 21/8 = 42px
        'fib-34': '4.25rem',     // F(34)/8 = 34/8 = 68px
        'fib-55': '6.875rem',    // F(55)/8 = 55/8 = 110px
        'fib-89': '11.125rem',   // F(89)/8 = 89/8 = 178px
        'fib-144': '18rem',      // F(144)/8 = 144/8 = 288px
      },

      // ─── Fibonacci Grid Columns ────────────────────────────────────────────
      // Grid columns follow Fibonacci pattern: 1, 1, 2, 3, 5, 8, 13
      gridTemplateColumns: {
        'fib-2': '1fr 1fr',                           // 1:1
        'fib-3': '1fr 1fr 2fr',                       // 1:1:2
        'fib-4': '1fr 1fr 2fr 3fr',                   // 1:1:2:3
        'fib-5': '1fr 1fr 2fr 3fr 5fr',               // 1:1:2:3:5
        'fib-6': '1fr 1fr 2fr 3fr 5fr 8fr',           // 1:1:2:3:5:8
        'fib-7': '1fr 1fr 2fr 3fr 5fr 8fr 13fr',      // 1:1:2:3:5:8:13

        // Golden ratio split (φ:1)
        'phi': '1fr 1.618fr',                         // 1:φ
        'phi-inv': '1.618fr 1fr',                     // φ:1 (primary first)

        // Golden thirds (1:φ:φ²)
        'phi-thirds': '1fr 1.618fr 2.618fr',

        // Organism dashboard grid
        'organism': 'repeat(auto-fill, minmax(280px, 1fr))',
      },

      // ─── Golden Ratio Flex ─────────────────────────────────────────────────
      flex: {
        'phi': '1.618 1.618 0%',      // φ flex-grow/shrink
        'phi-inv': '0.618 0.618 0%',  // 1/φ flex-grow/shrink
        'fib-1': '1 1 0%',
        'fib-2': '1 1 0%',
        'fib-3': '2 2 0%',
        'fib-5': '5 5 0%',
        'fib-8': '8 8 0%',
        'fib-13': '13 13 0%',
      },

      // ─── Sovereign Color Palette ───────────────────────────────────────────
      // Derived from sovereign-elements: Gold, Silver, Crimson
      colors: {
        // Background tones
        nova: {
          bg: '#0a0a0a',
          surface: '#111111',
          card: '#141414',
          elevated: '#1a1a1a',
        },

        // Text colors
        text: {
          DEFAULT: '#e8e8e8',
          muted: '#888888',
          dim: '#555555',
        },

        // Gold (Aurum) — Immutable State
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#c9a84c',   // Primary accent
          600: '#b8973f',
          700: '#a78635',
          800: '#966f2c',
          900: '#7c5a24',
          950: '#422d0e',
        },

        // Silver (Argentum) — Conductor
        silver: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },

        // Crimson (Living Organism)
        crimson: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#450a0a',
          950: '#220505',
        },

        // Accent aliases
        accent: {
          DEFAULT: '#c9a84c',
          hover: '#e2c06e',
          muted: 'rgba(201, 168, 76, 0.08)',
        },

        border: {
          DEFAULT: '#2a2a2a',
          hover: '#c9a84c',
        },
      },

      // ─── Border Radius (Fibonacci-based) ───────────────────────────────────
      borderRadius: {
        'phi': '0.618rem',
        'fib-3': '0.25rem',
        'fib-5': '0.625rem',
        'fib-8': '1rem',
        'fib-13': '1.625rem',
      },

      // ─── Font Size (Golden Scale) ──────────────────────────────────────────
      fontSize: {
        'phi-xs': ['0.618rem', { lineHeight: '1rem' }],      // ~10px
        'phi-sm': ['0.764rem', { lineHeight: '1.1rem' }],    // ~12px
        'phi-base': ['1rem', { lineHeight: '1.618rem' }],    // 16px
        'phi-lg': ['1.236rem', { lineHeight: '1.8rem' }],    // ~20px
        'phi-xl': ['1.618rem', { lineHeight: '2.2rem' }],    // ~26px
        'phi-2xl': ['2rem', { lineHeight: '2.618rem' }],     // 32px
        'phi-3xl': ['2.618rem', { lineHeight: '3.2rem' }],   // ~42px
        'phi-4xl': ['3.236rem', { lineHeight: '4rem' }],     // ~52px
        'phi-5xl': ['4.236rem', { lineHeight: '5rem' }],     // ~68px
      },

      // ─── Transition Duration (Fibonacci ms) ────────────────────────────────
      transitionDuration: {
        'fib-21': '21ms',
        'fib-34': '34ms',
        'fib-55': '55ms',
        'fib-89': '89ms',
        'fib-144': '144ms',
        'fib-233': '233ms',
        'fib-377': '377ms',
        'fib-610': '610ms',
        'phi': '1618ms',   // φ × 1000ms
      },

      // ─── Animation (φ-timed) ───────────────────────────────────────────────
      animation: {
        'phi-pulse': 'phi-pulse 1.618s ease-in-out infinite',
        'phi-spin': 'spin 1.618s linear infinite',
        'fib-fade': 'fib-fade 377ms ease-out',
        'golden-spiral': 'golden-spiral 2.618s ease-in-out infinite',
      },

      keyframes: {
        'phi-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.618' },  // 1/φ opacity
        },
        'fib-fade': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'golden-spiral': {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(137.5deg) scale(1.618)' },  // Golden angle
          '100%': { transform: 'rotate(275deg) scale(1)' },
        },
      },

      // ─── Box Shadow (φ-layered) ────────────────────────────────────────────
      boxShadow: {
        'phi-sm': '0 1px 2px rgba(0, 0, 0, 0.618)',
        'phi': '0 2px 8px rgba(0, 0, 0, 0.382), 0 4px 16px rgba(0, 0, 0, 0.236)',
        'phi-lg': '0 4px 16px rgba(0, 0, 0, 0.382), 0 8px 32px rgba(0, 0, 0, 0.236), 0 16px 64px rgba(0, 0, 0, 0.146)',
        'gold-glow': '0 0 16px rgba(201, 168, 76, 0.3), 0 0 32px rgba(201, 168, 76, 0.2)',
        'crimson-glow': '0 0 16px rgba(220, 38, 38, 0.3), 0 0 32px rgba(220, 38, 38, 0.2)',
      },

      // ─── Max Width (Fibonacci-based) ───────────────────────────────────────
      maxWidth: {
        'fib-21': '21rem',
        'fib-34': '34rem',
        'fib-55': '55rem',
        'fib-89': '89rem',
        'phi-prose': '68.75rem',  // 1100px / 16
      },

      // ─── Z-Index (Fibonacci layers) ────────────────────────────────────────
      zIndex: {
        'fib-1': '1',
        'fib-2': '2',
        'fib-3': '3',
        'fib-5': '5',
        'fib-8': '8',
        'fib-13': '13',
        'fib-21': '21',
        'fib-34': '34',
        'fib-55': '55',
        'fib-89': '89',
        'fib-144': '144',
      },

      // ─── Aspect Ratio (Golden) ─────────────────────────────────────────────
      aspectRatio: {
        'phi': '1.618 / 1',
        'phi-inv': '1 / 1.618',
        'golden-rect': '1.618 / 1',
      },
    },
  },
  plugins: [],
};

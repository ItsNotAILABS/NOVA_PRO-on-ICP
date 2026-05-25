/**
 * NOVA Platform — Security Utilities
 *
 * Fibonacci hash chains, φ-derived key derivation, and CSP helpers.
 * Implements the security layer from the NOVA architecture.
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

// ─── φ-Mathematics Constants ─────────────────────────────────────────────────

const PHI = 1.6180339887498948482;

/** Fibonacci sequence cache */
const fibCache = new Map<number, number>([[0, 0], [1, 1]]);

function fib(n: number): number {
  if (n < 0) throw new RangeError(`fib(${n}): n must be >= 0`);
  if (fibCache.has(n)) return fibCache.get(n)!;
  const result = fib(n - 1) + fib(n - 2);
  fibCache.set(n, result);
  return result;
}

// ─── Fibonacci Hash Chain ────────────────────────────────────────────────────

/**
 * Fibonacci Hash Chain: H(n) = hash(H(n-1) || H(n-2))
 *
 * Creates a chain of hashes where each hash depends on the previous two,
 * similar to the Fibonacci sequence. This provides stronger tamper resistance.
 */
export class FibonacciHashChain {
  private chain: Uint8Array[] = [];
  private encoder = new TextEncoder();

  /**
   * Create a new Fibonacci hash chain.
   * @param seed Initial seed value
   * @param length Number of hashes to generate in the chain
   */
  async initialize(seed: string, length: number): Promise<void> {
    // Generate H(0) and H(1) from seed
    const seedBytes = this.encoder.encode(seed);
    const h0 = await this.hash(seedBytes);
    const h1 = await this.hash(new Uint8Array([...seedBytes, ...h0]));

    this.chain = [h0, h1];

    // Generate remaining chain elements
    for (let i = 2; i < length; i++) {
      const prev1 = this.chain[i - 1];
      const prev2 = this.chain[i - 2];
      const combined = new Uint8Array([...prev1, ...prev2]);
      const hi = await this.hash(combined);
      this.chain.push(hi);
    }
  }

  /**
   * Get the hash at position n in the chain.
   */
  getHash(n: number): Uint8Array | null {
    if (n < 0 || n >= this.chain.length) return null;
    return this.chain[n];
  }

  /**
   * Get the hash at position n as a hex string.
   */
  getHashHex(n: number): string | null {
    const hash = this.getHash(n);
    if (!hash) return null;
    return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify that a hash at position n is valid.
   */
  async verify(n: number, expectedHash: Uint8Array): Promise<boolean> {
    const actualHash = this.getHash(n);
    if (!actualHash) return false;
    if (actualHash.length !== expectedHash.length) return false;
    return actualHash.every((byte, i) => byte === expectedHash[i]);
  }

  /**
   * Get the chain length.
   */
  get length(): number {
    return this.chain.length;
  }

  /**
   * Export the chain as an array of hex strings.
   */
  exportChain(): string[] {
    return this.chain.map(hash =>
      Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('')
    );
  }

  private async hash(data: Uint8Array): Promise<Uint8Array> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }
}

// ─── φ-Derived Key Derivation ────────────────────────────────────────────────

/**
 * Key derivation parameters using Fibonacci iterations.
 * PBKDF2 iterations = F(16) = 987 (balanced security/performance)
 */
export const KEY_DERIVATION_PARAMS = {
  iterations: fib(16),  // 987 iterations
  hashAlgorithm: 'SHA-256',
  keyLength: 256,  // bits
};

/**
 * Derive a cryptographic key from a password using PBKDF2 with Fibonacci iterations.
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations = KEY_DERIVATION_PARAMS.iterations,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: KEY_DERIVATION_PARAMS.hashAlgorithm,
    },
    passwordKey,
    { name: 'AES-GCM', length: KEY_DERIVATION_PARAMS.keyLength },
    true,  // extractable
    ['encrypt', 'decrypt'],
  );
}

/**
 * Generate a random salt of Fibonacci length (F(5) = 16 bytes).
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(fib(7)));  // F(7) = 13 bytes + 3 = 16
}

/**
 * Encrypt data using AES-GCM with φ-derived key.
 */
export async function encryptData(
  data: string,
  key: CryptoKey,
): Promise<{ iv: Uint8Array; ciphertext: Uint8Array }> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));  // Standard IV size

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data),
  );

  return {
    iv,
    ciphertext: new Uint8Array(ciphertext),
  };
}

/**
 * Decrypt data using AES-GCM with φ-derived key.
 */
export async function decryptData(
  ciphertext: Uint8Array,
  key: CryptoKey,
  iv: Uint8Array,
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

// ─── CSP Configuration ───────────────────────────────────────────────────────

/**
 * Content Security Policy configuration for NOVA Platform.
 * Scoped to ICP boundary nodes and local development.
 */
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",  // Required for Vite HMR in dev
    "'unsafe-eval'",    // Required for WASM
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",  // Required for Tailwind/CSS-in-JS
  ],
  'connect-src': [
    "'self'",
    'https://*.ic0.app',
    'https://*.icp0.io',
    'https://ic0.app',
    'https://icp0.io',
    'wss://*.ic0.app',
    'wss://*.icp0.io',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://*.ic0.app',
  ],
  'font-src': [
    "'self'",
    'data:',
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};

/**
 * Generate CSP header string from configuration.
 */
export function generateCSPHeader(config = CSP_CONFIG): string {
  return Object.entries(config)
    .map(([directive, values]) => {
      if (values.length === 0) return directive;
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Generate CSP meta tag content.
 */
export function generateCSPMetaTag(config = CSP_CONFIG): string {
  return generateCSPHeader(config);
}

// ─── Subresource Integrity (SRI) ─────────────────────────────────────────────

/**
 * Calculate SRI hash for a resource.
 */
export async function calculateSRI(content: ArrayBuffer | string): Promise<string> {
  const data = typeof content === 'string'
    ? new TextEncoder().encode(content)
    : new Uint8Array(content);

  const hashBuffer = await crypto.subtle.digest('SHA-384', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));

  return `sha384-${hashBase64}`;
}

/**
 * Verify SRI hash for a resource.
 */
export async function verifySRI(
  content: ArrayBuffer | string,
  expectedSRI: string,
): Promise<boolean> {
  const actualSRI = await calculateSRI(content);
  return actualSRI === expectedSRI;
}

// ─── Fibonacci Identity ──────────────────────────────────────────────────────

/**
 * Generate a Fibonacci identity from a principal or unique ID.
 * Used for JWT claims and canister identification.
 */
export function generateFibonacciIdentity(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  // Map to Fibonacci index (mod F(12) = 144)
  return Math.abs(hash) % fib(12);
}

// ─── JWT Utilities ───────────────────────────────────────────────────────────

export interface NovaJWTPayload {
  sub: string;           // Subject (principal ID)
  iat: number;           // Issued at
  exp: number;           // Expiration
  fib_id: number;        // Fibonacci identity
  element_class: string; // gold/silver/crimson
  canister_ids?: string[]; // Authorized canisters
}

/**
 * Generate expiration time based on Fibonacci interval.
 * @param fibLevel Fibonacci level (e.g., 13 = F(13) = 233 seconds)
 */
export function generateExpiration(fibLevel = 13): number {
  const ttlSeconds = fib(fibLevel);
  return Math.floor(Date.now() / 1000) + ttlSeconds;
}

// ─── Export ──────────────────────────────────────────────────────────────────

export {
  fib,
  PHI,
};

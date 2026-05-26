/**
 * NOVA Platform — Service Worker with φ-Caching
 *
 * Implements Fibonacci TTL caching, φ-interval cache invalidation,
 * and offline canister state persistence.
 *
 * Cache Strategy:
 *   - Canister queries: Fibonacci TTL (5, 8, 13, 21 seconds)
 *   - Static assets: Cache-first with φ-interval revalidation
 *   - API responses: Stale-while-revalidate with Fibonacci timeouts
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

// ─── φ-Mathematics Constants ─────────────────────────────────────────────────

const PHI = 1.6180339887498948482;
const PHI_INV = 0.6180339887498948;

/** Fibonacci sequence for TTL values (seconds) */
const FIB_TTL = {
  F5: 5,
  F8: 8,
  F13: 13,
  F21: 21,
  F34: 34,
  F55: 55,
  F89: 89,
  F144: 144,
};

/** φ-interval in milliseconds */
const PHI_MS = Math.round(PHI * 1000);  // 1618ms

// ─── Cache Names ─────────────────────────────────────────────────────────────

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAMES = {
  STATIC: `nova-static-${CACHE_VERSION}`,
  CANISTER: `nova-canister-${CACHE_VERSION}`,
  API: `nova-api-${CACHE_VERSION}`,
  WASM: `nova-wasm-${CACHE_VERSION}`,
};

// ─── URL Patterns ────────────────────────────────────────────────────────────

const STATIC_PATTERNS = [
  /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/,
  /\/assets\//,
];

const CANISTER_PATTERNS = [
  /ic0\.app/,
  /icp0\.io/,
  /raw\.ic0\.app/,
  /\/api\/v2\/canister/,
];

const API_PATTERNS = [
  /\/api\//,
  /\.json$/,
];

// ─── Cache TTL Metadata ──────────────────────────────────────────────────────

/**
 * Stores TTL metadata for cached responses.
 * Key: request URL
 * Value: { cachedAt: timestamp, ttlMs: milliseconds, fibLevel: number }
 */
const ttlMetadata = new Map();

/**
 * Calculate Fibonacci-based TTL for a URL.
 * Higher-priority endpoints get shorter TTL (fresher data).
 */
function calculateTTL(url) {
  const urlStr = url.toString();

  // Canister status endpoints: F(5) = 5 seconds (fast refresh)
  if (urlStr.includes('/status') || urlStr.includes('/health')) {
    return { ttlMs: FIB_TTL.F5 * 1000, fibLevel: 5 };
  }

  // Canister query endpoints: F(8) = 8 seconds (standard refresh)
  if (urlStr.includes('/query') || CANISTER_PATTERNS.some(p => p.test(urlStr))) {
    return { ttlMs: FIB_TTL.F8 * 1000, fibLevel: 8 };
  }

  // API data endpoints: F(13) = 13 seconds (slow refresh)
  if (API_PATTERNS.some(p => p.test(urlStr))) {
    return { ttlMs: FIB_TTL.F13 * 1000, fibLevel: 13 };
  }

  // Static assets: F(89) = 89 seconds (near-static)
  if (STATIC_PATTERNS.some(p => p.test(urlStr))) {
    return { ttlMs: FIB_TTL.F89 * 1000, fibLevel: 89 };
  }

  // Default: F(21) = 21 seconds
  return { ttlMs: FIB_TTL.F21 * 1000, fibLevel: 21 };
}

/**
 * Check if a cached response is still valid based on Fibonacci TTL.
 */
function isCacheValid(url) {
  const metadata = ttlMetadata.get(url.toString());
  if (!metadata) return false;

  const elapsed = Date.now() - metadata.cachedAt;
  return elapsed < metadata.ttlMs;
}

/**
 * Store TTL metadata for a cached response.
 */
function storeTTLMetadata(url) {
  const { ttlMs, fibLevel } = calculateTTL(url);
  ttlMetadata.set(url.toString(), {
    cachedAt: Date.now(),
    ttlMs,
    fibLevel,
  });
}

// ─── Service Worker Installation ─────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('[NOVA SW] Installing with φ-caching strategy');

  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAMES.STATIC),
      caches.open(CACHE_NAMES.CANISTER),
      caches.open(CACHE_NAMES.API),
      caches.open(CACHE_NAMES.WASM),
    ]).then(() => {
      console.log('[NOVA SW] Caches initialized');
      return self.skipWaiting();
    })
  );
});

// ─── Service Worker Activation ───────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  console.log('[NOVA SW] Activating with cache cleanup');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !Object.values(CACHE_NAMES).includes(name))
          .map((name) => {
            console.log('[NOVA SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[NOVA SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// ─── Fetch Handler with φ-Strategy ───────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Determine caching strategy based on URL pattern
  if (CANISTER_PATTERNS.some(p => p.test(request.url))) {
    event.respondWith(canisterCacheStrategy(request));
  } else if (STATIC_PATTERNS.some(p => p.test(request.url))) {
    event.respondWith(staticCacheStrategy(request));
  } else if (API_PATTERNS.some(p => p.test(request.url))) {
    event.respondWith(apiCacheStrategy(request));
  } else {
    event.respondWith(networkFirstStrategy(request));
  }
});

// ─── Caching Strategies ──────────────────────────────────────────────────────

/**
 * Canister Cache Strategy: Stale-while-revalidate with Fibonacci TTL.
 * Returns cached response immediately if valid, fetches fresh data in background.
 */
async function canisterCacheStrategy(request) {
  const cache = await caches.open(CACHE_NAMES.CANISTER);
  const cachedResponse = await cache.match(request);

  // If cache is valid (within Fibonacci TTL), return it
  if (cachedResponse && isCacheValid(request.url)) {
    // Background revalidation after φ-interval
    setTimeout(() => {
      revalidateCache(request, CACHE_NAMES.CANISTER);
    }, PHI_MS);

    return cachedResponse;
  }

  // Cache miss or expired: fetch from network
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const clonedResponse = networkResponse.clone();
      cache.put(request, clonedResponse);
      storeTTLMetadata(request.url);
    }

    return networkResponse;
  } catch (error) {
    // Network error: return stale cache if available
    if (cachedResponse) {
      console.log('[NOVA SW] Network error, serving stale cache');
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Static Cache Strategy: Cache-first with long TTL.
 * Ideal for assets that rarely change.
 */
async function staticCacheStrategy(request) {
  const cache = await caches.open(CACHE_NAMES.STATIC);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Background revalidation for static assets (very infrequent)
    if (!isCacheValid(request.url)) {
      revalidateCache(request, CACHE_NAMES.STATIC);
    }
    return cachedResponse;
  }

  // Cache miss: fetch and cache
  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    const clonedResponse = networkResponse.clone();
    cache.put(request, clonedResponse);
    storeTTLMetadata(request.url);
  }

  return networkResponse;
}

/**
 * API Cache Strategy: Network-first with Fibonacci fallback.
 * Prioritizes fresh data, falls back to cache on network failure.
 */
async function apiCacheStrategy(request) {
  const cache = await caches.open(CACHE_NAMES.API);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const clonedResponse = networkResponse.clone();
      cache.put(request, clonedResponse);
      storeTTLMetadata(request.url);
    }

    return networkResponse;
  } catch (error) {
    // Network error: try cache
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[NOVA SW] API network error, serving cached response');
      return cachedResponse;
    }

    throw error;
  }
}

/**
 * Network-First Strategy: Default for unmatched requests.
 */
async function networkFirstStrategy(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Try any cache as fallback
    for (const cacheName of Object.values(CACHE_NAMES)) {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    throw error;
  }
}

/**
 * Background cache revalidation.
 */
async function revalidateCache(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      storeTTLMetadata(request.url);
      console.log('[NOVA SW] Revalidated cache for:', request.url);
    }
  } catch (error) {
    console.log('[NOVA SW] Revalidation failed:', error.message);
  }
}

// ─── Message Handler ─────────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'CACHE_INVALIDATE':
      // Invalidate specific cache entries
      if (payload?.urls) {
        payload.urls.forEach((url) => {
          ttlMetadata.delete(url);
        });
        console.log('[NOVA SW] Invalidated cache for:', payload.urls);
      }
      break;

    case 'CACHE_CLEAR_ALL':
      // Clear all caches
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
      ttlMetadata.clear();
      console.log('[NOVA SW] Cleared all caches');
      break;

    case 'GET_CACHE_STATS':
      // Return cache statistics
      getCacheStats().then((stats) => {
        event.ports[0]?.postMessage(stats);
      });
      break;

    default:
      console.log('[NOVA SW] Unknown message type:', type);
  }
});

/**
 * Get cache statistics for monitoring.
 */
async function getCacheStats() {
  const stats = {};

  for (const [name, cacheName] of Object.entries(CACHE_NAMES)) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[name] = {
      entries: keys.length,
      urls: keys.slice(0, 10).map((r) => r.url),  // Sample URLs
    };
  }

  return {
    caches: stats,
    ttlEntries: ttlMetadata.size,
    fibLevels: Array.from(ttlMetadata.values()).reduce((acc, m) => {
      acc[m.fibLevel] = (acc[m.fibLevel] || 0) + 1;
      return acc;
    }, {}),
  };
}

console.log('[NOVA SW] Service Worker loaded with φ-mathematics caching');

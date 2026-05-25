/**
 * NOVA Platform — Service Worker Registration
 *
 * Registers the φ-caching service worker and provides
 * utilities for cache management.
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

// ─── φ-Mathematics Constants ─────────────────────────────────────────────────

const PHI = 1.6180339887498948482;
const PHI_MS = Math.round(PHI * 1000);  // 1618ms

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CacheStats {
  caches: Record<string, {
    entries: number;
    urls: string[];
  }>;
  ttlEntries: number;
  fibLevels: Record<number, number>;
}

export interface ServiceWorkerController {
  registration: ServiceWorkerRegistration | null;
  isReady: boolean;
  invalidateCache: (urls: string[]) => void;
  clearAllCaches: () => void;
  getCacheStats: () => Promise<CacheStats | null>;
}

// ─── Service Worker Controller ───────────────────────────────────────────────

let swRegistration: ServiceWorkerRegistration | null = null;
let isReady = false;

/**
 * Register the service worker with φ-interval retry.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[NOVA] Service Workers not supported');
    return null;
  }

  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    console.log('[NOVA] Service Worker registered:', swRegistration.scope);

    // Listen for updates
    swRegistration.addEventListener('updatefound', () => {
      const newWorker = swRegistration?.installing;
      if (newWorker) {
        console.log('[NOVA] New Service Worker installing');
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[NOVA] New Service Worker available, refresh for update');
            // Optionally dispatch event for UI notification
            window.dispatchEvent(new CustomEvent('nova-sw-update', {
              detail: { registration: swRegistration },
            }));
          }
        });
      }
    });

    // Wait for ready state
    await navigator.serviceWorker.ready;
    isReady = true;
    console.log('[NOVA] Service Worker ready');

    return swRegistration;
  } catch (error) {
    console.error('[NOVA] Service Worker registration failed:', error);

    // φ-interval retry
    setTimeout(() => {
      console.log('[NOVA] Retrying Service Worker registration');
      registerServiceWorker();
    }, PHI_MS);

    return null;
  }
}

/**
 * Send message to Service Worker.
 */
function sendMessage(type: string, payload?: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('No Service Worker controller'));
      return;
    }

    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => resolve(event.data);

    navigator.serviceWorker.controller.postMessage(
      { type, payload },
      [channel.port2]
    );

    // Timeout after F(8) = 8 seconds
    setTimeout(() => reject(new Error('Message timeout')), 8000);
  });
}

/**
 * Invalidate specific cache entries.
 */
export function invalidateCache(urls: string[]): void {
  if (!navigator.serviceWorker.controller) {
    console.warn('[NOVA] No Service Worker to invalidate');
    return;
  }

  navigator.serviceWorker.controller.postMessage({
    type: 'CACHE_INVALIDATE',
    payload: { urls },
  });
}

/**
 * Clear all caches.
 */
export function clearAllCaches(): void {
  if (!navigator.serviceWorker.controller) {
    console.warn('[NOVA] No Service Worker to clear caches');
    return;
  }

  navigator.serviceWorker.controller.postMessage({
    type: 'CACHE_CLEAR_ALL',
  });
}

/**
 * Get cache statistics.
 */
export async function getCacheStats(): Promise<CacheStats | null> {
  try {
    const stats = await sendMessage('GET_CACHE_STATS');
    return stats as CacheStats;
  } catch (error) {
    console.error('[NOVA] Failed to get cache stats:', error);
    return null;
  }
}

/**
 * Get the Service Worker controller instance.
 */
export function getServiceWorkerController(): ServiceWorkerController {
  return {
    registration: swRegistration,
    isReady,
    invalidateCache,
    clearAllCaches,
    getCacheStats,
  };
}

// ─── Auto-register on module load ────────────────────────────────────────────

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Only auto-register in production
  registerServiceWorker();
}

export default registerServiceWorker;

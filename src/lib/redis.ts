/**
 * In-memory cache that replaces Redis for local development.
 * Provides the same get/set/del interface so the rest of the code works unchanged.
 * Data lives only as long as the server process is running.
 */

interface CacheEntry {
  value: string;
  expiresAt: number | null;
}

class MemoryCache {
  private store = new Map<string, CacheEntry>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ...args: unknown[]): Promise<void> {
    let expiresAt: number | null = null;

    // Support Redis-style: set(key, value, 'EX', seconds)
    if (args.length >= 2 && args[0] === 'EX' && typeof args[1] === 'number') {
      expiresAt = Date.now() + args[1] * 1000;
    }

    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

const globalForCache = globalThis as unknown as { redis: MemoryCache };

export const redis = globalForCache.redis ?? new MemoryCache();

if (process.env.NODE_ENV !== 'production') globalForCache.redis = redis;

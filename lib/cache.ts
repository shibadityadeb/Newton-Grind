interface CacheEntry<T> {
  value: T;
  expires: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set<T>(key: string, value: T, ttlSeconds: number) {
    this.store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
  }
}

const cache = new MemoryCache();
export default cache;

type CacheValue<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheValue<any>>();

export function getCache<T>(key: string): T | null {
  const now = Date.now();
  const item = store.get(key);
  if (!item) return null;
  if (item.expiresAt < now) {
    store.delete(key);
    return null;
  }
  return item.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs = 5 * 60 * 1000) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function clearCache(key?: string) {
  if (key) {
    store.delete(key);
    return;
  }
  store.clear();
}

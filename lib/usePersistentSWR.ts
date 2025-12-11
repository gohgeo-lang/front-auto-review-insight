import { useEffect, useState } from "react";
import useSWR, { SWRConfiguration, SWRResponse } from "swr";

type Options<D, E> = SWRConfiguration<D, E> & {
  storageKey?: string;
  ttlMs?: number;
};

type Stored<D> = {
  value: D;
  expiresAt?: number;
};

export function usePersistentSWR<D = any, E = any>(
  key: string | null,
  fetcher: (...args: any[]) => Promise<D>,
  options?: Options<D, E>
): SWRResponse<D, E> {
  const storageKey = options?.storageKey || (key ? `cache:${key}` : undefined);
  const ttlMs = options?.ttlMs;
  const [fallback, setFallback] = useState<D | undefined>(undefined);

  useEffect(() => {
    if (!storageKey || !key) return;
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed: Stored<D> = JSON.parse(raw);
      if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
        localStorage.removeItem(storageKey);
        return;
      }
      setFallback(parsed.value);
    } catch {
      // ignore parse errors
    }
  }, [storageKey, key]);

  const swr = useSWR<D, E>(key, fetcher, {
    ...options,
    fallbackData: fallback ?? options?.fallbackData,
  });

  useEffect(() => {
    if (!storageKey || !key) return;
    if (typeof window === "undefined") return;
    if (swr.data === undefined) return;
    try {
      const payload: Stored<D> = {
        value: swr.data,
        expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [storageKey, key, swr.data, ttlMs]);

  return swr;
}

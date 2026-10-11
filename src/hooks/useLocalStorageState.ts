import { useEffect, useState } from 'react';

/**
 * useState that survives reloads. `isValid` guards against stale/corrupt values
 * (e.g. an option that no longer exists) and falls back to `initial`.
 */
export function useLocalStorageState<T>(
  key: string,
  initial: T,
  isValid?: (value: unknown) => boolean
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (!isValid || isValid(parsed)) return parsed as T;
      }
    } catch {
      // ignore unreadable storage
    }
    return initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or blocked — preference just won't persist
    }
  }, [key, value]);

  return [value, setValue] as const;
}

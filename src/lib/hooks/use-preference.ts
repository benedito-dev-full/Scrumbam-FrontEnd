"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Persiste uma preferencia no localStorage.
 * Sync cross-device fica como gap #21 (precisa endpoint /me/preferences).
 */
export function usePreference<T>(
  key: string,
  defaultValue: T,
): [T, (next: T) => void] {
  const storageKey = `scrumban.pref.${key}`;
  const [value, setValue] = useState<T>(defaultValue);

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    [storageKey],
  );

  return [value, update];
}

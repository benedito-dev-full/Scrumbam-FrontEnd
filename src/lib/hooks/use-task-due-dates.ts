"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "scrumban.taskDueDates.v1";

type DueDatesMap = Record<string, string>;

function readStorage(): DueDatesMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorage(map: DueDatesMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent("scrumban:taskDueDates:change"));
  } catch {
    // ignora quota/parse error
  }
}

/**
 * Hook local para guardar "data de vencimento" das tasks.
 *
 * STATE-ONLY (localStorage). O backend V2 ainda nao expoe um campo
 * `dueDate` em DTask — quando expuser, este hook pode ser substituido
 * sem alterar os call sites. Util como placeholder visual / UX para
 * a list view estilo ClickUp.
 */
export function useTaskDueDate(taskId: string): {
  dueDate: string | null;
  setDueDate: (value: string | null) => void;
} {
  const [map, setMap] = useState<DueDatesMap>(() => readStorage());

  useEffect(() => {
    const handler = () => setMap(readStorage());
    window.addEventListener("scrumban:taskDueDates:change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("scrumban:taskDueDates:change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const setDueDate = useCallback(
    (value: string | null) => {
      const next = { ...readStorage() };
      if (value) next[taskId] = value;
      else delete next[taskId];
      writeStorage(next);
      setMap(next);
    },
    [taskId],
  );

  return { dueDate: map[taskId] ?? null, setDueDate };
}

"use client";

/**
 * Hook de preferencia de visao por projeto (Issues tab).
 *
 * Persiste a visao escolhida (cards/kanban/tree/list) em localStorage
 * com chave `phaseView:${projectId}` — cada projeto lembra a propria
 * preferencia entre sessoes.
 *
 * Migration-safe: valores invalidos no storage (ex: visao removida no
 * futuro) retornam ao default 'cards'.
 */

import { useCallback, useEffect, useState } from "react";

export type PhaseView = "cards" | "kanban" | "tree" | "list";

const VALID_VIEWS: readonly PhaseView[] = [
  "cards",
  "kanban",
  "tree",
  "list",
] as const;

const DEFAULT_VIEW: PhaseView = "cards";

function storageKey(projectId: string): string {
  return `phaseView:${projectId}`;
}

function readStorage(projectId: string): PhaseView {
  if (typeof window === "undefined") return DEFAULT_VIEW;
  try {
    const raw = window.localStorage.getItem(storageKey(projectId));
    if (raw && (VALID_VIEWS as readonly string[]).includes(raw)) {
      return raw as PhaseView;
    }
  } catch {
    // localStorage indisponivel (modo privado, quota cheia etc) — fallback silencioso
  }
  return DEFAULT_VIEW;
}

function writeStorage(projectId: string, view: PhaseView): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(projectId), view);
  } catch {
    // ignore
  }
}

export function useProjectViewPreference(projectId: string | undefined): {
  view: PhaseView;
  setView: (v: PhaseView) => void;
} {
  // SSR-safe: inicializa com default, sincroniza com localStorage no mount.
  // Evita hydration mismatch (server renderiza default; cliente atualiza).
  const [view, setViewState] = useState<PhaseView>(DEFAULT_VIEW);

  useEffect(() => {
    if (!projectId) return;
    setViewState(readStorage(projectId));
  }, [projectId]);

  const setView = useCallback(
    (next: PhaseView) => {
      setViewState(next);
      if (projectId) writeStorage(projectId, next);
    },
    [projectId],
  );

  return { view, setView };
}

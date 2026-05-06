"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Views locais persistidas em localStorage como workaround do gap #2 (sem DView).
 * Quando backend implementar /views, esse hook vira no-op + migracao.
 */

export type LocalViewType = "issues" | "projects";
export type LocalViewScope = "personal" | "workspace";

export interface LocalView {
  id: string;
  type: LocalViewType;
  scope: LocalViewScope;
  name: string;
  description: string;
  ownerName: string;
  createdAt: string;
  /** Filtros estruturados — futuro DView.filters Json */
  filters?: Record<string, unknown>;
}

const STORAGE_KEY = "scrumban.views.local.v1";

function readAll(): LocalView[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalView[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: LocalView[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

/** Lista views locais (opcionalmente filtradas por type). */
export function useLocalViews(type?: LocalViewType) {
  const [views, setViews] = useState<LocalView[]>([]);

  useEffect(() => {
    setViews(readAll());

    // Sincroniza entre tabs (event localStorage do navegador)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setViews(readAll());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const filtered = type ? views.filter((v) => v.type === type) : views;

  const addView = useCallback((view: Omit<LocalView, "id" | "createdAt">) => {
    const all = readAll();
    const newView: LocalView = {
      ...view,
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    const next = [...all, newView];
    writeAll(next);
    setViews(next);
    return newView;
  }, []);

  const removeView = useCallback((id: string) => {
    const all = readAll();
    const next = all.filter((v) => v.id !== id);
    writeAll(next);
    setViews(next);
  }, []);

  return { views: filtered, addView, removeView };
}

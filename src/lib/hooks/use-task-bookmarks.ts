"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "scrumban.bookmarks.v1";

export type BookmarkKind = "project" | "task";

export interface Bookmark {
  id: string; // entityId (project chave ou task id)
  kind: BookmarkKind;
  label: string; // nome exibido (cache local — pode ficar stale)
  href: string; // rota para navegar
  addedAt: number; // epoch ms
}

function readStorage(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(items: Bookmark[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("scrumban:bookmarks:change"));
  } catch {
    /* ignora quota */
  }
}

/**
 * Hook de favoritos/bookmarks (state-only, localStorage).
 *
 * Backend V2 ainda nao expoe endpoint de "favorites por usuario"; quando
 * expuser, este hook pode ser substituido sem alterar call sites.
 *
 * Ordenacao: mais recentes primeiro.
 */
export function useBookmarks(): {
  bookmarks: Bookmark[];
  isBookmarked: (id: string) => boolean;
  add: (b: Omit<Bookmark, "addedAt">) => void;
  remove: (id: string) => void;
  toggle: (b: Omit<Bookmark, "addedAt">) => void;
} {
  const [items, setItems] = useState<Bookmark[]>(() => readStorage());

  useEffect(() => {
    const handler = () => setItems(readStorage());
    window.addEventListener("scrumban:bookmarks:change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("scrumban:bookmarks:change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const add = useCallback((b: Omit<Bookmark, "addedAt">) => {
    const next = readStorage().filter((x) => x.id !== b.id);
    next.unshift({ ...b, addedAt: Date.now() });
    writeStorage(next);
    setItems(next);
  }, []);

  const remove = useCallback((id: string) => {
    const next = readStorage().filter((x) => x.id !== id);
    writeStorage(next);
    setItems(next);
  }, []);

  const isBookmarked = useCallback(
    (id: string) => items.some((x) => x.id === id),
    [items],
  );

  const toggle = useCallback(
    (b: Omit<Bookmark, "addedAt">) => {
      if (isBookmarked(b.id)) remove(b.id);
      else add(b);
    },
    [isBookmarked, remove, add],
  );

  const sorted = [...items].sort((a, b) => b.addedAt - a.addedAt);
  return { bookmarks: sorted, isBookmarked, add, remove, toggle };
}

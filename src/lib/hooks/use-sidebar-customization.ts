"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Visibility states inspired by Linear:
 * - always: item sempre visivel
 * - showWhenBadged: aparece somente quando tem contagem (badge)
 * - hide: escondido (acessivel via More)
 */
export type ItemVisibility = "always" | "showWhenBadged" | "hide";

export type BadgeStyle = "count" | "dot" | "none";

/** Chaves dos items que aparecem na sidebar e podem ser customizados */
export type SidebarItemKey =
  | "inbox"
  | "myIssues"
  | "drafts"
  | "projects"
  | "views"
  | "members"
  | "teams";

export interface SidebarCustomization {
  badgeStyle: BadgeStyle;
  visibility: Record<SidebarItemKey, ItemVisibility>;
}

const STORAGE_KEY = "scrumban.sidebar.customize.v1";

const DEFAULTS: SidebarCustomization = {
  badgeStyle: "count",
  visibility: {
    inbox: "always",
    myIssues: "always",
    drafts: "showWhenBadged",
    projects: "always",
    views: "always",
    members: "hide",
    teams: "hide",
  },
};

export function useSidebarCustomization(): {
  state: SidebarCustomization;
  setBadgeStyle: (s: BadgeStyle) => void;
  setVisibility: (key: SidebarItemKey, v: ItemVisibility) => void;
  reset: () => void;
} {
  const [state, setState] = useState<SidebarCustomization>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SidebarCustomization>;
        setState({
          badgeStyle: parsed.badgeStyle ?? DEFAULTS.badgeStyle,
          visibility: { ...DEFAULTS.visibility, ...(parsed.visibility ?? {}) },
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((next: SidebarCustomization) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const setBadgeStyle = useCallback(
    (s: BadgeStyle) => {
      persist({ ...state, badgeStyle: s });
    },
    [state, persist],
  );

  const setVisibility = useCallback(
    (key: SidebarItemKey, v: ItemVisibility) => {
      persist({
        ...state,
        visibility: { ...state.visibility, [key]: v },
      });
    },
    [state, persist],
  );

  const reset = useCallback(() => {
    persist(DEFAULTS);
  }, [persist]);

  return { state, setBadgeStyle, setVisibility, reset };
}

/**
 * Helper para decidir se um item deve renderizar.
 * @param visibility configuracao do item
 * @param badge valor atual do badge (undefined = sem badge)
 */
export function shouldShowSidebarItem(
  visibility: ItemVisibility,
  badge?: number,
): boolean {
  if (visibility === "hide") return false;
  if (visibility === "showWhenBadged") return (badge ?? 0) > 0;
  return true; // always
}

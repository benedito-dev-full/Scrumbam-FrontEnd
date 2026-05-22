"use client";

/**
 * ViewToggle — seletor segmentado de visao da aba Issues.
 *
 * Padrao "pill segmented" (estilo iOS/Linear): pilulas conectadas onde
 * a visao ativa tem destaque visual forte. Visoes nao implementadas
 * sao renderizadas como `disabled` com tooltip "Em breve".
 */

import { Kanban, LayoutGrid, List, ListTree } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PhaseView } from "@/lib/hooks/use-project-view-preference";

interface ViewOption {
  key: PhaseView;
  label: string;
  icon: typeof LayoutGrid;
  /** Quando false, item aparece disabled com tooltip. */
  enabled: boolean;
}

const OPTIONS: ViewOption[] = [
  { key: "cards", label: "Cards", icon: LayoutGrid, enabled: true },
  { key: "kanban", label: "Kanban", icon: Kanban, enabled: false },
  { key: "tree", label: "Hierarquia", icon: ListTree, enabled: false },
  { key: "list", label: "Lista", icon: List, enabled: false },
];

interface ViewToggleProps {
  value: PhaseView;
  onChange: (v: PhaseView) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Visao da aba Issues"
      className="inline-flex items-center gap-0.5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-0.5"
    >
      {OPTIONS.map((opt) => {
        const isActive = value === opt.key;
        const Icon = opt.icon;
        const disabled = !opt.enabled;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-disabled={disabled}
            disabled={disabled}
            title={disabled ? `${opt.label} — em breve` : opt.label}
            onClick={() => !disabled && onChange(opt.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
              isActive &&
                "bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/30",
              !isActive &&
                !disabled &&
                "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
              disabled &&
                "cursor-not-allowed text-zinc-600 opacity-60 hover:bg-transparent",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
            {disabled && (
              <span className="ml-0.5 rounded-sm bg-zinc-800 px-1 py-0 text-[9px] font-semibold uppercase text-zinc-500">
                soon
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

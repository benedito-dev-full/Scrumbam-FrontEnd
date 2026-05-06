"use client";

import { useMemo } from "react";
import {
  CircleDashed,
  Circle,
  CircleDotDashed,
  CheckCircle2,
  XCircle,
  Plus,
  Info,
} from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useProjects } from "@/lib/hooks/use-projects";
import { cn } from "@/lib/utils";

// ============================================================
// Linear's 5 fixed categories — schema only has DProject.status string
// (gap #37). We map our 3 values (active/archived/completed) into 3 of
// the 5 buckets and show all 5 read-only as visual reference.
// ============================================================

interface StatusEntry {
  /** Nome exibido (ex.: "In Progress") */
  name: string;
  /** Ícone do status */
  icon: React.ComponentType<{ className?: string }>;
  /** Classe de cor pro ícone */
  iconClass: string;
  /** Valor real em DProject.status (se mapeado); null = bucket vazio */
  schemaValue: string | null;
}

interface CategoryDef {
  key: string;
  label: string;
  description: string;
  statuses: StatusEntry[];
}

const CATEGORIES: CategoryDef[] = [
  {
    key: "backlog",
    label: "Backlog",
    description: "Ideias e propostas ainda nao planejadas",
    statuses: [
      {
        name: "Backlog",
        icon: CircleDashed,
        iconClass: "text-amber-500",
        schemaValue: null,
      },
    ],
  },
  {
    key: "planned",
    label: "Planejado",
    description: "Aprovado, agendado para iniciar",
    statuses: [
      {
        name: "Planejado",
        icon: Circle,
        iconClass: "text-zinc-400",
        schemaValue: null,
      },
    ],
  },
  {
    key: "in-progress",
    label: "Em andamento",
    description: "Em execucao",
    statuses: [
      {
        name: "Em andamento",
        icon: CircleDotDashed,
        iconClass: "text-amber-400",
        schemaValue: "active",
      },
    ],
  },
  {
    key: "completed",
    label: "Concluido",
    description: "Concluido com sucesso",
    statuses: [
      {
        name: "Concluido",
        icon: CheckCircle2,
        iconClass: "text-violet-500",
        schemaValue: "completed",
      },
    ],
  },
  {
    key: "canceled",
    label: "Cancelado",
    description: "Arquivado / cancelado",
    statuses: [
      {
        name: "Cancelado",
        icon: XCircle,
        iconClass: "text-zinc-500",
        schemaValue: "archived",
      },
    ],
  },
];

export default function ProjectStatusesPage() {
  usePageTitle("Status de projeto");
  const { data: projects } = useProjects();

  // Count projects per status string
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    (projects ?? []).forEach((p) => {
      const s = (p as { status?: string | null }).status ?? "active";
      map.set(s, (map.get(s) ?? 0) + 1);
    });
    return map;
  }, [projects]);

  return (
    <PageTransition>
      <div className="px-8 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Status de projeto
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Status de projeto definem o workflow pelo qual os projetos passam
              do inicio a conclusao.
            </p>
          </div>

          {/* Gap notice */}
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200 dark:text-amber-300">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>
              Gap #37 — schema atual usa{" "}
              <code className="rounded bg-black/30 px-1">DProject.status</code>{" "}
              como string livre (active/archived/completed). As 5 categorias
              abaixo sao Linear-style read-only; customizar status de projeto
              e adicionar novos exige migration.
            </p>
          </div>

          {/* Categories list */}
          <div className="space-y-2">
            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.key} category={cat} counts={counts} />
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// ============================================================
// Category card
// ============================================================

function CategoryCard({
  category: cat,
  counts,
}: {
  category: CategoryDef;
  counts: Map<string, number>;
}) {
  return (
    <div className="overflow-hidden">
      {/* Category header (Linear shows it as a row with + button) */}
      <button
        type="button"
        disabled
        title={`${cat.label} — adicionar novo status (gap #37)`}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md border border-border bg-card/40 px-4 py-2.5",
          "text-[13px] font-medium text-muted-foreground cursor-not-allowed",
        )}
      >
        <span>{cat.label}</span>
        <Plus className="h-3.5 w-3.5" />
      </button>

      {/* Status entries */}
      {cat.statuses.map((s) => (
        <StatusRow key={s.name} status={s} counts={counts} />
      ))}
    </div>
  );
}

function StatusRow({
  status: s,
  counts,
}: {
  status: StatusEntry;
  counts: Map<string, number>;
}) {
  const Icon = s.icon;
  const count = s.schemaValue ? (counts.get(s.schemaValue) ?? 0) : 0;
  const hasMapping = s.schemaValue !== null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 mt-1 rounded-md border border-border bg-card",
        !hasMapping && "opacity-60",
      )}
      title={
        hasMapping
          ? `Mapeado para DProject.status = "${s.schemaValue}"`
          : "Categoria vazia no schema atual"
      }
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className={cn("h-4 w-4", s.iconClass)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium">{s.name}</p>
        {hasMapping && (
          <p className="text-[11px] text-muted-foreground">
            {count} {count === 1 ? "projeto" : "projetos"}
          </p>
        )}
      </div>
    </div>
  );
}

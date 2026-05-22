"use client";

/**
 * PhaseCardsTab — visao macro do projeto em grid de cards.
 *
 * Versao V0.2 com dados MOCKADOS (src/lib/mocks/phase-cards-mock.ts).
 * Quando aprovado, trocar para hooks reais (usePhases + usePhaseMetrics).
 *
 * Mudancas v0.2:
 *   - Espacamento maior entre cards (gap-5), cards mais respiraveis (ring 72,
 *     descricao 1 linha) — menos densidade visual.
 *   - Dropdown de ordenacao (urgencia, deadline, %, prioridade, nome).
 *   - Drill-in real: clique no card substitui o grid por uma tela de detalhe
 *     com header, KPIs do bloco e lista de tasks agrupadas por status.
 */

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  CircleDot,
  Flag,
  Flame,
  Inbox,
  Layers,
  ListChecks,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueries } from "@tanstack/react-query";
import {
  aggregateKpis,
  type PhaseCardData,
  type PhasePriority,
  type PhaseStatus,
  type PhaseTaskMock,
  type TaskStatus,
} from "@/lib/mocks/phase-cards-mock";
import { phasesApi, type Phase } from "@/lib/api/phases";
import { buildPhaseCardData } from "@/lib/api/phase-card-adapter";
import {
  usePhases,
  usePhaseMetrics,
  usePhaseAllTasks,
} from "@/lib/hooks/use-phases";
import { useProjectViewPreference } from "@/lib/hooks/use-project-view-preference";
import { ViewToggle } from "@/components/projects/view-toggle";
import { QUERY_KEYS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatePhaseModal } from "@/components/projects/create-phase-modal";
import { DeletePhaseDialog } from "@/components/projects/delete-phase-dialog";

// ============================================================
// Helpers
// ============================================================

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ontem";
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function deadlineLabel(iso?: string): {
  text: string;
  tone: "ok" | "warn" | "late" | "muted";
} {
  if (!iso) return { text: "Sem prazo", tone: "muted" };
  const target = new Date(iso).getTime();
  const diff = target - Date.now();
  const days = Math.round(diff / (24 * 3600 * 1000));
  if (days < 0) return { text: `${Math.abs(days)}d atrasado`, tone: "late" };
  if (days === 0) return { text: "Hoje", tone: "warn" };
  if (days <= 3) return { text: `${days}d restantes`, tone: "warn" };
  if (days <= 14) return { text: `${days}d restantes`, tone: "ok" };
  return {
    text: new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    }),
    tone: "muted",
  };
}

// ============================================================
// StatusPill
// ============================================================

const STATUS_META: Record<
  PhaseStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  "on-track": {
    label: "No prazo",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  "at-risk": {
    label: "Em risco",
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
  blocked: {
    label: "Bloqueado",
    color: "text-rose-300",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    dot: "bg-rose-400 animate-pulse",
  },
  done: {
    label: "Concluido",
    color: "text-zinc-300",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/30",
    dot: "bg-zinc-400",
  },
};

function StatusPill({ status }: { status: PhaseStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wide",
        meta.color,
        meta.bg,
        meta.border,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

// ============================================================
// PriorityChip
// ============================================================

const PRIORITY_META: Record<
  PhasePriority,
  { label: string; color: string; bg: string }
> = {
  low: { label: "Baixa", color: "text-zinc-400", bg: "bg-zinc-500/10" },
  medium: { label: "Media", color: "text-sky-300", bg: "bg-sky-500/10" },
  high: { label: "Alta", color: "text-amber-300", bg: "bg-amber-500/10" },
  urgent: { label: "Urgente", color: "text-rose-300", bg: "bg-rose-500/10" },
};

function PriorityChip({
  priority,
  compact = false,
}: {
  priority: PhasePriority;
  compact?: boolean;
}) {
  const meta = PRIORITY_META[priority];
  if (compact) {
    return (
      <span
        title={`Prioridade: ${meta.label}`}
        className={cn(
          "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
          meta.color,
          meta.bg,
        )}
      >
        <Flame className="h-2.5 w-2.5" />
        {meta.label}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
        meta.color,
        meta.bg,
      )}
    >
      <Flag className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

// ============================================================
// ProgressRing
// ============================================================

function ProgressRing({
  percent,
  status,
  size = 72,
  stroke = 6,
  showLabel = true,
}: {
  percent: number;
  status: PhaseStatus;
  size?: number;
  stroke?: number;
  showLabel?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, percent));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (pct / 100) * circumference;
  const ringColor =
    status === "done"
      ? "stroke-emerald-400"
      : status === "blocked"
        ? "stroke-rose-400"
        : status === "at-risk"
          ? "stroke-amber-400"
          : "stroke-violet-400";

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Progresso ${pct}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-zinc-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          className={cn(ringColor, "transition-all duration-500 ease-out")}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[15px] font-semibold tabular-nums text-zinc-100">
            {pct}
            <span className="text-[10px] text-zinc-500">%</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// AvatarStack
// ============================================================

function AvatarStack({
  assignees,
  max = 3,
  size = 6,
}: {
  assignees: PhaseCardData["assignees"];
  max?: number;
  /** Tailwind h-*/
  size?: 5 | 6 | 7;
}) {
  const shown = assignees.slice(0, max);
  const overflow = assignees.length - shown.length;
  const sizeClass = size === 5 ? "h-5 w-5" : size === 7 ? "h-7 w-7" : "h-6 w-6";
  const fontClass = size === 5 ? "text-[9px]" : "text-[10px]";
  return (
    <div className="flex -space-x-1.5">
      {shown.map((a) => (
        <span
          key={a.id}
          title={a.name}
          className={cn(
            "flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-zinc-950",
            sizeClass,
            fontClass,
          )}
          style={{ backgroundColor: a.color }}
        >
          {a.initials}
        </span>
      ))}
      {overflow > 0 && (
        <span
          title={`+${overflow} responsaveis`}
          className={cn(
            "flex items-center justify-center rounded-full bg-zinc-800 font-medium text-zinc-300 ring-2 ring-zinc-950",
            sizeClass,
            fontClass,
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

// ============================================================
// MiniStats
// ============================================================

function MiniStats({ m }: { m: PhaseCardData["metrics"] }) {
  const items: Array<{
    icon: typeof CheckCircle2;
    value: number;
    color: string;
    title: string;
    spin?: boolean;
  }> = [
    {
      icon: CheckCircle2,
      value: m.done,
      color: "text-emerald-400",
      title: "Concluidas",
    },
    {
      icon: Loader2,
      value: m.executing,
      color: "text-amber-400",
      title: "Em execucao",
      spin: m.executing > 0,
    },
    {
      icon: XCircle,
      value: m.failed,
      color: "text-rose-400",
      title: "Falhas",
    },
    {
      icon: CircleDot,
      value: m.pending,
      color: "text-zinc-500",
      title: "Pendentes",
    },
  ];
  return (
    <div className="flex items-center gap-3 text-[11.5px] tabular-nums">
      {items.map((i, idx) => (
        <span
          key={idx}
          title={i.title}
          className={cn("inline-flex items-center gap-1", i.color)}
        >
          <i.icon className={cn("h-3 w-3", i.spin && "animate-spin")} />
          {i.value}
        </span>
      ))}
    </div>
  );
}

// ============================================================
// PhaseCard — cartao individual
// ============================================================

function PhaseCard({
  phase,
  onOpen,
  onDelete,
}: {
  phase: PhaseCardData;
  onOpen: (phase: PhaseCardData) => void;
  /** Quando omitido, o menu de acoes nao eh renderizado. */
  onDelete?: (phase: PhaseCardData) => void;
}) {
  const deadline = deadlineLabel(phase.deadline);
  const isAtRisk = phase.status === "at-risk" || phase.status === "blocked";

  // Refatorado de <button> para <div role="button">: evita HTML invalido
  // (button dentro de button) ao aninhar o DropdownMenuTrigger.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(phase);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(phase)}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-3 rounded-xl border bg-zinc-950/60 p-5 text-left",
        "transition-all duration-200",
        "hover:border-zinc-700 hover:bg-zinc-900/70 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
        isAtRisk ? "border-rose-500/20" : "border-zinc-800",
      )}
    >
      {/* Linha 1: status + sub-fases badge + menu acoes (hover) */}
      <div className="flex items-center justify-between gap-2">
        <StatusPill status={phase.status} />
        <div className="flex items-center gap-2">
          {phase.priority === "urgent" && (
            <PriorityChip priority={phase.priority} compact />
          )}
          {phase.subPhasesCount > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[10.5px] font-medium text-zinc-500"
              title={`${phase.subPhasesCount} sub-blocos`}
            >
              <Layers className="h-3 w-3" />
              {phase.subPhasesCount}
            </span>
          )}
          {onDelete && (
            <button
              type="button"
              aria-label={`Excluir bloco ${phase.name}`}
              title="Excluir bloco"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(phase);
              }}
              onKeyDown={(e) => e.stopPropagation()}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded text-zinc-500",
                "opacity-0 transition-all",
                "hover:bg-rose-500/10 hover:text-rose-400",
                "group-hover:opacity-100 focus-visible:opacity-100",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50",
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Linha 2: ring + nome/descricao */}
      <div className="flex items-start gap-4">
        <ProgressRing percent={phase.metrics.percent} status={phase.status} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="truncate text-[14px] font-semibold tracking-tight text-zinc-100">
            {phase.name}
          </h3>
          {phase.description && (
            <p className="line-clamp-1 text-[11.5px] leading-relaxed text-zinc-500">
              {phase.description}
            </p>
          )}
          <div className="pt-0.5">
            <MiniStats m={phase.metrics} />
          </div>
        </div>
      </div>

      {/* Linha 3: footer com assignees + deadline + chevron */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <AvatarStack assignees={phase.assignees} />
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] tabular-nums",
              deadline.tone === "late" && "text-rose-300",
              deadline.tone === "warn" && "text-amber-300",
              deadline.tone === "ok" && "text-zinc-400",
              deadline.tone === "muted" && "text-zinc-600",
            )}
          >
            <Calendar className="h-3 w-3" />
            {deadline.text}
          </span>
          <ChevronRight className="h-4 w-4 text-zinc-700 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-zinc-400" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// OrphanCard
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- mantido para quando backend expor count de tasks orfas
function OrphanCard({ count, onOpen }: { count: number; onOpen: () => void }) {
  if (count <= 0) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700/60 bg-zinc-950/40 p-5 text-center",
        "transition-all hover:border-zinc-600 hover:bg-zinc-900/40 hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
        "min-h-[240px]",
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-zinc-500 group-hover:text-zinc-300">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="text-[13px] font-medium text-zinc-300">Sem bloco</p>
      <p className="text-[11px] text-zinc-500">
        {count} {count === 1 ? "task" : "tasks"} sem fase associada
      </p>
    </button>
  );
}

// ============================================================
// KpiHero
// ============================================================

function KpiTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: typeof Target;
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneClasses = {
    neutral: "text-zinc-300 bg-zinc-500/10",
    good: "text-emerald-300 bg-emerald-500/10",
    warn: "text-amber-300 bg-amber-500/10",
    bad: "text-rose-300 bg-rose-500/10",
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-md",
          toneClasses,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </p>
        <p className="text-[18px] font-semibold leading-tight tabular-nums text-zinc-100">
          {value}
        </p>
        {hint && <p className="text-[10.5px] text-zinc-500">{hint}</p>}
      </div>
    </div>
  );
}

function KpiHero({ phases }: { phases: PhaseCardData[] }) {
  const k = useMemo(() => aggregateKpis(phases), [phases]);
  const nextDeadlineLabel = k.nextDeadline
    ? new Date(k.nextDeadline).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : "—";
  const daysToDeadline = k.nextDeadline
    ? Math.round((k.nextDeadline - Date.now()) / (24 * 3600 * 1000))
    : null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <KpiTile
        icon={TrendingUp}
        label="Progresso geral"
        value={`${k.percent}%`}
        hint={`${k.done}/${k.total} tasks`}
        tone={k.percent >= 70 ? "good" : k.percent >= 40 ? "neutral" : "warn"}
      />
      <KpiTile
        icon={Loader2}
        label="Em execucao"
        value={String(k.executing)}
        hint="tasks ativas agora"
        tone="neutral"
      />
      <KpiTile
        icon={AlertTriangle}
        label="Falhas"
        value={String(k.failed)}
        hint="precisam atencao"
        tone={k.failed > 0 ? "bad" : "good"}
      />
      <KpiTile
        icon={Target}
        label="Blocos em risco"
        value={String(k.atRisk)}
        hint={`de ${phases.length} blocos`}
        tone={k.atRisk > 0 ? "warn" : "good"}
      />
      <KpiTile
        icon={Calendar}
        label="Proximo prazo"
        value={nextDeadlineLabel}
        hint={
          daysToDeadline != null
            ? daysToDeadline < 0
              ? `${Math.abs(daysToDeadline)}d atrasado`
              : `em ${daysToDeadline}d`
            : undefined
        }
        tone={
          daysToDeadline == null
            ? "neutral"
            : daysToDeadline < 0
              ? "bad"
              : daysToDeadline <= 7
                ? "warn"
                : "neutral"
        }
      />
    </div>
  );
}

// ============================================================
// Sort dropdown
// ============================================================

type SortKey =
  | "urgency"
  | "deadline"
  | "percent-desc"
  | "percent-asc"
  | "priority"
  | "name";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "urgency", label: "Urgencia (bloqueado primeiro)" },
  { key: "deadline", label: "Proximo deadline" },
  { key: "percent-asc", label: "Menos concluido" },
  { key: "percent-desc", label: "Mais concluido" },
  { key: "priority", label: "Prioridade (urgente primeiro)" },
  { key: "name", label: "Nome (A-Z)" },
];

function sortPhases(phases: PhaseCardData[], sortBy: SortKey): PhaseCardData[] {
  const statusOrder: Record<PhaseStatus, number> = {
    blocked: 0,
    "at-risk": 1,
    "on-track": 2,
    done: 3,
  };
  const priorityOrder: Record<PhasePriority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const arr = [...phases];
  switch (sortBy) {
    case "urgency":
      arr.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
      break;
    case "deadline":
      arr.sort((a, b) => {
        const ta = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const tb = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return ta - tb;
      });
      break;
    case "percent-desc":
      arr.sort((a, b) => b.metrics.percent - a.metrics.percent);
      break;
    case "percent-asc":
      arr.sort((a, b) => a.metrics.percent - b.metrics.percent);
      break;
    case "priority":
      arr.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      break;
    case "name":
      arr.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      break;
  }
  return arr;
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  const current = SORT_OPTIONS.find((o) => o.key === value)?.label ?? "Ordenar";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-1.5 text-[12px] text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80"
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-zinc-500">Ordenar por:</span>
          <span className="font-medium">{current}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-zinc-500">
          Ordenar blocos por
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SORT_OPTIONS.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.key}
            checked={value === opt.key}
            onCheckedChange={() => onChange(opt.key)}
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================
// PhaseDetailView — drill-in (substitui o grid)
// ============================================================

const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; color: string; bg: string; glyph: React.ReactNode }
> = {
  executing: {
    label: "Em execucao",
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    glyph: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  failed: {
    label: "Falharam",
    color: "text-rose-300",
    bg: "bg-rose-500/10",
    glyph: <XCircle className="h-3 w-3" />,
  },
  inbox: {
    label: "Inbox",
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
    glyph: <CircleDashed className="h-3 w-3" />,
  },
  ready: {
    label: "Prontas",
    color: "text-sky-300",
    bg: "bg-sky-500/10",
    glyph: <ListChecks className="h-3 w-3" />,
  },
  done: {
    label: "Concluidas",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    glyph: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    label: "Canceladas",
    color: "text-zinc-500",
    bg: "bg-zinc-500/10",
    glyph: <XCircle className="h-3 w-3" />,
  },
};

const TASK_STATUS_ORDER: TaskStatus[] = [
  "executing",
  "failed",
  "ready",
  "inbox",
  "done",
  "cancelled",
];

function TaskRow({
  task,
  projectId,
}: {
  task: PhaseTaskMock;
  projectId?: string;
}) {
  const meta = TASK_STATUS_META[task.status];
  const href = projectId
    ? `/projects/${projectId}/issues/${task.id}`
    : undefined;
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    href ? (
      <a
        href={href}
        className="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-zinc-900/60"
      >
        {children}
      </a>
    ) : (
      <div className="group flex items-center gap-3 rounded-md px-3 py-2">
        {children}
      </div>
    );

  return (
    <Wrapper>
      <span className={cn("shrink-0", meta.color)}>{meta.glyph}</span>
      <span className="flex-1 min-w-0 truncate text-[13px] text-zinc-200 group-hover:text-zinc-50">
        {task.title}
      </span>
      {task.assignee && (
        <span
          title={task.assignee.name}
          className="hidden sm:flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white ring-2 ring-zinc-950"
          style={{ backgroundColor: task.assignee.color }}
        >
          {task.assignee.initials}
        </span>
      )}
      <span className="shrink-0 text-[11px] tabular-nums text-zinc-500">
        {relativeTime(task.updatedAt)}
      </span>
      <ChevronRight className="hidden sm:block h-3.5 w-3.5 shrink-0 text-zinc-700 group-hover:text-zinc-400" />
    </Wrapper>
  );
}

function PhaseDetailView({
  phase,
  projectId,
  onBack,
  onDelete,
}: {
  phase: PhaseCardData;
  projectId?: string;
  onBack: () => void;
  onDelete?: (phase: PhaseCardData) => void;
}) {
  const deadline = deadlineLabel(phase.deadline);
  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, PhaseTaskMock[]>();
    for (const t of phase.tasks) {
      const arr = map.get(t.status) ?? [];
      arr.push(t);
      map.set(t.status, arr);
    }
    return map;
  }, [phase.tasks]);

  return (
    <div className="space-y-5 p-4">
      {/* Breadcrumb + back + acoes */}
      <div className="flex items-center gap-2 text-[12px] text-zinc-500">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Blocos
        </button>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-300">{phase.name}</span>
        {onDelete && (
          <button
            type="button"
            aria-label={`Excluir bloco ${phase.name}`}
            title="Excluir bloco"
            onClick={() => onDelete(phase)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-rose-500/20 bg-rose-500/5 px-2.5 py-1 text-[12px] font-medium text-rose-300 transition-colors hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir bloco
          </button>
        )}
      </div>

      {/* Hero do bloco */}
      <div
        className={cn(
          "rounded-xl border bg-zinc-950/60 p-5",
          phase.status === "blocked" || phase.status === "at-risk"
            ? "border-rose-500/20"
            : "border-zinc-800",
        )}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <ProgressRing
            percent={phase.metrics.percent}
            status={phase.status}
            size={96}
            stroke={8}
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[17px] font-semibold tracking-tight text-zinc-100">
                {phase.name}
              </h2>
              <StatusPill status={phase.status} />
              <PriorityChip priority={phase.priority} />
              {phase.subPhasesCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-400">
                  <Layers className="h-3 w-3" />
                  {phase.subPhasesCount} sub-blocos
                </span>
              )}
            </div>
            {phase.description && (
              <p className="text-[12.5px] text-zinc-400">{phase.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <MiniStats m={phase.metrics} />
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[12px]",
                  deadline.tone === "late" && "text-rose-300",
                  deadline.tone === "warn" && "text-amber-300",
                  deadline.tone === "ok" && "text-zinc-400",
                  deadline.tone === "muted" && "text-zinc-600",
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                {deadline.text}
              </span>
              <AvatarStack assignees={phase.assignees} size={6} max={5} />
            </div>
          </div>
        </div>
      </div>

      {/* Atividade recente */}
      <div className="flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400/70" />
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-medium uppercase tracking-wide text-zinc-500">
            Atividade mais recente
          </p>
          <p className="truncate text-[12.5px] text-zinc-300">
            {phase.lastActivity.taskTitle}
          </p>
          <p className="text-[11px] text-zinc-500">
            ha {relativeTime(phase.lastActivity.timestamp)}
          </p>
        </div>
      </div>

      {/* Lista de tasks agrupadas por status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">
            Tasks deste bloco
          </h3>
          <span className="text-[11px] tabular-nums text-zinc-500">
            {phase.tasks.length} {phase.tasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {phase.tasks.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-800 px-4 py-6 text-center text-[12px] text-zinc-500">
            Nenhuma task neste bloco ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {TASK_STATUS_ORDER.map((status) => {
              const tasks = grouped.get(status) ?? [];
              if (tasks.length === 0) return null;
              const meta = TASK_STATUS_META[status];
              return (
                <div
                  key={status}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/40"
                >
                  <div
                    className={cn(
                      "flex items-center gap-2 border-b border-zinc-800 px-4 py-2",
                      meta.bg,
                    )}
                  >
                    <span className={meta.color}>{meta.glyph}</span>
                    <span
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-wide",
                        meta.color,
                      )}
                    >
                      {meta.label}
                    </span>
                    <span className="ml-auto text-[11px] tabular-nums text-zinc-500">
                      {tasks.length}
                    </span>
                  </div>
                  <div className="p-1.5">
                    {tasks.map((t) => (
                      <TaskRow key={t.id} task={t} projectId={projectId} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// PhaseCardsTab — componente raiz
// ============================================================

interface PhaseCardsTabProps {
  /** Usado nos hrefs das task rows e no POST de criar bloco. */
  projectId?: string;
  /** Nome do projeto — exibido no breadcrumb do CreatePhaseModal. */
  projectName?: string;
  /** Mantido por compatibilidade. */
  issues?: unknown[];
}

// ============================================================
// SkeletonGrid + EmptyState
// ============================================================

function SkeletonGrid() {
  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function EmptyPhases({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-400">
        <Layers className="h-5 w-5" />
      </div>
      <p className="text-[14px] font-medium text-zinc-300">
        Nenhum bloco neste projeto ainda
      </p>
      <p className="max-w-md text-[12px] text-zinc-500">
        Crie blocos (fases) para organizar as tasks do projeto. Tasks sem bloco
        aparecerao no bloco &quot;Sem bloco&quot;.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-[12.5px] font-medium text-white shadow-sm transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
      >
        <Plus className="h-3.5 w-3.5" />
        Criar primeiro bloco
      </button>
    </div>
  );
}

// ============================================================
// PhaseCardConnected — wrapper que liga 1 card aos hooks
// ============================================================

interface PhaseCardConnectedProps {
  phase: Phase;
  subPhasesCount: number;
  projectId?: string;
  onOpen: (phase: Phase) => void;
  onDelete?: (phase: Phase) => void;
}

function PhaseCardConnected({
  phase,
  subPhasesCount,
  onOpen,
  onDelete,
}: PhaseCardConnectedProps) {
  // Metrics ja foram pre-fetchadas no parent via useQueries — esta query
  // hita o cache instantaneamente.
  const { data: metrics } = usePhaseMetrics(phase.id);
  // Tasks usadas apenas para extrair assignees + lastActivity (display).
  const { data: tasks } = usePhaseAllTasks(phase.id);

  const cardData = useMemo(
    () => buildPhaseCardData(phase, metrics, tasks ?? [], subPhasesCount),
    [phase, metrics, tasks, subPhasesCount],
  );

  return (
    <PhaseCard
      phase={cardData}
      onOpen={() => onOpen(phase)}
      onDelete={onDelete ? () => onDelete(phase) : undefined}
    />
  );
}

// ============================================================
// PhaseDetailConnected — wrapper do drill-in
// ============================================================

function PhaseDetailConnected({
  phase,
  subPhasesCount,
  projectId,
  onBack,
  onDelete,
}: {
  phase: Phase;
  subPhasesCount: number;
  projectId?: string;
  onBack: () => void;
  onDelete?: (phase: Phase) => void;
}) {
  const { data: metrics } = usePhaseMetrics(phase.id);
  const { data: allTasks } = usePhaseAllTasks(phase.id);

  const cardData = useMemo(
    () => buildPhaseCardData(phase, metrics, allTasks ?? [], subPhasesCount),
    [phase, metrics, allTasks, subPhasesCount],
  );

  return (
    <PhaseDetailView
      phase={cardData}
      projectId={projectId}
      onBack={onBack}
      onDelete={onDelete ? () => onDelete(phase) : undefined}
    />
  );
}

// ============================================================
// PhaseCardsTab — componente raiz (conectado ao backend)
// ============================================================

export function PhaseCardsTab({ projectId, projectName }: PhaseCardsTabProps) {
  const [sortBy, setSortBy] = useState<SortKey>("urgency");
  const [openPhaseId, setOpenPhaseId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  // Quando != null, o DeletePhaseDialog abre. Compartilhado por todos
  // os triggers (cards no grid + botao no drill-in).
  const [deletePhase, setDeletePhase] = useState<Phase | null>(null);
  // Visao escolhida (cards|kanban|tree|list). Persistida em localStorage
  // por projeto. Hoje so 'cards' esta implementado; outras renderizam
  // placeholder "Em breve".
  const { view, setView } = useProjectViewPreference(projectId);

  // 1. Lista de fases do projeto
  const {
    data: allPhases,
    isLoading: phasesLoading,
    error: phasesError,
  } = usePhases(projectId ?? "");

  // 2. So fases de topo (idPai null) vao no grid. Sub-fases aparecem
  //    no drill-in da fase pai.
  const topLevelPhases = useMemo(
    () => (allPhases ?? []).filter((p) => !p.idPai),
    [allPhases],
  );

  // 3. Pre-fetch de metricas para TODAS as fases de topo — necessario
  //    para sort (urgencia/percent/prioridade dependem de metrics).
  //    Mesma queryKey de usePhaseMetrics → cache compartilhado, os cards
  //    nao refazem fetch.
  const metricsQueries = useQueries({
    queries: topLevelPhases.map((p) => ({
      queryKey: QUERY_KEYS.phases.metrics(p.id),
      queryFn: () => phasesApi.getMetrics(p.id),
      staleTime: 30 * 1000,
      enabled: !!p.id,
    })),
  });

  // 4. Conta sub-fases por id de pai (1 pass, O(N)).
  const subPhasesByParent = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of allPhases ?? []) {
      if (!p.idPai) continue;
      map.set(p.idPai, (map.get(p.idPai) ?? 0) + 1);
    }
    return map;
  }, [allPhases]);

  // 5. Sort: enriquece cada fase com metricas pre-fetchadas, ordena, e
  //    devolve apenas a Phase original (cards refazem o adapter internamente).
  const sortedPhases = useMemo(() => {
    const enriched = topLevelPhases.map((p, i) => ({
      phase: p,
      data: buildPhaseCardData(
        p,
        metricsQueries[i]?.data,
        [], // tasks nao precisa para sort
        subPhasesByParent.get(p.id) ?? 0,
      ),
    }));
    const sortedData = sortPhases(
      enriched.map((e) => e.data),
      sortBy,
    );
    // Reordena `phases` originais pela ordem de sortedData (match por id).
    const order = new Map(sortedData.map((d, i) => [d.id, i]));
    return [...enriched].sort(
      (a, b) => (order.get(a.phase.id) ?? 0) - (order.get(b.phase.id) ?? 0),
    );
  }, [topLevelPhases, metricsQueries, subPhasesByParent, sortBy]);

  // KPIs agregados: usa as PhaseCardData enriquecidas (com metricas).
  const kpiInput = useMemo(
    () => sortedPhases.map((e) => e.data),
    [sortedPhases],
  );

  // Drill-in
  const openPhase = openPhaseId
    ? (allPhases ?? []).find((p) => p.id === openPhaseId)
    : null;

  // Dialog de delete — montado uma vez, controlado por deletePhase.
  // Compartilhado entre todos os triggers (cards no grid + botao no drill-in).
  const deletePhaseDialog =
    projectId && deletePhase ? (
      <DeletePhaseDialog
        open={!!deletePhase}
        onOpenChange={(o) => !o && setDeletePhase(null)}
        projectId={projectId}
        phase={{
          id: deletePhase.id,
          nome: deletePhase.nome,
          idPai: deletePhase.idPai,
        }}
        subPhasesCount={subPhasesByParent.get(deletePhase.id) ?? 0}
        onDeleted={() => {
          // Se a fase deletada esta aberta no drill-in, volta pro grid.
          if (openPhaseId === deletePhase.id) {
            setOpenPhaseId(null);
          }
          setDeletePhase(null);
        }}
      />
    ) : null;

  if (openPhase) {
    return (
      <>
        <PhaseDetailConnected
          phase={openPhase}
          subPhasesCount={subPhasesByParent.get(openPhase.id) ?? 0}
          projectId={projectId}
          onBack={() => setOpenPhaseId(null)}
          onDelete={(p) => setDeletePhase(p)}
        />
        {deletePhaseDialog}
      </>
    );
  }

  // Loading inicial
  if (phasesLoading && !allPhases) {
    return <SkeletonGrid />;
  }

  // Erro
  if (phasesError) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
        <AlertTriangle className="h-5 w-5 text-rose-400" />
        <p className="text-[13px] font-medium text-rose-300">
          Erro ao carregar blocos
        </p>
        <p className="text-[11.5px] text-rose-400/70">
          {phasesError instanceof Error
            ? phasesError.message
            : "Tente recarregar a pagina."}
        </p>
      </div>
    );
  }

  // Modal de criar bloco — montado uma vez, controlado por createOpen.
  // Compartilhado entre os 2 ramos de render (vazio e com fases).
  const createPhaseModal = projectId ? (
    <CreatePhaseModal
      open={createOpen}
      onOpenChange={setCreateOpen}
      projectId={projectId}
      projectName={projectName}
    />
  ) : null;

  // Vazio
  if (topLevelPhases.length === 0) {
    return (
      <div className="space-y-6 p-4">
        <EmptyPhases onCreate={() => setCreateOpen(true)} />
        {createPhaseModal}
      </div>
    );
  }

  // Placeholder pra visoes ainda nao implementadas (Kanban/Hierarquia/Lista).
  // Se acidentalmente o localStorage tiver um valor nao-cards, mostra
  // mensagem clara em vez de tela em branco. Toggle ja desabilita os
  // botoes, mas isso e cinto de seguranca extra.
  const viewComingSoon = view !== "cards";

  return (
    <div className="space-y-6 p-4">
      <KpiHero phases={kpiInput} />

      {/* Toggle de visao + barra de controles na mesma linha visual */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ViewToggle value={view} onChange={setView} />
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">
            Blocos
            <span className="ml-2 text-[11px] font-normal normal-case text-zinc-500">
              {topLevelPhases.length}{" "}
              {topLevelPhases.length === 1 ? "bloco" : "blocos"}
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <SortDropdown value={sortBy} onChange={setSortBy} />
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            disabled={!projectId}
            className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-[12px] font-medium text-white shadow-sm transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo bloco
          </button>
        </div>
      </div>

      {deletePhaseDialog}

      {viewComingSoon ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-12 text-center">
          <p className="text-[13px] font-medium text-zinc-300">
            Esta visao chega em breve
          </p>
          <p className="max-w-md text-[12px] text-zinc-500">
            Por enquanto, volte para a visao &quot;Cards&quot; no toggle acima.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {sortedPhases.map(({ phase, data }) => (
            <PhaseCardConnected
              key={phase.id}
              phase={phase}
              subPhasesCount={data.subPhasesCount}
              projectId={projectId}
              onOpen={(p) => setOpenPhaseId(p.id)}
              onDelete={(p) => setDeletePhase(p)}
            />
          ))}
          {/* OrphanCard removido na v1 conectada: backend ainda nao expoe
              contagem de tasks orfas (sem idPai) em endpoint dedicado. Para
              adicionar, criar phasesApi.countOrphanTasks(projectId) e
              re-renderizar aqui condicional ao count > 0. */}
        </div>
      )}

      {createPhaseModal}
    </div>
  );
}

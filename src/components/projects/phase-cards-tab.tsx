"use client";

/**
 * PhaseCardsTab — visao macro do projeto em grid de cards.
 *
 * Versao V0 com dados MOCKADOS (src/lib/mocks/phase-cards-mock.ts).
 * Quando aprovado, trocar para hooks reais (usePhases + usePhaseMetrics).
 *
 * Design:
 *   - Hero strip com KPIs agregados (% projeto, totais, em risco, deadline).
 *   - Grid responsivo de PhaseCards (1/2/3 colunas).
 *   - Cada card: status pill, progress ring, stats inline, assignees, deadline.
 *   - Card "Sem bloco" para tasks orfas (idPai null).
 *   - Clique no card = drill-in (placeholder por enquanto — console.log).
 */

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Inbox,
  Layers,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  aggregateKpis,
  MOCK_ORPHAN_COUNT,
  MOCK_PHASE_CARDS,
  type PhaseCardData,
  type PhaseStatus,
} from "@/lib/mocks/phase-cards-mock";

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
// StatusPill — chip de status no canto superior do card
// ============================================================

const STATUS_META: Record<
  PhaseStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  "on-track": {
    label: "No prazo",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  "at-risk": {
    label: "Em risco",
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  blocked: {
    label: "Bloqueado",
    color: "text-rose-300",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
  done: {
    label: "Concluido",
    color: "text-zinc-300",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/30",
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
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "on-track" && "bg-emerald-400",
          status === "at-risk" && "bg-amber-400",
          status === "blocked" && "bg-rose-400 animate-pulse",
          status === "done" && "bg-zinc-400",
        )}
      />
      {meta.label}
    </span>
  );
}

// ============================================================
// ProgressRing — SVG circular grande (focal do card)
// ============================================================

function ProgressRing({
  percent,
  status,
  size = 84,
  stroke = 7,
}: {
  percent: number;
  status: PhaseStatus;
  size?: number;
  stroke?: number;
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[18px] font-semibold tabular-nums text-zinc-100">
          {pct}
          <span className="text-[11px] text-zinc-500">%</span>
        </span>
      </div>
    </div>
  );
}

// ============================================================
// AvatarStack — empilha avatares com +N
// ============================================================

function AvatarStack({
  assignees,
  max = 3,
}: {
  assignees: PhaseCardData["assignees"];
  max?: number;
}) {
  const shown = assignees.slice(0, max);
  const overflow = assignees.length - shown.length;
  return (
    <div className="flex -space-x-1.5">
      {shown.map((a) => (
        <span
          key={a.id}
          title={a.name}
          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-zinc-950"
          style={{ backgroundColor: a.color }}
        >
          {a.initials}
        </span>
      ))}
      {overflow > 0 && (
        <span
          title={`+${overflow} responsaveis`}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-medium text-zinc-300 ring-2 ring-zinc-950"
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

// ============================================================
// MiniStats — linha compacta com counters
// ============================================================

function MiniStats({ m }: { m: PhaseCardData["metrics"] }) {
  const items: Array<{
    icon: typeof CheckCircle2;
    value: number;
    color: string;
    title: string;
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
          <i.icon
            className={cn(
              "h-3 w-3",
              i.icon === Loader2 && i.value > 0 && "animate-spin",
            )}
          />
          {i.value}
        </span>
      ))}
    </div>
  );
}

// ============================================================
// PhaseCard — cartao individual de fase
// ============================================================

function PhaseCard({
  phase,
  onOpen,
}: {
  phase: PhaseCardData;
  onOpen: (phase: PhaseCardData) => void;
}) {
  const deadline = deadlineLabel(phase.deadline);
  const isAtRisk = phase.status === "at-risk" || phase.status === "blocked";

  return (
    <button
      type="button"
      onClick={() => onOpen(phase)}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-zinc-950/60 p-4 text-left",
        "transition-all duration-200",
        "hover:border-zinc-700 hover:bg-zinc-900/70 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
        isAtRisk ? "border-rose-500/20" : "border-zinc-800",
      )}
    >
      {/* Linha 1: status pill + sub-fases badge */}
      <div className="flex items-center justify-between gap-2">
        <StatusPill status={phase.status} />
        {phase.subPhasesCount > 0 && (
          <span
            className="inline-flex items-center gap-1 text-[10.5px] font-medium text-zinc-500"
            title={`${phase.subPhasesCount} sub-blocos`}
          >
            <Layers className="h-3 w-3" />
            {phase.subPhasesCount}
          </span>
        )}
      </div>

      {/* Linha 2: ring + nome/descricao */}
      <div className="flex items-start gap-4">
        <ProgressRing percent={phase.metrics.percent} status={phase.status} />
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate text-[14px] font-semibold tracking-tight text-zinc-100">
            {phase.name}
          </h3>
          {phase.description && (
            <p className="line-clamp-2 text-[11.5px] leading-relaxed text-zinc-500">
              {phase.description}
            </p>
          )}
          <div className="pt-1">
            <MiniStats m={phase.metrics} />
          </div>
        </div>
      </div>

      {/* Linha 3: atividade recente */}
      <div className="flex items-start gap-2 rounded-md bg-zinc-900/40 px-2.5 py-1.5">
        <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-violet-400/60" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11.5px] text-zinc-400">
            {phase.lastActivity.taskTitle}
          </p>
          <p className="text-[10px] text-zinc-600">
            ha {relativeTime(phase.lastActivity.timestamp)}
          </p>
        </div>
      </div>

      {/* Linha 4: footer com assignees + deadline + chevron */}
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
    </button>
  );
}

// ============================================================
// OrphanCard — tasks soltas sem fase
// ============================================================

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
        "min-h-[260px]",
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-zinc-500 group-hover:text-zinc-300">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="text-[13px] font-medium text-zinc-300">Sem bloco</p>
      <p className="text-[11px] text-zinc-500">
        {count} {count === 1 ? "task" : "tasks"} sem fase associada
      </p>
      <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-violet-400 opacity-0 transition-opacity group-hover:opacity-100">
        Organizar agora <ChevronRight className="h-3 w-3" />
      </span>
    </button>
  );
}

// ============================================================
// KpiHero — strip de KPIs agregados no topo
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
        <p className="text-[18px] font-semibold tabular-nums leading-tight text-zinc-100">
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
// PhaseCardsTab — componente raiz
// ============================================================

interface PhaseCardsTabProps {
  /** Mantido por compatibilidade com a assinatura do PhaseIssuesTab. Nao usado na v0 mockada. */
  projectId?: string;
  /** Mantido por compatibilidade. Substituido por mock no momento. */
  issues?: unknown[];
}

export function PhaseCardsTab(_props: PhaseCardsTabProps) {
  const phases = MOCK_PHASE_CARDS;
  const [selectedPhase, setSelectedPhase] = useState<PhaseCardData | null>(
    null,
  );

  // Ordenar: em risco primeiro, depois on-track, depois done.
  const sorted = useMemo(() => {
    const order: Record<PhaseStatus, number> = {
      blocked: 0,
      "at-risk": 1,
      "on-track": 2,
      done: 3,
    };
    return [...phases].sort((a, b) => order[a.status] - order[b.status]);
  }, [phases]);

  const handleOpen = (p: PhaseCardData) => {
    setSelectedPhase(p);
    // Placeholder: futuramente router.push(`/projects/${id}/phases/${p.id}`)
    // ou abrir um drawer com a arvore detalhada.
    console.log("[PhaseCardsTab] open", p.id, p.name);
  };

  return (
    <div className="space-y-5 p-4">
      {/* Hero KPIs */}
      <KpiHero phases={sorted} />

      {/* Grid de cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((p) => (
          <PhaseCard key={p.id} phase={p} onOpen={handleOpen} />
        ))}
        <OrphanCard
          count={MOCK_ORPHAN_COUNT}
          onOpen={() => console.log("[PhaseCardsTab] open orphans")}
        />
      </div>

      {/* Modal/drawer placeholder — quando aprovado, virar componente real */}
      {selectedPhase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedPhase(null)}
        >
          <div
            className="max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-semibold text-zinc-100">
              {selectedPhase.name}
            </h3>
            <p className="mt-1 text-[12px] text-zinc-500">
              Drill-down em construcao. Em breve: arvore de sub-blocos, lista
              completa de tasks com filtros, timeline e relatorio de fase.
            </p>
            <button
              type="button"
              onClick={() => setSelectedPhase(null)}
              className="mt-4 rounded-md bg-zinc-800 px-3 py-1.5 text-[12px] font-medium text-zinc-200 hover:bg-zinc-700"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

/**
 * PhaseViewTree — visao Hierarquia da aba Issues.
 *
 * Render em arvore expansivel:
 *   [▼ Bloco Raiz                ●●● 78%  25/32  [+ Sub] [🗑]]
 *     [▼ Sub-bloco                ●● 35%  4/12              ]
 *       ◑ Task em execucao         Bene  2h
 *       ✓ Task concluida           Pedro ontem
 *     ◑ Task folha do raiz         Carla 1h
 *
 * Decisoes:
 *   - Top-level expandidos por default; sub-fases colapsadas
 *   - Lazy load das tasks (usePhaseAllTasks com enabled=expanded)
 *   - Sub-fases vem da lista completa de fases (childrenByParent),
 *     tasks folha vem do usePhaseAllTasks filtradas (exclui ids
 *     que sao sub-fases ja listadas)
 *   - "+ Sub-bloco" abre o mesmo CreatePhaseModal com parentPhaseId
 *   - "🗑 Excluir" reusa o DeletePhaseDialog ja existente
 */

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  CircleDot,
  ListChecks,
  Loader2,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePhaseAllTasks, usePhaseMetrics } from "@/lib/hooks/use-phases";
import type { Phase, PhaseCriticalTask } from "@/lib/api/phases";

// ============================================================
// Helpers
// ============================================================

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
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

// Mapeia status string do backend para visual.
function statusGlyph(status: string): { icon: React.ReactNode; tone: string } {
  const s = status.toLowerCase();
  if (s === "executing" || s === "in_progress")
    return {
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      tone: "text-amber-400",
    };
  if (s === "failed")
    return { icon: <XCircle className="h-3 w-3" />, tone: "text-rose-400" };
  if (s === "done" || s === "completed")
    return {
      icon: <CheckCircle2 className="h-3 w-3" />,
      tone: "text-emerald-400",
    };
  if (s === "ready" || s === "validating" || s === "validated")
    return {
      icon: <ListChecks className="h-3 w-3" />,
      tone: "text-sky-400",
    };
  if (s === "cancelled" || s === "discarded")
    return { icon: <XCircle className="h-3 w-3" />, tone: "text-zinc-600" };
  // inbox / draft / default
  return {
    icon: <CircleDashed className="h-3 w-3" />,
    tone: "text-zinc-500",
  };
}

// ============================================================
// MiniProgressBar — barra horizontal compacta
// ============================================================

function MiniProgressBar({
  percent,
  width = 80,
}: {
  percent: number;
  width?: number;
}) {
  const pct = Math.min(100, Math.max(0, percent));
  const color =
    pct >= 100
      ? "bg-emerald-400"
      : pct >= 60
        ? "bg-violet-400"
        : pct >= 30
          ? "bg-sky-400"
          : "bg-zinc-500";
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-zinc-800"
      style={{ width }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ============================================================
// TaskTreeRow — linha de task folha
// ============================================================

function TaskTreeRow({
  task,
  projectId,
  depth,
}: {
  task: PhaseCriticalTask;
  projectId?: string;
  depth: number;
}) {
  const { icon, tone } = statusGlyph(task.status);
  const href = projectId
    ? `/projects/${projectId}/issues/${task.id}`
    : undefined;
  // Indentacao via padding inline (depth * step + base).
  const paddingLeft = `${depth * 20 + 36}px`;

  const inner = (
    <>
      <span className={cn("shrink-0", tone)}>{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[12.5px] text-zinc-300 group-hover:text-zinc-50">
        {task.title}
      </span>
      {task.assigneeName && (
        <span className="hidden sm:inline text-[11px] text-zinc-500">
          {task.assigneeName}
        </span>
      )}
      <span className="shrink-0 text-[10.5px] tabular-nums text-zinc-600">
        {relativeTime(task.updatedAt)}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="group flex items-center gap-3 rounded py-1 pr-3 transition-colors hover:bg-zinc-900/60"
        style={{ paddingLeft }}
      >
        {inner}
      </a>
    );
  }
  return (
    <div
      className="group flex items-center gap-3 rounded py-1 pr-3"
      style={{ paddingLeft }}
    >
      {inner}
    </div>
  );
}

// ============================================================
// PhaseTreeNode — recursivo
// ============================================================

interface PhaseTreeNodeProps {
  phase: Phase;
  depth: number;
  childrenByParent: Map<string, Phase[]>;
  projectId?: string;
  onDelete?: (phase: Phase) => void;
  onCreateChild?: (parent: Phase) => void;
}

function PhaseTreeNode({
  phase,
  depth,
  childrenByParent,
  projectId,
  onDelete,
  onCreateChild,
}: PhaseTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth === 0);

  // Metricas e tasks vem dos hooks compartilhados — cache reusado quando
  // o usuario alterna entre cards/tree (mesma queryKey).
  const { data: metrics } = usePhaseMetrics(phase.id);
  // Tasks so carregam quando o node esta expandido (lazy).
  const { data: rawTasks, isLoading: loadingTasks } = usePhaseAllTasks(
    phase.id,
    { enabled: expanded },
  );

  const childPhases = childrenByParent.get(phase.id) ?? [];

  // Tasks folha = tudo que o backend retornou exceto ids que sao sub-fases
  // (sub-fases tambem aparecem em /tasks?idPai=X porque PHASE eh DTask).
  const leafTasks = useMemo(() => {
    if (!rawTasks) return [];
    const childIds = new Set(childPhases.map((p) => p.id));
    return rawTasks.filter((t) => !childIds.has(t.id));
  }, [rawTasks, childPhases]);

  const percent = metrics?.percent ?? 0;
  const done = metrics?.done ?? 0;
  const total = metrics?.total ?? 0;
  const failed = metrics?.failed ?? 0;
  const inProgress = metrics?.inProgress ?? 0;

  // Indentacao do header. Botoes de expand sao alinhados ao depth.
  const headerPaddingLeft = `${depth * 20 + 8}px`;

  return (
    <div>
      {/* Header */}
      <div
        className={cn(
          "group flex items-center gap-2 rounded py-1.5 pr-2 transition-colors hover:bg-zinc-900/40",
          depth === 0 && "bg-zinc-950/40",
        )}
        style={{ paddingLeft: headerPaddingLeft }}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Colapsar bloco" : "Expandir bloco"}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-150",
              expanded && "rotate-90",
            )}
          />
        </button>

        <span
          className={cn(
            "min-w-0 flex-1 truncate font-medium",
            depth === 0
              ? "text-[13.5px] text-zinc-100"
              : "text-[12.5px] text-zinc-200",
          )}
          title={phase.nome}
        >
          {phase.nome}
        </span>

        {/* Stats compactos */}
        <div className="flex shrink-0 items-center gap-3 text-[11px] tabular-nums">
          {/* Mini stats sempre visiveis (semantica resumida) */}
          {total > 0 && (
            <span className="flex items-center gap-1 text-zinc-500">
              <span className="text-emerald-400/80">{done}</span>
              <span className="text-zinc-700">/</span>
              <span>{total}</span>
            </span>
          )}
          {failed > 0 && (
            <span
              className="inline-flex items-center gap-0.5 text-rose-400"
              title={`${failed} task(s) com falha`}
            >
              <XCircle className="h-3 w-3" />
              {failed}
            </span>
          )}
          {inProgress > 0 && (
            <span
              className="inline-flex items-center gap-0.5 text-amber-400"
              title={`${inProgress} task(s) em execucao`}
            >
              <CircleDot className="h-3 w-3" />
              {inProgress}
            </span>
          )}
          <MiniProgressBar percent={percent} width={depth === 0 ? 80 : 60} />
          <span className="hidden sm:inline text-zinc-500 min-w-[28px] text-right">
            {percent}%
          </span>
        </div>

        {/* Acoes hover-visible */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {onCreateChild && (
            <button
              type="button"
              onClick={() => onCreateChild(phase)}
              aria-label={`Adicionar sub-bloco em ${phase.nome}`}
              title="Adicionar sub-bloco"
              className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-violet-500/10 hover:text-violet-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/50"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(phase)}
              aria-label={`Excluir bloco ${phase.nome}`}
              title="Excluir bloco"
              className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conteudo expansivel */}
      {expanded && (
        <div className="mt-0.5">
          {/* Sub-fases */}
          {childPhases.map((sub) => (
            <PhaseTreeNode
              key={sub.id}
              phase={sub}
              depth={depth + 1}
              childrenByParent={childrenByParent}
              projectId={projectId}
              onDelete={onDelete}
              onCreateChild={onCreateChild}
            />
          ))}

          {/* Tasks folha */}
          {loadingTasks ? (
            <div
              className="flex items-center gap-2 py-1.5 text-[12px] text-zinc-500"
              style={{ paddingLeft: `${depth * 20 + 36}px` }}
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              Carregando tasks...
            </div>
          ) : leafTasks.length > 0 ? (
            <div className="space-y-px">
              {leafTasks.map((task) => (
                <TaskTreeRow
                  key={task.id}
                  task={task}
                  projectId={projectId}
                  depth={depth + 1}
                />
              ))}
            </div>
          ) : childPhases.length === 0 ? (
            <p
              className="py-1 text-[11.5px] italic text-zinc-600"
              style={{ paddingLeft: `${depth * 20 + 36}px` }}
            >
              Nenhuma task neste bloco.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PhaseViewTree — raiz
// ============================================================

interface PhaseViewTreeProps {
  /** Todas as fases do projeto (raizes + sub-fases). */
  allPhases: Phase[];
  projectId?: string;
  onDelete?: (phase: Phase) => void;
  onCreateChild?: (parent: Phase) => void;
}

export function PhaseViewTree({
  allPhases,
  projectId,
  onDelete,
  onCreateChild,
}: PhaseViewTreeProps) {
  // Index sub-fases por id do pai (1 pass O(N)).
  const childrenByParent = useMemo(() => {
    const map = new Map<string, Phase[]>();
    for (const p of allPhases) {
      if (!p.idPai) continue;
      const arr = map.get(p.idPai) ?? [];
      arr.push(p);
      map.set(p.idPai, arr);
    }
    return map;
  }, [allPhases]);

  // So fases raiz no nivel zero (sub-fases aparecem renderizadas dentro).
  const rootPhases = useMemo(
    () => allPhases.filter((p) => !p.idPai),
    [allPhases],
  );

  if (rootPhases.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center text-[12px] text-zinc-500">
        Nenhum bloco neste projeto ainda.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-2">
      <div className="space-y-1">
        {rootPhases.map((phase) => (
          <PhaseTreeNode
            key={phase.id}
            phase={phase}
            depth={0}
            childrenByParent={childrenByParent}
            projectId={projectId}
            onDelete={onDelete}
            onCreateChild={onCreateChild}
          />
        ))}
      </div>
    </div>
  );
}

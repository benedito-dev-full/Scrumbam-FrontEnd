"use client";

/**
 * PhaseIssuesTab — aba Issues com agrupamento por Fase.
 *
 * ADR-V2-047: substitui o IssuesTab flat por blocos colapsaveis
 * agrupados por fase (DTask idClasse=-200 PHASE).
 *
 * Design:
 *   - Cada fase e um bloco colapsavel com barra de progresso.
 *   - Metricas sao carregadas sempre (para exibir barra mesmo fechado).
 *   - Tasks criticas sao carregadas de forma lazy (so ao expandir).
 *   - Tasks sem fase aparecem no bloco "Sem bloco" ao final.
 */

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IntentionDocument } from "@/types/intention";
import type { Phase, PhaseCriticalTask } from "@/lib/api/phases";
import { usePhases, usePhaseMetrics, usePhaseTasksCritical } from "@/lib/hooks/use-phases";

// ============================================================
// Helpers de data relativa
// ============================================================

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  return `${days}d`;
}

// ============================================================
// ProgressBar
// ============================================================

function ProgressBar({ percent }: { percent: number }) {
  const pct = Math.min(100, Math.max(0, percent));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-zinc-500">{pct}%</span>
    </div>
  );
}

// ============================================================
// FailBadge
// ============================================================

function FailBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[11px] font-medium bg-rose-500/10 text-rose-400">
      <AlertTriangle className="h-3 w-3" />
      {count}
    </span>
  );
}

// ============================================================
// StatusGlyph — icone visual por status
// ============================================================

function StatusGlyph({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "executing") {
    return <span className="text-amber-400 text-[13px] font-bold">◑</span>;
  }
  if (s === "failed") {
    return <span className="text-rose-400 text-[13px] font-bold">✗</span>;
  }
  if (s === "done") {
    return <span className="text-emerald-400 text-[13px] font-bold">✓</span>;
  }
  return <span className="text-zinc-500 text-[13px]">○</span>;
}

// ============================================================
// CriticalTaskRow
// ============================================================

interface CriticalTaskRowProps {
  task: PhaseCriticalTask;
  projectId: string;
}

function CriticalTaskRow({ task, projectId }: CriticalTaskRowProps) {
  return (
    <Link
      href={`/projects/${projectId}/issues/${task.id}`}
      className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-900/60 transition-colors group"
    >
      <StatusGlyph status={task.status} />
      <span className="flex-1 min-w-0 truncate text-[13px] text-zinc-300 group-hover:text-zinc-100">
        {task.title}
      </span>
      <span className="shrink-0 text-[12px] text-zinc-500 hidden sm:block">
        {task.assigneeName ?? "—"}
      </span>
      <span className="shrink-0 text-[11px] text-zinc-600 tabular-nums">
        {relativeTime(task.updatedAt)}
      </span>
    </Link>
  );
}

// ============================================================
// PhaseBlock — bloco colapsavel de uma fase
// ============================================================

interface PhaseBlockProps {
  phase: Phase;
  projectId: string;
}

function PhaseBlock({ phase, projectId }: PhaseBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: metrics } = usePhaseMetrics(phase.id);
  const { data: criticalTasks, isLoading: loadingTasks } =
    usePhaseTasksCritical(phase.id, { enabled: isExpanded });

  const executing = (criticalTasks ?? []).filter(
    (t) => t.status === "executing",
  );
  const failed = (criticalTasks ?? []).filter((t) => t.status === "failed");

  const done = metrics?.done ?? 0;
  const total = metrics?.total ?? 0;
  const percent = metrics?.percent ?? 0;
  const failedCount = metrics?.failed ?? 0;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 overflow-hidden">
      {/* Header — clicavel */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-900/60 transition-colors"
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-150",
            isExpanded && "rotate-90",
          )}
        />

        {/* Nome da fase */}
        <span className="flex-1 min-w-0 truncate text-[13px] font-medium text-zinc-200">
          {phase.nome}
        </span>

        {/* Barra de progresso */}
        <div className="hidden sm:block">
          <ProgressBar percent={percent} />
        </div>

        {/* Contador done/total */}
        <span className="shrink-0 text-[12px] tabular-nums text-zinc-500">
          {done}/{total}
        </span>

        {/* Badge de falhas */}
        <FailBadge count={failedCount} />
      </button>

      {/* Painel expandido */}
      {isExpanded && (
        <div className="border-t border-zinc-800 px-3 py-2 space-y-3">
          {/* Barra de progresso mobile (visivel so em telas pequenas) */}
          <div className="sm:hidden">
            <ProgressBar percent={percent} />
          </div>

          {loadingTasks ? (
            <div className="flex items-center gap-2 py-2 text-[13px] text-zinc-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Carregando tasks...
            </div>
          ) : (
            <>
              {/* Secao: Em Progresso */}
              {executing.length > 0 && (
                <div className="space-y-0.5">
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-amber-400/70">
                    Em Progresso ({executing.length})
                  </p>
                  {executing.map((t) => (
                    <CriticalTaskRow key={t.id} task={t} projectId={projectId} />
                  ))}
                </div>
              )}

              {/* Secao: Falharam */}
              {failed.length > 0 && (
                <div className="space-y-0.5">
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-rose-400/70">
                    Falharam ({failed.length})
                  </p>
                  {failed.map((t) => (
                    <CriticalTaskRow key={t.id} task={t} projectId={projectId} />
                  ))}
                </div>
              )}

              {/* Estado vazio no painel expandido */}
              {executing.length === 0 && failed.length === 0 && (
                <p className="px-2 py-1 text-[13px] text-zinc-600">
                  Nenhuma task em progresso ou com falha.
                </p>
              )}
            </>
          )}

          {/* Link "Ver todas" */}
          {total > 0 && (
            <Link
              href={`/projects/${projectId}/issues?phase=${phase.id}`}
              className="flex items-center gap-1 px-2 py-1 text-[12px] text-violet-400 hover:text-violet-300 transition-colors"
            >
              Ver todas as {total} tasks desta fase
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// OrphanBlock — tasks sem fase
// ============================================================

interface OrphanBlockProps {
  issues: IntentionDocument[];
  projectId: string;
}

function OrphanBlock({ issues, projectId }: OrphanBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (issues.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-900/60 transition-colors"
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-150",
            isExpanded && "rotate-90",
          )}
        />
        <span className="flex-1 text-[13px] font-medium text-zinc-400">
          Sem bloco
        </span>
        <span className="text-[12px] tabular-nums text-zinc-500">
          {issues.length} task{issues.length !== 1 ? "s" : ""}
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-zinc-800 px-3 py-2 space-y-0.5">
          {issues.map((issue) => {
            // Montar um PhaseCriticalTask compativel com a linha de exibicao
            const task: PhaseCriticalTask = {
              id: issue.id,
              title: issue.title,
              status: issue.status,
              assigneeName: null,
              updatedAt: issue.updatedAt,
            };
            return (
              <CriticalTaskRow key={task.id} task={task} projectId={projectId} />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PhaseIssuesTab — componente raiz exportado
// ============================================================

interface PhaseIssuesTabProps {
  projectId: string;
  issues: IntentionDocument[];
}

export function PhaseIssuesTab({ projectId, issues }: PhaseIssuesTabProps) {
  const { data: phases, isLoading: loadingPhases } = usePhases(projectId);

  // Tasks sem fase: IntentionDocument nao tem idPai atualmente, por isso todas
  // caem no bloco "Sem bloco". Quando o adapter incluir idPai, o filtro abaixo
  // passara a funcionar automaticamente sem alteracao neste componente.
  const orphanIssues = issues.filter(
    (i) => !(i as IntentionDocument & { idPai?: string | null }).idPai,
  );

  // Ordenar fases por ordem (se disponivel)
  const sortedPhases = [...(phases ?? [])].sort((a, b) => {
    if (a.ordem != null && b.ordem != null) return a.ordem - b.ordem;
    if (a.ordem != null) return -1;
    if (b.ordem != null) return 1;
    return a.nome.localeCompare(b.nome);
  });

  // Estado de loading (skeleton)
  if (loadingPhases) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-11 rounded-lg border border-zinc-800 bg-zinc-950/40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Estado vazio
  const isEmpty =
    sortedPhases.length === 0 && issues.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
        <p className="text-[14px]">Nenhuma fase ou task encontrada.</p>
        <p className="text-[12px] mt-1">
          Crie fases no projeto para organizar as tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {/* Blocos de fases */}
      {sortedPhases.map((phase) => (
        <PhaseBlock key={phase.id} phase={phase} projectId={projectId} />
      ))}

      {/* Bloco de tasks sem fase */}
      {orphanIssues.length > 0 && (
        <OrphanBlock issues={orphanIssues} projectId={projectId} />
      )}
    </div>
  );
}

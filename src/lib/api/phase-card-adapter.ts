/**
 * Adapter: converte respostas do backend (Phase + PhaseMetrics +
 * PhaseCriticalTask[]) no shape `PhaseCardData` consumido pelo
 * PhaseCardsTab.
 *
 * O backend (ADR-V2-047) expoe campos minimos. Os "enriquecimentos"
 * abaixo (status derivado, prioridade derivada, assignees extraidos
 * das tasks, atividade recente) sao calculos puros client-side
 * enquanto o backend nao popular esses campos diretamente em DTask.dados.
 */

import type { Phase, PhaseCriticalTask, PhaseMetrics } from "./phases";
import type {
  PhaseAssignee,
  PhaseCardData,
  PhasePriority,
  PhaseRecentActivity,
  PhaseStatus,
  PhaseTaskMock,
  TaskStatus,
} from "@/lib/mocks/phase-cards-mock";

// ============================================================
// Paleta deterministica por nome (estaveis entre renders)
// ============================================================

const PALETTE = [
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#06b6d4",
  "#f43f5e",
  "#3b82f6",
  "#ec4899",
  "#22c55e",
  "#a855f7",
  "#14b8a6",
];

function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0;
}

function colorFor(name: string): string {
  return PALETTE[hash(name) % PALETTE.length];
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ============================================================
// Derivacoes
// ============================================================

/**
 * Deriva status visual da fase a partir das metricas + deadline.
 *
 * Regras (em ordem):
 *   - total === 0           → on-track (fase vazia, nao penaliza)
 *   - percent >= 100        → done
 *   - failed > 0 && inProgress === 0 → blocked (so falhas, ninguem trabalhando)
 *   - deadline atrasado ou perto (<=7d) e percent < 50 → at-risk
 *   - failed > 0            → at-risk (qualquer falha sinaliza)
 *   - default               → on-track
 */
export function deriveStatus(
  m: PhaseMetrics,
  deadline?: string | null,
): PhaseStatus {
  if (m.total === 0) return "on-track";
  if (m.percent >= 100) return "done";
  if (m.failed > 0 && m.inProgress === 0) return "blocked";
  if (deadline) {
    const days =
      (new Date(deadline).getTime() - Date.now()) / (24 * 3600 * 1000);
    if (days < 0) return "at-risk";
    if (days <= 7 && m.percent < 50) return "at-risk";
  }
  if (m.failed > 0) return "at-risk";
  return "on-track";
}

/**
 * Prioridade derivada do status. Backend ainda nao expoe priority
 * em DTask. Quando popular (DTask.dados.priority), trocar para
 * leitura direta no buildPhaseCardData.
 */
export function derivePriority(status: PhaseStatus): PhasePriority {
  switch (status) {
    case "blocked":
      return "urgent";
    case "at-risk":
      return "high";
    case "done":
      return "low";
    default:
      return "medium";
  }
}

/**
 * Extrai responsaveis unicos a partir das tasks da fase.
 * Backend retorna apenas `assigneeName` (string), entao o "id"
 * eh o proprio nome (dedup por nome).
 */
export function extractAssignees(
  tasks: PhaseCriticalTask[],
  max = 5,
): PhaseAssignee[] {
  const seen = new Map<string, PhaseAssignee>();
  for (const t of tasks) {
    const name = t.assigneeName?.trim();
    if (!name) continue;
    if (seen.has(name)) continue;
    seen.set(name, {
      id: name,
      name,
      initials: initialsFor(name),
      color: colorFor(name),
    });
    if (seen.size >= max) break;
  }
  return [...seen.values()];
}

/**
 * Pega a task mais recente atualizada como "atividade recente".
 */
export function extractLastActivity(
  tasks: PhaseCriticalTask[],
): PhaseRecentActivity | undefined {
  if (tasks.length === 0) return undefined;
  let latest = tasks[0];
  for (let i = 1; i < tasks.length; i++) {
    if (
      new Date(tasks[i].updatedAt).getTime() >
      new Date(latest.updatedAt).getTime()
    ) {
      latest = tasks[i];
    }
  }
  return {
    taskTitle: latest.title,
    timestamp: latest.updatedAt,
  };
}

// ============================================================
// Mapeamento de status de task
// ============================================================

const TASK_STATUS_MAP: Record<string, TaskStatus> = {
  executing: "executing",
  in_progress: "executing",
  inprogress: "executing",
  failed: "failed",
  fail: "failed",
  done: "done",
  completed: "done",
  complete: "done",
  cancelled: "cancelled",
  canceled: "cancelled",
  ready: "ready",
  validating: "ready",
  validated: "ready",
  inbox: "inbox",
  draft: "inbox",
};

function normalizeTaskStatus(raw: string): TaskStatus {
  return TASK_STATUS_MAP[raw.toLowerCase()] ?? "inbox";
}

export function mapApiTaskToCardTask(t: PhaseCriticalTask): PhaseTaskMock {
  const name = t.assigneeName?.trim();
  return {
    id: t.id,
    title: t.title,
    status: normalizeTaskStatus(t.status),
    assignee: name
      ? {
          id: name,
          name,
          initials: initialsFor(name),
          color: colorFor(name),
        }
      : undefined,
    updatedAt: t.updatedAt,
  };
}

// ============================================================
// Composicao final
// ============================================================

const EMPTY_METRICS: PhaseMetrics = {
  total: 0,
  done: 0,
  failed: 0,
  inProgress: 0,
  percent: 0,
};

/**
 * Monta PhaseCardData a partir das 3 fontes do backend.
 *
 * @param phase Resposta de `phasesApi.listByProject`.
 * @param metrics Resposta de `phasesApi.getMetrics` (pode estar undefined
 *   enquanto carrega — usado EMPTY_METRICS como fallback).
 * @param tasks Resposta de `phasesApi.listAllTasksOfPhase` ou
 *   `getCriticalTasks` — usado para extrair assignees, lastActivity e
 *   alimentar o drill-in.
 * @param subPhasesCount Quantas fases tem `idPai === phase.id`. Calculado
 *   no parent component a partir da lista completa de fases.
 * @param deadline Opcional — backend ainda nao expoe. Ler de
 *   `phase.dados?.deadline` quando disponivel.
 */
export function buildPhaseCardData(
  phase: Phase,
  metrics: PhaseMetrics | undefined,
  tasks: PhaseCriticalTask[],
  subPhasesCount: number,
  deadline?: string | null,
): PhaseCardData {
  const m = metrics ?? EMPTY_METRICS;
  const pending = Math.max(0, m.total - m.done - m.failed - m.inProgress);
  const status = deriveStatus(m, deadline);
  const priority = derivePriority(status);
  const assignees = extractAssignees(tasks);
  const lastActivity = extractLastActivity(tasks) ?? {
    taskTitle: phase.descricao ?? "Sem atividade recente",
    timestamp: new Date().toISOString(),
  };

  return {
    id: phase.id,
    name: phase.nome,
    description: phase.descricao ?? undefined,
    status,
    priority,
    metrics: {
      total: m.total,
      done: m.done,
      executing: m.inProgress,
      failed: m.failed,
      pending,
      percent: m.percent,
    },
    assignees,
    lastActivity,
    deadline: deadline ?? undefined,
    subPhasesCount,
    tasks: tasks.map(mapApiTaskToCardTask),
  };
}

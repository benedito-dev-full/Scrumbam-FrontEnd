/**
 * API layer para Fases (DTask idClasse=-200 PHASE).
 *
 * ADR-V2-047: DTask fases via idPai. O backend expoe:
 *   GET /tasks?idClasse=PHASE&idProject={projectId}  — lista fases
 *   GET /tasks/{id}/metrics                          — metricas da fase
 *   GET /tasks?idPai={phaseId}&limit=10              — tasks criticas (lazy)
 *
 * Nenhum endpoint novo foi criado — apenas consumo canonico (Pilar 2).
 */

import api from "./client";
import { ENDPOINTS } from "./endpoints";

/**
 * Chave numerica da DClasse PHASE (DTask agrupadora — ADR-V2-047).
 *
 * DIVIDA TECNICA: o backend (src/tasks/dto/list-tasks-query.dto.ts)
 * exige `idClasse` como string numerica (@Matches(/^-?\d+$/)), entao
 * mandamos a chave -200 em vez do codigo semantico "PHASE". Isso acopla
 * o frontend ao ID interno do banco — boundary violado.
 *
 * A solucao correta a longo prazo eh o backend aceitar AMBOS:
 *   - "PHASE"  → lookup em DClasse.codigo (cacheado)
 *   - "-200"   → uso direto da chave
 * Quando essa task for entregue no V2, trocar para o codigo textual
 * e remover esta constante.
 */
const PHASE_CLASSE_KEY = "-200";

// ============================================================
// Tipos exportados
// ============================================================

export interface Phase {
  /** ID da fase (DTask.chave como string). */
  id: string;
  /** Nome da fase (DTask.nome). */
  nome: string;
  /** Descricao livre. */
  descricao?: string | null;
  /** Ordem de exibicao (DTask.ordem). */
  ordem?: number | null;
  /** ID da task pai (DTask.idPai), null em fases de topo. */
  idPai?: string | null;
}

export interface PhaseMetrics {
  total: number;
  done: number;
  failed: number;
  /** Tasks em execucao (EXECUTING). */
  inProgress: number;
  /** Percentual concluido (0-100). */
  percent: number;
}

export interface PhaseCriticalTask {
  id: string;
  title: string;
  /** Status V3 (EXECUTING, FAILED, etc.). */
  status: string;
  assigneeName?: string | null;
  updatedAt: string;
}

// ============================================================
// Mappers internos
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPhase(raw: any): Phase {
  return {
    id: String(raw.chave ?? raw.id ?? ""),
    nome: String(raw.nome ?? raw.name ?? raw.titulo ?? ""),
    descricao: raw.descricao ?? raw.description ?? null,
    ordem: raw.ordem != null ? Number(raw.ordem) : null,
    idPai:
      raw.idPai != null || raw.idParentTask != null
        ? String(raw.idPai ?? raw.idParentTask)
        : null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCriticalTask(raw: any): PhaseCriticalTask {
  // O status pode vir como string enum (EXECUTING) ou como objeto { codigo, nome }
  let status = "inbox";
  if (raw.status) {
    if (typeof raw.status === "string") {
      status = raw.status.toLowerCase();
    } else if (raw.status.codigo) {
      status = String(raw.status.codigo).toLowerCase();
    } else if (raw.status.code) {
      status = String(raw.status.code).toLowerCase();
    }
  }

  const assigneeName =
    raw.assignee?.nome ?? raw.assignee?.name ?? raw.assigneeName ?? null;

  return {
    id: String(raw.chave ?? raw.id ?? ""),
    title: String(raw.titulo ?? raw.name ?? raw.nome ?? ""),
    status,
    assigneeName: assigneeName ? String(assigneeName) : null,
    updatedAt: String(
      raw.atualizadoEm ?? raw.updatedAt ?? new Date().toISOString(),
    ),
  };
}

// ============================================================
// API client
// ============================================================

export const phasesApi = {
  /**
   * Lista todas as fases de um projeto.
   * Usa idClasse=PHASE (codigo canonico ADR-V2-047, chave=-200).
   */
  listByProject: async (projectId: string): Promise<Phase[]> => {
    const { data } = await api.get(ENDPOINTS.TASKS, {
      params: { idClasse: PHASE_CLASSE_KEY, projectId: projectId },
    });
    const items = Array.isArray(data) ? data : (data?.items ?? []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return items.map((item: any) => mapPhase(item));
  },

  /**
   * Retorna metricas de progresso de uma fase.
   * Endpoint: GET /tasks/{phaseId}/metrics
   */
  getMetrics: async (phaseId: string): Promise<PhaseMetrics> => {
    const { data } = await api.get(ENDPOINTS.TASK_METRICS(phaseId));
    return {
      total: Number(data.total ?? 0),
      done: Number(data.done ?? 0),
      failed: Number(data.failed ?? 0),
      inProgress: Number(data.inProgress ?? data.in_progress ?? 0),
      percent: Number(data.percent ?? 0),
    };
  },

  /**
   * Retorna tasks criticas (EXECUTING + FAILED) de uma fase.
   * Carregado de forma lazy — apenas quando o bloco e expandido.
   * Endpoint: GET /tasks?idPai={phaseId}&limit=10
   */
  getCriticalTasks: async (phaseId: string): Promise<PhaseCriticalTask[]> => {
    const { data } = await api.get(ENDPOINTS.TASKS, {
      params: { idPai: phaseId, limit: 10 },
    });
    const items = Array.isArray(data) ? data : (data?.items ?? []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return items.map((item: any) => mapCriticalTask(item));
  },

  /**
   * Retorna TODAS as tasks filhas de uma fase (sem filtro de status).
   * Usado no drill-in (PhaseDetailView) para listar tasks agrupadas por status.
   * Endpoint: GET /tasks?idPai={phaseId}&limit=200
   *
   * Limite alto (200) cobre fases razoaveis. Se uma fase tiver mais que isso,
   * trocar para paginacao cursor.
   */
  listAllTasksOfPhase: async (
    phaseId: string,
  ): Promise<PhaseCriticalTask[]> => {
    const { data } = await api.get(ENDPOINTS.TASKS, {
      params: { idPai: phaseId, limit: 200 },
    });
    const items = Array.isArray(data) ? data : (data?.items ?? []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return items.map((item: any) => mapCriticalTask(item));
  },

  /**
   * Cria uma nova fase (DTask idClasse=-200 PHASE) — ADR-V2-050.
   * Endpoint: POST /tasks com idClasse no body.
   *
   * Para sub-fase, passe `idPai` = id da fase pai (o backend valida
   * que o pai existe, esta no mesmo projeto e tambem eh PHASE).
   *
   * Campos task-especificos (assigneeId, sprintId, priority, taskType)
   * sao ignorados silenciosamente pelo backend quando idClasse=-200
   * (com logger.warn na telemetria backend).
   */
  create: async (input: {
    projectId: string;
    nome: string;
    descricao?: string;
    idPai?: string;
  }): Promise<Phase> => {
    const { data } = await api.post(ENDPOINTS.TASKS, {
      projectId: input.projectId,
      nome: input.nome,
      descricao: input.descricao,
      idPai: input.idPai,
      idClasse: PHASE_CLASSE_KEY,
    });
    return mapPhase(data);
  },

  /**
   * Soft-delete de uma fase (ADR-V2-047 / ADR-V2-050).
   *
   * Backend (`TasksService.delete`) detecta automaticamente que a task eh
   * uma PHASE (idClasse=-200) e aplica cascata via `phaseHierarchy.
   * softDeleteCascade(taskId)` — marca a fase + TODOS os descendentes
   * (sub-fases e tasks folha) como `excluido=true`. Emite evento
   * `phase.deleted` (webhook) com `{ phaseId, projectId, cascade,
   * affected }` apos commit.
   *
   * Endpoint retorna 204 No Content (void) — frontend nao recebe a
   * contagem de afetados. Para mostrar previa de impacto antes de
   * deletar, o componente DeletePhaseDialog combina metricas
   * (usePhaseMetrics) + contagem de sub-fases ja calculada no parent.
   */
  delete: async (phaseId: string): Promise<void> => {
    await api.delete(`${ENDPOINTS.TASKS}/${phaseId}`);
  },
};

import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type { ActivityEvent, ActivityEventType } from "@/types/intention";

export interface ActivityQueryParams {
  cursor?: string;
  limit?: number;
}

interface V2ActivityItem {
  id: string;
  tipo: string;
  metaDados: Record<string, unknown> | null;
  criadoEm: string;
}

interface V2ActivityResponse {
  items: V2ActivityItem[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

// V2 emite tipos como "task.created", "task.status_changed", etc.
// O ActivityEventType do frontend so aceita "intention.*". Mapeamos abaixo.
const V2_TO_FRONTEND_TYPE: Record<string, ActivityEventType> = {
  "task.created": "intention.created",
  "task.deleted": "intention.cancelled",
};

const STATUS_TO_TYPE: Record<string, ActivityEventType> = {
  READY: "intention.ready",
  EXECUTING: "intention.executing",
  DONE: "intention.completed",
  FAILED: "intention.failed",
  CANCELLED: "intention.cancelled",
  DISCARDED: "intention.discarded",
  VALIDATING: "intention.validating",
  VALIDATED: "intention.validated",
};

function mapTipo(
  tipo: string,
  meta: Record<string, unknown> | null,
): ActivityEventType {
  if (V2_TO_FRONTEND_TYPE[tipo]) return V2_TO_FRONTEND_TYPE[tipo];

  // V2 emite "task.status_changed" — derivar do metaDados.toStatus
  if (tipo === "task.status_changed" && meta?.toStatus) {
    const mapped = STATUS_TO_TYPE[String(meta.toStatus)];
    if (mapped) return mapped;
  }

  return "intention.created";
}

function mapEvent(raw: V2ActivityItem, projectId: string): ActivityEvent {
  const meta = raw.metaDados ?? {};
  return {
    id: String(raw.id),
    tipo: mapTipo(raw.tipo, meta),
    projectSlug: projectId,
    intentionTitle: String(
      meta.intentionTitle ?? meta.taskTitle ?? meta.nome ?? "Sem titulo",
    ),
    intentionId: String(meta.intentionId ?? meta.taskId ?? ""),
    timestamp: raw.criadoEm,
    details: {
      actorName: meta.actorName ? String(meta.actorName) : undefined,
      prUrl: meta.prUrl ? String(meta.prUrl) : undefined,
      motivo: meta.motivo ? String(meta.motivo) : undefined,
    },
  };
}

export const activityApi = {
  /**
   * Busca timeline de atividade de um projeto (V2 /projects/:id/activity).
   *
   * V2 retorna `{ items: V2ActivityItem[], pagination: {...} }`.
   * Cada item vem como DEvento bruto (tipo, metaDados, criadoEm) —
   * traduzimos pro shape ActivityEvent que o UI espera.
   */
  getProjectActivity: async (
    projectId: string,
    params?: ActivityQueryParams,
  ): Promise<{
    events: ActivityEvent[];
    hasMore: boolean;
    nextCursor: string | null;
    projectId: string;
  }> => {
    const { data } = await api.get<V2ActivityResponse>(
      ENDPOINTS.PROJECT_ACTIVITY(projectId),
      { params },
    );

    return {
      events: (data.items ?? []).map((e) => mapEvent(e, projectId)),
      hasMore: data.pagination?.hasMore ?? false,
      nextCursor: data.pagination?.nextCursor ?? null,
      projectId,
    };
  },
};

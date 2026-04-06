import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type { ActivityEvent } from "@/types/intention";

// ============================================================
// Types -- response shape do backend
// ============================================================

interface ProjectActivityResponse {
  projectId: string;
  projectName: string;
  events: Array<{
    id: string;
    tipo: string;
    intentionId: string | null;
    intentionTitle: string | null;
    projectSlug: string;
    timestamp: string;
    details: {
      actorName: string | null;
      actorId: string | null;
      fromStatus?: string | null;
      toStatus?: string | null;
      prUrl?: string | null;
      motivo?: string | null;
    };
  }>;
  total: number;
  hasMore: boolean;
}

export interface ActivityQueryParams {
  limit?: number;
  tipo?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================
// API Client
// ============================================================

export const activityApi = {
  /**
   * Busca timeline de atividade de um projeto especifico
   */
  getProjectActivity: async (
    projectId: string,
    params?: ActivityQueryParams,
  ): Promise<{
    events: ActivityEvent[];
    total: number;
    hasMore: boolean;
    projectId: string;
    projectName: string;
  }> => {
    const { data } = await api.get<ProjectActivityResponse>(
      ENDPOINTS.PROJECT_ACTIVITY(projectId),
      { params },
    );

    // Mapear response do backend para o tipo ActivityEvent do frontend
    const events: ActivityEvent[] = data.events.map((e) => ({
      id: e.id,
      tipo: e.tipo as ActivityEvent["tipo"],
      projectSlug: e.projectSlug,
      intentionTitle: e.intentionTitle ?? "Sem titulo",
      intentionId: e.intentionId ?? "",
      timestamp: e.timestamp,
      details: {
        actorName: e.details.actorName ?? undefined,
        prUrl: e.details.prUrl ?? undefined,
        motivo: e.details.motivo ?? undefined,
      },
    }));

    return {
      events,
      total: data.total,
      hasMore: data.hasMore,
      projectId: data.projectId,
      projectName: data.projectName,
    };
  },
};

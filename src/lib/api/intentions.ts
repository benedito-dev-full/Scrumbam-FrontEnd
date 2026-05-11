/**
 * API Client: Intentions (V2-compatible).
 *
 * Wraps V2 backend /tasks endpoint. As "intentions" do frontend sao tasks no V2.
 *
 * Mapeamentos V2:
 * - Status: enum maiusculo (INBOX/READY/EXECUTING/DONE/FAILED/CANCELLED/DISCARDED/VALIDATING/VALIDATED)
 * - Body: apenas { nome, projectId, descricao, priority, assigneeId, sprintId, rawText, source }
 * - Resposta GET /tasks: { items, pagination } (paginada)
 *
 * Campos V3 do frontend (problema, contexto, solucaoProposta, criteriosAceite, riscos,
 * taskTypeId, priorityId como DTabela chave, etc.) NAO sao suportados pelo V2 —
 * sao omitidos silenciosamente para evitar 400.
 */

import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type { Task } from "@/types/task";
import type {
  IntentionDocument,
  CreateIntentionDto,
  IntentionStatus,
  IntentionPriority,
} from "@/types/intention";
import {
  mapTaskToIntention,
  mapTasksToIntentions,
} from "@/lib/adapters/task-to-intention";

function statusToV2(status: IntentionStatus): string {
  return status.toUpperCase();
}

// Chaves DTabela (negativas) usadas no frontend → enum priority do V2.
const PRIORITY_ID_TO_V2: Record<string, string> = {
  "-424": "CRITICAL", // URGENT
  "-421": "HIGH",
  "-422": "MEDIUM",
  "-423": "LOW",
};

function priorityEnumToV2(p?: IntentionPriority): string | undefined {
  if (!p) return undefined;
  switch (p) {
    case "urgent":
      return "CRITICAL";
    case "high":
      return "HIGH";
    case "medium":
      return "MEDIUM";
    case "low":
      return "LOW";
    default:
      return undefined;
  }
}

export const intentionsApi = {
  list: async (projectId: string): Promise<IntentionDocument[]> => {
    const { data } = await api.get(ENDPOINTS.TASKS, {
      params: { projectId },
    });
    const items: Task[] = Array.isArray(data) ? data : (data?.items ?? []);
    return mapTasksToIntentions(items);
  },

  getById: async (id: string): Promise<IntentionDocument> => {
    const { data } = await api.get<Task>(ENDPOINTS.TASK(id));
    return mapTaskToIntention(data);
  },

  create: async (
    dto: CreateIntentionDto,
    projectId: string,
  ): Promise<IntentionDocument> => {
    const payload: Record<string, unknown> = {
      nome: dto.title,
      projectId,
    };
    if (dto.description) payload.descricao = dto.description;
    const prio = PRIORITY_ID_TO_V2[dto.priorityId];
    if (prio) payload.priority = prio;
    // taskTypeId nao existe no V2 (sem tipos de task) — omitido.

    const { data } = await api.post<Task>(ENDPOINTS.TASKS, payload);
    return mapTaskToIntention(data);
  },

  updateStatus: async (
    id: string,
    status: IntentionStatus,
    _extra?: { failureReason?: string },
  ): Promise<void> => {
    await api.put(ENDPOINTS.TASK_STATUS(id), { status: statusToV2(status) });
  },

  update: async (
    id: string,
    fields: Partial<IntentionDocument>,
  ): Promise<IntentionDocument> => {
    const payload: Record<string, unknown> = {};
    if (fields.title !== undefined) payload.nome = fields.title;
    if (fields.priority !== undefined) {
      const prio = priorityEnumToV2(fields.priority);
      if (prio) payload.priority = prio;
    }
    // Campos V3 (problema/contexto/criteriosAceite/etc.) sao omitidos — V2 rejeita.

    const { data } = await api.put<Task>(ENDPOINTS.TASK(id), payload);
    return mapTaskToIntention(data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.TASK(id));
  },
};

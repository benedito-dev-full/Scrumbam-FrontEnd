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
  IntentionCanal,
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

// Chaves DClasse (negativas) usadas no frontend → enum taskType do V2.
const TYPE_ID_TO_V2: Record<string, string> = {
  "-431": "FEATURE",
  "-432": "BUG",
  "-433": "IMPROVEMENT",
  "-434": "REVIEW",
  "-435": "EXPLAIN",
};

function taskTypeIdToV2(id?: string): string | undefined {
  if (!id) return undefined;
  return TYPE_ID_TO_V2[id];
}

/**
 * Mapeia canal do frontend para o enum `source` aceito pelo V2.
 * V2 aceita apenas: web | telegram | api | mcp. Demais canais (whatsapp/email/slack)
 * são descartados silenciosamente — o backend rejeitaria com 400.
 */
function canalToSource(canal?: IntentionCanal): string | undefined {
  if (!canal) return undefined;
  switch (canal) {
    case "web":
      return "web";
    case "telegram":
      return "telegram";
    case "api":
      return "api";
    case "mcp":
      return "mcp";
    default:
      return undefined;
  }
}

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

    // V2 agora suporta taskType (enum string FEATURE|BUG|IMPROVEMENT|REVIEW|EXPLAIN)
    const taskType = taskTypeIdToV2(dto.taskTypeId);
    if (taskType) payload.taskType = taskType;

    // Responsável opcional — V2 aceita `assigneeId` (string com chave DEntidade)
    if (dto.assigneeId) payload.assigneeId = dto.assigneeId;

    // Canal opcional — mapeado para enum `source`; canais não suportados são descartados
    const source = canalToSource(dto.canal);
    if (source) payload.source = source;

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
    // taskType pode ser atualizado via update (V2 expõe top-level)
    if (fields.type !== undefined) {
      const typeToV2: Record<string, string> = {
        feature: "FEATURE",
        bug: "BUG",
        improvement: "IMPROVEMENT",
        review: "REVIEW",
        analysis: "EXPLAIN",
      };
      const mapped = typeToV2[fields.type];
      if (mapped) payload.taskType = mapped;
    }
    // Campos V3 (problema/contexto/criteriosAceite/etc.) sao omitidos — V2 rejeita.

    const { data } = await api.put<Task>(ENDPOINTS.TASK(id), payload);
    return mapTaskToIntention(data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.TASK(id));
  },
};

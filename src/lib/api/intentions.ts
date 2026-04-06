/**
 * API Client: Intentions
 *
 * Wraps the backend /tasks endpoint for the V3 intentions model.
 * Uses adapters to convert between backend Task shape and frontend IntentionDocument.
 */

import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type { Task } from "@/types/task";
import type {
  IntentionDocument,
  CreateIntentionDto,
  IntentionStatus,
} from "@/types/intention";
import {
  mapTaskToIntention,
  mapTasksToIntentions,
} from "@/lib/adapters/task-to-intention";
import {
  mapCreateIntentionToTaskBody,
  mapIntentionUpdatesToTaskBody,
} from "@/lib/adapters/intention-to-task";

export const intentionsApi = {
  /**
   * List intentions for a project.
   * Backend uses GET /tasks?projectId=X (V3 -- all tasks are intentions).
   * When no projectId is provided, returns empty (backend requires project context).
   */
  list: async (projectId: string): Promise<IntentionDocument[]> => {
    const { data } = await api.get<Task[]>(ENDPOINTS.TASKS, {
      params: { projectId },
    });
    return mapTasksToIntentions(data);
  },

  /**
   * Get a single intention by ID.
   * Backend uses GET /tasks/:id
   */
  getById: async (id: string): Promise<IntentionDocument> => {
    const { data } = await api.get<Task>(ENDPOINTS.TASK(id));
    return mapTaskToIntention(data);
  },

  /**
   * Create a new intention.
   * Backend uses POST /tasks with intention fields (V3).
   */
  create: async (
    dto: CreateIntentionDto,
    projectId: string,
  ): Promise<IntentionDocument> => {
    const body = mapCreateIntentionToTaskBody(dto, projectId);
    const { data } = await api.post<Task>(ENDPOINTS.TASKS, body);
    return mapTaskToIntention(data);
  },

  /**
   * Update intention status.
   * Busca os status reais do projeto (IDs variam!) e resolve code → ID.
   */
  updateStatus: async (
    id: string,
    status: IntentionStatus,
    _extra?: { failureReason?: string },
  ): Promise<void> => {
    // 1. Buscar a task para saber o projectId
    const { data: task } = await api.get(ENDPOINTS.TASK(id));
    const projectId =
      task.projectId ?? task.idProject ?? task.project?.id ?? "";

    // 2. Buscar status reais do projeto
    const { data: statuses } = await api.get<
      Array<{ id: string; code: string; name: string }>
    >("/workflow-statuses", { params: { projectId } });

    // 3. Resolver code → ID real
    const targetStatus = statuses.find(
      (s) =>
        s.code === status ||
        s.code === status.replace("done", "done_intention"),
    );

    if (!targetStatus) {
      throw new Error(`Status "${status}" nao encontrado no projeto`);
    }

    await api.put(ENDPOINTS.TASK_STATUS(id), { statusId: targetStatus.id });
  },

  /**
   * Update intention fields.
   * Backend uses PUT /tasks/:id with partial update body.
   */
  update: async (
    id: string,
    fields: Partial<IntentionDocument>,
  ): Promise<IntentionDocument> => {
    const body = mapIntentionUpdatesToTaskBody(fields);
    const { data } = await api.put<Task>(ENDPOINTS.TASK(id), body);
    return mapTaskToIntention(data);
  },

  /**
   * Delete intention (soft delete).
   * Backend uses DELETE /tasks/:id
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.TASK(id));
  },
};

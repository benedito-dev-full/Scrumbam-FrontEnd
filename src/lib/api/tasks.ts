import api from "./client";
import { ENDPOINTS } from "./endpoints";
import { mapApiTask, mapApiTasks } from "@/lib/adapters/api-task-adapter";
import type { Task, CreateTaskDto, UpdateTaskDto } from "@/types";

// V2 contract: GET /tasks aceita apenas projectId, status (enum V3), assigneeId, sprintId, cursor, limit.
// Status V3 enum: INBOX|READY|EXECUTING|DONE|FAILED|CANCELLED|DISCARDED|VALIDATING|VALIDATED
// Filtros legacy (priorityId, taskTypeId, tag, search) nao existem no V2.
export interface TaskFilters {
  status?: string; // enum V3, ex: "INBOX"
  assigneeId?: string;
  sprintId?: string;
  cursor?: string;
  limit?: number;
}

export interface MoveStatusResult {
  data: Task;
  wipWarning?: string;
}

export const tasksApi = {
  listByProject: async (
    projectId: string,
    filters?: TaskFilters,
  ): Promise<Task[]> => {
    const params: Record<string, string | number> = { projectId };
    if (filters) {
      if (filters.status) params.status = filters.status;
      if (filters.assigneeId) params.assigneeId = filters.assigneeId;
      if (filters.sprintId) params.sprintId = filters.sprintId;
      if (filters.cursor) params.cursor = filters.cursor;
      if (filters.limit !== undefined) params.limit = filters.limit;
    }
    const { data } = await api.get(ENDPOINTS.TASKS, { params });
    // V2 retorna { items, pagination } — legacy retornava array
    const items = Array.isArray(data) ? data : (data?.items ?? []);
    return mapApiTasks(items);
  },

  create: async (dto: CreateTaskDto): Promise<Task> => {
    // V2 CreateTaskDto: nome (obrigatorio), projectId (obrigatorio), descricao?, priority?, assigneeId?, sprintId?, rawText?, source?
    // priority eh enum 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL' — nao usa idPrioridade
    const payload: Record<string, unknown> = {
      nome: dto.titulo ?? dto.name,
      projectId: dto.idProject ?? dto.projectId,
      descricao: dto.descricao ?? dto.description,
      assigneeId: dto.idAssignee ?? dto.assigneeId,
      sprintId: dto.idSprint ?? dto.sprintId,
    };

    // priority: aceita string enum direto; ignora idPrioridade (chave DTabela)
    const priorityEnum = (dto as { priority?: string }).priority;
    if (priorityEnum) payload.priority = priorityEnum;

    // Remove campos undefined (V2 com forbidNonWhitelisted: extras causam 400)
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    const { data } = await api.post(ENDPOINTS.TASKS, payload);
    return mapApiTask(data);
  },

  update: async (taskId: string, dto: UpdateTaskDto): Promise<Task> => {
    // V2 UpdateTaskDto: nome?, descricao?, priority?, assigneeId?
    // Para status use moveStatus(); para sprint use moveSprint() (PUT /tasks/:id/sprint).
    const payload: Record<string, unknown> = {
      nome: dto.titulo ?? dto.name,
      descricao: dto.descricao ?? dto.description,
      assigneeId: dto.idAssignee ?? dto.assigneeId,
    };

    const priorityEnum = (dto as { priority?: string }).priority;
    if (priorityEnum) payload.priority = priorityEnum;

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    const { data } = await api.put(ENDPOINTS.TASK(taskId), payload);
    return mapApiTask(data);
  },

  /**
   * Move task entre estados V3 (state machine).
   *
   * V2 espera status como enum V3 (INBOX|READY|EXECUTING|DONE|FAILED|CANCELLED|DISCARDED|VALIDATING|VALIDATED).
   * Se o UI ainda envia chave de DTabela (legacy column), backend rejeita com 400.
   */
  moveStatus: async (
    taskId: string,
    status: string,
  ): Promise<MoveStatusResult> => {
    const response = await api.put(ENDPOINTS.TASK_STATUS(taskId), { status });
    return {
      data: mapApiTask(response.data),
      wipWarning: response.headers["x-wip-warning"] as string | undefined,
    };
  },

  /**
   * Stub — V2 nao suporta reorder por enquanto.
   */
  reorder: async (
    _projectId: string,
    _items: Array<{ chave: string; ordem: number }>,
  ): Promise<void> => {
    // No-op: V2 nao tem endpoint /projects/:id/tasks/reorder.
    return;
  },

  delete: async (taskId: string): Promise<void> => {
    await api.delete(ENDPOINTS.TASK(taskId));
  },

  /**
   * Stub — V2 nao suporta tags por task.
   */
  addTag: async (taskId: string, _tagId: string): Promise<Task> => {
    const { data } = await api.get(ENDPOINTS.TASK(taskId));
    return mapApiTask(data);
  },

  /**
   * Stub — V2 nao suporta tags por task.
   */
  removeTag: async (taskId: string, _tagId: string): Promise<Task> => {
    const { data } = await api.get(ENDPOINTS.TASK(taskId));
    return mapApiTask(data);
  },
};

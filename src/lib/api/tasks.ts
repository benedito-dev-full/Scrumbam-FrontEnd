import api from "./client";
import { ENDPOINTS } from "./endpoints";
import { mapApiTask, mapApiTasks } from "@/lib/adapters/api-task-adapter";
import type { Task, CreateTaskDto, UpdateTaskDto } from "@/types";

export interface TaskFilters {
  statusId?: string;
  assigneeId?: string;
  sprintId?: string;
  priorityId?: string;
  taskTypeId?: string;
  tag?: string;
  search?: string;
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
    // Remove undefined values from filters
    const params: Record<string, string> = { projectId };
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params[key] = value;
        }
      });
    }
    const { data } = await api.get(ENDPOINTS.TASKS, {
      params,
    });
    return mapApiTasks(data);
  },

  create: async (dto: CreateTaskDto): Promise<Task> => {
    // Mapear campos PT do frontend para EN do backend
    const payload: Record<string, unknown> = {
      name: dto.titulo ?? dto.name,
      projectId: dto.idProject ?? dto.projectId,
      description: dto.descricao ?? dto.description,
      statusId: dto.idStatus ?? dto.statusId,
      assigneeId: dto.idAssignee ?? dto.assigneeId,
      priorityId: dto.idPrioridade ?? dto.priorityId,
      taskTypeId: dto.idTipoTask ?? dto.taskTypeId,
      sprintId: dto.idSprint ?? dto.sprintId,
      storyPoints: dto.storyPoints,
      order: dto.order,
      // Campos V3 mantêm o mesmo nome
      problema: dto.problema,
      contexto: dto.contexto,
      solucaoProposta: dto.solucaoProposta,
      criteriosAceite: dto.criteriosAceite,
      naoObjetivos: dto.naoObjetivos,
      riscos: dto.riscos,
      canalId: dto.canalId,
      hillPosition: dto.hillPosition,
    };

    // Remover campos undefined
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    const { data } = await api.post(ENDPOINTS.TASKS, payload);
    return mapApiTask(data);
  },

  update: async (taskId: string, dto: UpdateTaskDto): Promise<Task> => {
    // Mapear campos PT do frontend para EN do backend
    const payload: Record<string, unknown> = {
      name: dto.titulo ?? dto.name,
      description: dto.descricao ?? dto.description,
      assigneeId: dto.idAssignee ?? dto.assigneeId,
      priorityId: dto.idPrioridade ?? dto.priorityId,
      taskTypeId: dto.idTipoTask ?? dto.taskTypeId,
      storyPoints: dto.estimativaHoras ?? dto.storyPoints,
      order: dto.order,
      // Campos V3 mantêm o mesmo nome
      problema: dto.problema,
      contexto: dto.contexto,
      solucaoProposta: dto.solucaoProposta,
      criteriosAceite: dto.criteriosAceite,
      naoObjetivos: dto.naoObjetivos,
      riscos: dto.riscos,
      canalId: dto.canalId,
      hillPosition: dto.hillPosition,
      // Deliverables
      prUrl: dto.prUrl,
      deliverySummary: dto.deliverySummary,
      filesChanged: dto.filesChanged,
      failureReason: dto.failureReason,
    };

    // Remover campos undefined (nao enviar campos nao alterados)
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    const { data } = await api.put(ENDPOINTS.TASK(taskId), payload);
    return mapApiTask(data);
  },

  moveStatus: async (
    taskId: string,
    idStatus: string,
  ): Promise<MoveStatusResult> => {
    const response = await api.put(ENDPOINTS.TASK_STATUS(taskId), {
      statusId: idStatus,
    });
    return {
      data: mapApiTask(response.data),
      wipWarning: response.headers["x-wip-warning"] as string | undefined,
    };
  },

  reorder: async (
    projectId: string,
    items: Array<{ chave: string; ordem: number }>,
  ): Promise<void> => {
    await api.put(ENDPOINTS.PROJECT_TASKS_REORDER(projectId), { items });
  },

  delete: async (taskId: string): Promise<void> => {
    await api.delete(ENDPOINTS.TASK(taskId));
  },

  addTag: async (taskId: string, tagId: string): Promise<Task> => {
    const { data } = await api.post(ENDPOINTS.TASK_TAGS(taskId), {
      tagId,
    });
    return mapApiTask(data);
  },

  removeTag: async (taskId: string, tagId: string): Promise<Task> => {
    const { data } = await api.delete(ENDPOINTS.TASK_TAG(taskId, tagId));
    return mapApiTask(data);
  },
};

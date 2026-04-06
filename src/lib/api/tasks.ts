import api from "./client";
import { ENDPOINTS } from "./endpoints";
import { mapApiTask, mapApiTasks } from "@/lib/adapters/api-task-adapter";
import type { Task, CreateTaskDto, UpdateTaskDto } from "@/types";

export interface TaskFilters {
  idStatus?: string;
  idAssignee?: string;
  idSprint?: string;
  idPrioridade?: string;
  idTipoTask?: string;
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
    const params: Record<string, string> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params[key] = value;
        }
      });
    }
    const { data } = await api.get(ENDPOINTS.PROJECT_TASKS(projectId), {
      params,
    });
    return mapApiTasks(data);
  },

  create: async (dto: CreateTaskDto): Promise<Task> => {
    const { data } = await api.post(ENDPOINTS.TASKS, dto);
    return mapApiTask(data);
  },

  update: async (taskId: string, dto: UpdateTaskDto): Promise<Task> => {
    const { data } = await api.put(ENDPOINTS.TASK(taskId), dto);
    return mapApiTask(data);
  },

  moveStatus: async (
    taskId: string,
    idStatus: string,
  ): Promise<MoveStatusResult> => {
    const response = await api.put(ENDPOINTS.TASK_STATUS(taskId), {
      idStatus,
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

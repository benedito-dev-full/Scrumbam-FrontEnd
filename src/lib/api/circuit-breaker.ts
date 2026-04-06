import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type { Task } from "@/types";

export interface CircuitBreakerEntry {
  taskId: string;
  titulo: string;
  apetiteDias: number;
  apetiteInicio: string;
  diasDecorridos: number;
  estourado: boolean;
}

export const circuitBreakerApi = {
  list: async (projectId: string): Promise<CircuitBreakerEntry[]> => {
    const { data } = await api.get<CircuitBreakerEntry[]>(
      ENDPOINTS.CIRCUIT_BREAKER_PROJECT(projectId),
    );
    return data;
  },

  setAppetite: async (taskId: string, dias: number): Promise<Task> => {
    const { data } = await api.put<Task>(ENDPOINTS.TASK_APPETITE(taskId), {
      dias,
    });
    return data;
  },

  extend: async (
    taskId: string,
    dias: number,
    justificativa: string,
  ): Promise<Task> => {
    const { data } = await api.put<Task>(
      ENDPOINTS.TASK_APPETITE_EXTEND(taskId),
      { dias, justificativa },
    );
    return data;
  },
};

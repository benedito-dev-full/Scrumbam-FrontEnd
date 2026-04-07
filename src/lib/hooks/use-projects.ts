"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectsApi } from "@/lib/api/projects";
import { useAuthStore } from "@/lib/stores/auth-store";
import { columnsApi } from "@/lib/api/columns";
import { tasksApi, type TaskFilters } from "@/lib/api/tasks";
import { tagsApi } from "@/lib/api/tags";
import { QUERY_KEYS } from "@/lib/constants";
import type {
  Task,
  CreateTaskDto,
  CreateColumnDto,
  UpdateColumnDto,
} from "@/types";

// ---- Projects ----

export function useProjects() {
  const orgId = useAuthStore((s) => s.user?.orgId);
  return useQuery({
    queryKey: [...QUERY_KEYS.projects, orgId],
    queryFn: () => projectsApi.list(orgId || undefined),
    enabled: !!orgId,
  });
}

export function useProjectSummaries(organizationId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.projectSummaries(organizationId),
    queryFn: () => projectsApi.getSummaries(organizationId),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 min cache
  });
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.project(id ?? ""),
    queryFn: () => projectsApi.getById(id!),
    enabled: !!id,
  });
}

// ---- Columns ----

export function useColumns(projectId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.columns(projectId ?? ""),
    queryFn: () => columnsApi.list(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateColumn(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateColumnDto) => columnsApi.create(projectId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.columns(projectId),
      });
      toast.success("Coluna criada");
    },
    onError: () => {
      toast.error("Erro ao criar coluna");
    },
  });
}

export function useUpdateColumn(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      columnId,
      dto,
    }: {
      columnId: string;
      dto: UpdateColumnDto;
    }) => columnsApi.update(projectId, columnId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.columns(projectId),
      });
      toast.success("Coluna atualizada");
    },
    onError: () => {
      toast.error("Erro ao atualizar coluna");
    },
  });
}

export function useDeleteColumn(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      columnId,
      targetColumnId,
    }: {
      columnId: string;
      targetColumnId: string;
    }) => columnsApi.delete(projectId, columnId, targetColumnId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.columns(projectId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks(projectId) });
      toast.success("Coluna removida");
    },
    onError: () => {
      toast.error("Erro ao remover coluna");
    },
  });
}

// ---- Tasks ----

export function useTasks(projectId: string | null, filters?: TaskFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.tasks(
      projectId ?? "",
      filters as Record<string, string | undefined>,
    ),
    queryFn: () => tasksApi.listByProject(projectId!, filters),
    enabled: !!projectId,
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTaskDto) => tasksApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks(projectId) });
      toast.success("Intenção criada");
    },
    onError: () => {
      toast.error("Erro ao criar intenção");
    },
  });
}

export function useMoveTaskStatus(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, idStatus }: { taskId: string; idStatus: string }) =>
      tasksApi.moveStatus(taskId, idStatus),
    // Optimistic update: move task locally before API confirms
    onMutate: async ({ taskId, idStatus }) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.tasks(projectId),
      });

      const queryCache = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks", projectId],
      });

      // Snapshot all task queries for this project
      const snapshots: Array<{
        queryKey: readonly unknown[];
        data: Task[] | undefined;
      }> = [];
      for (const [queryKey, data] of queryCache) {
        snapshots.push({ queryKey, data });
        if (data) {
          queryClient.setQueryData(
            queryKey,
            data.map((t) =>
              t.chave === taskId
                ? { ...t, status: { ...t.status, chave: idStatus } }
                : t,
            ),
          );
        }
      }

      return { snapshots };
    },
    onSuccess: (result) => {
      if (result.wipWarning) {
        toast.warning(result.wipWarning);
      }
    },
    onError: (_error, _variables, context) => {
      // Rollback
      if (context?.snapshots) {
        for (const { queryKey, data } of context.snapshots) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      const errorMsg =
        (_error as { response?: { status?: number } })?.response?.status === 409
          ? "WIP limit atingido -- coluna bloqueada"
          : "Erro ao mover intenção";
      toast.error(errorMsg);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks(projectId) });
    },
  });
}

export function useReorderTasks(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: Array<{ chave: string; ordem: number }>) =>
      tasksApi.reorder(projectId, items),
    // Optimistic: reorder handled locally before calling mutation
    onError: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks(projectId) });
      toast.error("Erro ao reordenar intenções");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks(projectId) });
    },
  });
}

// ---- Tags ----

export function useTags() {
  return useQuery({
    queryKey: QUERY_KEYS.tags,
    queryFn: tagsApi.list,
  });
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tasksApi } from "@/lib/api/tasks";
import { commentsApi } from "@/lib/api/comments";
import { circuitBreakerApi } from "@/lib/api/circuit-breaker";
import { tagsApi } from "@/lib/api/tags";
import { QUERY_KEYS } from "@/lib/constants";
import type { UpdateTaskDto, CreateCommentDto, CreateTagDto } from "@/types";
import { isAxiosError } from "axios";

// ---- Task Update ----

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, dto }: { taskId: string; dto: UpdateTaskDto }) =>
      tasksApi.update(taskId, dto),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks(projectId) });
    },
    onError: () => {
      toast.error("Erro ao atualizar intenção");
    },
  });
}

export function useMoveTaskStatusFromDetail(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, idStatus }: { taskId: string; idStatus: string }) =>
      tasksApi.moveStatus(taskId, idStatus),
    onSuccess: (result) => {
      if (result.wipWarning) {
        toast.warning(result.wipWarning);
      } else {
        toast.success("Status atualizado");
      }
    },
    onError: (error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status === 409) {
        toast.error("WIP limit atingido -- coluna bloqueada");
      } else {
        toast.error("Erro ao mover intenção");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks(projectId) });
    },
  });
}

// ---- Comments ----

export function useComments(taskId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.comments(taskId ?? ""),
    queryFn: () => commentsApi.list(taskId!),
    enabled: !!taskId,
    retry: 1,
  });
}

export function useAddComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCommentDto) => commentsApi.add(taskId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.comments(taskId),
      });
    },
    onError: () => {
      toast.error("Erro ao adicionar comentario");
    },
  });
}

// ---- Tags ----

export function useAddTag(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, tagId }: { taskId: string; tagId: string }) =>
      tasksApi.addTag(taskId, tagId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks(projectId) });
    },
    onError: () => {
      toast.error("Erro ao adicionar tag");
    },
  });
}

export function useRemoveTag(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, tagId }: { taskId: string; tagId: string }) =>
      tasksApi.removeTag(taskId, tagId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks(projectId) });
    },
    onError: () => {
      toast.error("Erro ao remover tag");
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTagDto) => tagsApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
    },
    onError: () => {
      toast.error("Erro ao criar tag");
    },
  });
}

// ---- Circuit Breaker ----

export function useSetAppetite(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, dias }: { taskId: string; dias: number }) =>
      circuitBreakerApi.setAppetite(taskId, dias),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks(projectId) });
      toast.success("Apetite definido");
    },
    onError: () => {
      toast.error("Erro ao definir apetite");
    },
  });
}

export function useExtendAppetite(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      dias,
      justificativa,
    }: {
      taskId: string;
      dias: number;
      justificativa: string;
    }) => circuitBreakerApi.extend(taskId, dias, justificativa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks(projectId) });
      toast.success("Apetite estendido");
    },
    onError: () => {
      toast.error("Erro ao estender apetite");
    },
  });
}

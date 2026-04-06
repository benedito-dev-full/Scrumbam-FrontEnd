"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/constants";
import { retrospectiveApi } from "@/lib/api/retrospective";
import type { CreateFeedbackDto } from "@/types";

const STALE_TIME = 2 * 60 * 1000; // 2 minutes

// ---- Retrospective ----

export function useRetrospective(
  projectId: string | undefined,
  period: number = 14,
) {
  return useQuery({
    queryKey: QUERY_KEYS.retrospective(projectId ?? "", period),
    queryFn: () => retrospectiveApi.getRetrospective(projectId!, period),
    enabled: !!projectId,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useAddFeedback(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, dto }: { taskId: string; dto: CreateFeedbackDto }) =>
      retrospectiveApi.addFeedback(taskId, dto),
    onSuccess: () => {
      // Invalidate all retrospective queries for this project
      queryClient.invalidateQueries({
        queryKey: ["retrospective", projectId],
      });
      toast.success("Feedback adicionado");
    },
    onError: () => {
      toast.error("Erro ao adicionar feedback");
    },
  });
}

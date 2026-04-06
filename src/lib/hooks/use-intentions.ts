"use client";

import { useMemo, useCallback } from "react";
import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  IntentionDocument,
  IntentionFilters,
  IntentionStatus,
  CreateIntentionDto,
} from "@/types/intention";
import { intentionsApi } from "@/lib/api/intentions";
import { QUERY_KEYS } from "@/lib/constants";
import { useProjects } from "@/lib/hooks/use-projects";

// ============================================================
// useDefaultProjectId -- resolve a default projectId when none is provided
// ============================================================

function useDefaultProjectId(): string | null {
  const { data: projects } = useProjects();
  if (!projects || projects.length === 0) return null;
  return projects[0].chave;
}

// ============================================================
// useIntentions -- lista filtrada de intencoes (V3 -- API real)
// ============================================================

export function useIntentions(filters?: IntentionFilters) {
  const { data: projects } = useProjects();
  const defaultProjectId = useDefaultProjectId();
  const isAll = !filters?.projectSlug || filters.projectSlug === "all";
  const singleProjectId = !isAll ? filters.projectSlug : defaultProjectId;

  // When "all": fetch intentions from every project in parallel
  const allProjectIds = isAll
    ? (projects ?? []).map((p) => p.chave).filter(Boolean)
    : [];

  const allQueries = useQueries({
    queries: allProjectIds.map((pid) => ({
      queryKey: QUERY_KEYS.intentions.list(pid),
      queryFn: () => intentionsApi.list(pid),
      staleTime: 30 * 1000,
      enabled: isAll && allProjectIds.length > 0,
    })),
  });

  // Single-project query (when a specific project is selected)
  const singleQuery = useQuery({
    queryKey: QUERY_KEYS.intentions.list(singleProjectId ?? ""),
    queryFn: () => intentionsApi.list(singleProjectId!),
    enabled: !isAll && !!singleProjectId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const query = isAll
    ? {
        data: allQueries.flatMap((q) => q.data ?? []),
        isLoading: allQueries.some((q) => q.isLoading),
      }
    : { data: singleQuery.data, isLoading: singleQuery.isLoading };

  // Apply client-side filters (status, type, priority, canal)
  const data = useMemo(() => {
    let result = query.data ?? [];

    if (filters?.status && filters.status !== "all") {
      result = result.filter((i) => i.status === filters.status);
    }
    if (filters?.type && filters.type !== "all") {
      result = result.filter((i) => i.type === filters.type);
    }
    if (filters?.priority && filters.priority !== "all") {
      result = result.filter((i) => i.priority === filters.priority);
    }
    if (filters?.canal && filters.canal !== "all") {
      result = result.filter((i) => i.canal === filters.canal);
    }

    if (filters?.searchTerm && filters.searchTerm.trim().length > 0) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(term) ||
          i.problema.toLowerCase().includes(term) ||
          (i.contexto && i.contexto.toLowerCase().includes(term)) ||
          (i.solucaoProposta && i.solucaoProposta.toLowerCase().includes(term)),
      );
    }

    return result;
  }, [query.data, filters]);

  // Group by status V3
  const grouped = useMemo(() => {
    const groups: Record<string, IntentionDocument[]> = {
      inbox: [],
      ready: [],
      executing: [],
      done: [],
      validating: [],
      validated: [],
      failed: [],
      cancelled: [],
      discarded: [],
    };
    for (const item of data) {
      if (groups[item.status]) {
        groups[item.status].push(item);
      }
    }
    return groups;
  }, [data]);

  return { data, grouped, isLoading: query.isLoading };
}

// ============================================================
// useIntention -- intencao individual por ID (V3 -- API real)
// ============================================================

export function useIntention(id: string) {
  const query = useQuery({
    queryKey: QUERY_KEYS.intentions.detail(id),
    queryFn: () => intentionsApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });

  return { data: query.data ?? null, isLoading: query.isLoading };
}

// ============================================================
// useCreateIntention -- cria nova intencao (V3 -- API real)
// ============================================================

export function useCreateIntention() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (dto: CreateIntentionDto): Promise<IntentionDocument> => {
      if (!dto.projectId) {
        throw new Error("Projeto e obrigatorio para criar intencao");
      }
      return intentionsApi.create(dto, dto.projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["intentions"],
      });
      toast.success("Intencao criada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar intencao: ${error.message}`);
    },
  });

  return {
    mutate: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

// ============================================================
// useUpdateIntention -- atualiza campos de uma intencao (V3 -- API real)
// ============================================================

export function useUpdateIntention() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      intentionId,
      updates,
    }: {
      intentionId: string;
      updates: Partial<IntentionDocument>;
    }) => {
      return intentionsApi.update(intentionId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intentions"] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const update = useCallback(
    (intentionId: string, updates: Partial<IntentionDocument>) => {
      mutation.mutate({ intentionId, updates });
    },
    [mutation],
  );

  return { update };
}

// ============================================================
// useMoveToReady -- move intencao de INBOX para READY (V3 -- API real)
// ============================================================

export function useMoveToReady() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (intentionId: string) => {
      return intentionsApi.updateStatus(
        intentionId,
        "ready" as IntentionStatus,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intentions"] });
      toast.success("Intencao movida para Ready");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao mover para Ready: ${error.message}`);
    },
  });

  const move = useCallback(
    (intentionId: string) => {
      mutation.mutate(intentionId);
    },
    [mutation],
  );

  return { move };
}

// ============================================================
// useDiscardIntention -- descarta intencao com motivo (V3 -- API real)
// ============================================================

export function useDiscardIntention() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      intentionId,
      motivo,
    }: {
      intentionId: string;
      motivo: string;
    }) => {
      return intentionsApi.updateStatus(
        intentionId,
        "discarded" as IntentionStatus,
        { failureReason: motivo },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intentions"] });
      toast.success("Intencao descartada");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao descartar: ${error.message}`);
    },
  });

  const discard = useCallback(
    (intentionId: string, motivo: string) => {
      mutation.mutate({ intentionId, motivo });
    },
    [mutation],
  );

  return { discard };
}

// ============================================================
// useMoveStatus -- move intencao para qualquer status (V3 -- API real)
// ============================================================

export function useMoveStatus() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      intentionId,
      status,
    }: {
      intentionId: string;
      status: IntentionStatus;
    }) => {
      return intentionsApi.updateStatus(intentionId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intentions"] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao mover: ${error.message}`);
    },
  });

  const move = useCallback(
    (intentionId: string, status: IntentionStatus) => {
      mutation.mutate({ intentionId, status });
    },
    [mutation],
  );

  return { move, isPending: mutation.isPending };
}

// ============================================================
// useDeleteIntention -- exclui intencao (soft delete) (V3 -- API real)
// ============================================================

export function useDeleteIntention() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (intentionId: string) => {
      return intentionsApi.delete(intentionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intentions"] });
      toast.success("Intenção excluída");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  const remove = useCallback(
    (intentionId: string) => {
      mutation.mutate(intentionId);
    },
    [mutation],
  );

  return { remove, isPending: mutation.isPending };
}

// ============================================================
// useUpdateHillPosition -- atualiza posicao no hill chart (V3 -- API real)
// ============================================================

export function useUpdateHillPosition() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      intentionId,
      position,
    }: {
      intentionId: string;
      position: number;
    }) => {
      const clamped = Math.max(0, Math.min(100, Math.round(position)));
      return intentionsApi.update(intentionId, { hillPosition: clamped });
    },
    onMutate: async ({ intentionId, position }) => {
      const clamped = Math.max(0, Math.min(100, Math.round(position)));

      // Optimistic update for responsive UX
      queryClient.setQueriesData<IntentionDocument[]>(
        { queryKey: ["intentions"] },
        (old) => {
          if (!old) return old;
          return old.map((i) =>
            i.id === intentionId ? { ...i, hillPosition: clamped } : i,
          );
        },
      );
    },
  });

  const update = useCallback(
    (intentionId: string, position: number) => {
      mutation.mutate({ intentionId, position });
    },
    [mutation],
  );

  return { update };
}

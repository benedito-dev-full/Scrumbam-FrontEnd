"use client";

/**
 * Hooks React Query para Fases (DTask idClasse=-200 PHASE).
 *
 * ADR-V2-047: 3 hooks para a aba Issues do projeto.
 *   usePhases           — lista fases de um projeto (sempre carregado)
 *   usePhaseMetrics     — metricas de uma fase (sempre carregado, para barra)
 *   usePhaseTasksCritical — tasks criticas (lazy — so quando bloco expandido)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { phasesApi, type Phase } from "@/lib/api/phases";
import { QUERY_KEYS } from "@/lib/constants";

/**
 * Lista todas as fases de um projeto.
 * Refetch a cada 60s (fases mudam raramente).
 */
export function usePhases(projectId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.phases.list(projectId),
    queryFn: () => phasesApi.listByProject(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
}

/**
 * Metricas de progresso de uma fase.
 * Sempre carregado (mesmo com bloco fechado) para mostrar a barra de progresso.
 * Refetch a cada 30s (metricas mudam ao mover tasks).
 */
export function usePhaseMetrics(phaseId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.phases.metrics(phaseId),
    queryFn: () => phasesApi.getMetrics(phaseId),
    enabled: !!phaseId,
    staleTime: 30 * 1000,
  });
}

/**
 * Tasks criticas (EXECUTING + FAILED) de uma fase.
 * Carregamento lazy — TanStack Query so dispara o fetch quando enabled=true.
 * Refetch a cada 15s quando expandido (tasks mudam mais frequentemente).
 */
export function usePhaseTasksCritical(
  phaseId: string,
  options: { enabled: boolean },
) {
  return useQuery({
    queryKey: QUERY_KEYS.phases.criticalTasks(phaseId),
    queryFn: () => phasesApi.getCriticalTasks(phaseId),
    enabled: options.enabled && !!phaseId,
    staleTime: 15 * 1000,
  });
}

/**
 * Todas as tasks de uma fase (sem filtro de status).
 * Usado no drill-in para agrupar tasks por status.
 */
export function usePhaseAllTasks(
  phaseId: string,
  options: { enabled: boolean } = { enabled: true },
) {
  return useQuery({
    queryKey: QUERY_KEYS.phases.allTasks(phaseId),
    queryFn: () => phasesApi.listAllTasksOfPhase(phaseId),
    enabled: options.enabled && !!phaseId,
    staleTime: 15 * 1000,
  });
}

/**
 * Cria uma nova fase (ADR-V2-050) e invalida a listagem do projeto.
 *
 * Mostra toast de sucesso/erro com mensagens claras por status code
 * (400=validacao, 403=permissao, 404=projeto/pai, generico). Quando
 * mutation termina, react-query refetch da `phases.list(projectId)`
 * pega a fase nova automaticamente.
 */
export function useCreatePhase(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { nome: string; descricao?: string; idPai?: string }) =>
      phasesApi.create({ ...input, projectId }),
    onSuccess: (phase: Phase) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.phases.list(projectId),
      });
      // Invalida tambem metricas/tasks da fase pai se for sub-fase
      // (nao critico, mas garante consistencia visual imediata).
      if (phase.idPai) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.phases.metrics(phase.idPai),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.phases.allTasks(phase.idPai),
        });
      }
      toast.success(`Bloco "${phase.nome}" criado`);
    },
    onError: (error: unknown) => {
      const err = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 400) {
        toast.error(msg || "Dados invalidos para criar bloco.");
      } else if (status === 403) {
        toast.error("Sem permissao para criar blocos neste projeto.");
      } else if (status === 404) {
        toast.error(msg || "Projeto ou bloco pai nao encontrado.");
      } else {
        toast.error(err.message || "Falha ao criar bloco.");
      }
    },
  });
}

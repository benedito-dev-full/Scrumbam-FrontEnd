"use client";

/**
 * Hooks React Query para Fases (DTask idClasse=-200 PHASE).
 *
 * ADR-V2-047: 3 hooks para a aba Issues do projeto.
 *   usePhases           — lista fases de um projeto (sempre carregado)
 *   usePhaseMetrics     — metricas de uma fase (sempre carregado, para barra)
 *   usePhaseTasksCritical — tasks criticas (lazy — so quando bloco expandido)
 */

import { useQuery } from "@tanstack/react-query";
import { phasesApi } from "@/lib/api/phases";
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

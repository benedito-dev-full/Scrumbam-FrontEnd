"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  agentsApi,
  type AgentStatus,
  type CreateAgentInput,
  type CreateAgentResponse,
  type RegenerateInstallTokenResponse,
} from "@/lib/api/agents";
import { QUERY_KEYS } from "@/lib/constants";

/**
 * Lista agentes da organização atual. Auto-refresh a cada 15s para
 * atualizar status (online/offline) sem necessidade de refresh manual.
 */
export function useAgents(status?: AgentStatus) {
  return useQuery({
    queryKey: QUERY_KEYS.agents(status),
    queryFn: () => agentsApi.list(status),
    refetchInterval: 15_000, // status muda; cycle do sweeper é 30s
    staleTime: 5_000,
  });
}

/** Detalhe de um agente. */
export function useAgent(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.agent(id ?? ""),
    queryFn: () => agentsApi.get(id!),
    enabled: !!id,
    refetchInterval: 15_000,
  });
}

/**
 * Cria novo agente. Mostra toast e invalida lista. O caller exibe o
 * one-liner copiado do `data` retornado.
 */
export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation<CreateAgentResponse, unknown, CreateAgentInput>({
    mutationFn: (input) => agentsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agente cadastrado. Copie o comando para instalar na VPS.");
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Erro ao cadastrar agente";
      toast.error(msg);
    },
  });
}

/** Soft delete. */
export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: (id) => agentsApi.remove(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      qc.removeQueries({ queryKey: QUERY_KEYS.agent(id) });
      toast.success("Agente removido.");
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Erro ao remover agente";
      toast.error(msg);
    },
  });
}

/** Regenera installToken (apenas para agentes em pending_install). */
export function useRegenerateInstallToken() {
  const qc = useQueryClient();
  return useMutation<RegenerateInstallTokenResponse, unknown, string>({
    mutationFn: (id) => agentsApi.regenerateInstallToken(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.agent(id) });
      toast.success("Novo token gerado. Copie o comando atualizado.");
    },
    onError: (err) => {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 409) {
        toast.error("Agente já foi instalado, não precisa regenerar token.");
      } else {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Erro ao regenerar token";
        toast.error(msg);
      }
    },
  });
}

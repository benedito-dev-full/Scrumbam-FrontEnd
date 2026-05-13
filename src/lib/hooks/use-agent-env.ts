"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  agentEnvApi,
  type EnvStatus,
  type LinkedProjectsResponse,
  type SetAgentEnvInput,
  type SetGitBotInput,
} from "@/lib/api/agent-env";
import { QUERY_KEYS } from "@/lib/constants";

function extractErrorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { data?: { message?: unknown } } })
    ?.response;
  const msg = response?.data?.message;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg) && typeof msg[0] === "string") return msg[0];
  return fallback;
}

/**
 * Status de credenciais do agent (booleanos + timestamp da última
 * atualização). Backend NÃO devolve plaintext.
 */
export function useAgentEnvStatus(agentId: string | null) {
  return useQuery<EnvStatus>({
    queryKey: QUERY_KEYS.agentEnvStatus(agentId ?? ""),
    queryFn: () => agentEnvApi.getEnvStatus(agentId!),
    enabled: !!agentId,
    staleTime: 30_000,
  });
}

/**
 * Atualiza credenciais (GitHub PAT, Anthropic keys) no env file da VPS via
 * outbound HMAC. Invalida `agentEnvStatus` para refletir `lastEnvUpdatedAt`.
 */
export function useSetAgentEnv(agentId: string) {
  const qc = useQueryClient();
  return useMutation<void, unknown, SetAgentEnvInput>({
    mutationFn: (input) => agentEnvApi.setEnv(agentId, input),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.agentEnvStatus(agentId),
      });
      toast.success("Credenciais salvas na VPS.");
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, "Erro ao salvar credenciais"));
    },
  });
}

/**
 * Atualiza nome/email do bot Git no `~scrumban-agent/.gitconfig` da VPS.
 */
export function useSetGitBot(agentId: string) {
  const qc = useQueryClient();
  return useMutation<void, unknown, SetGitBotInput>({
    mutationFn: (input) => agentEnvApi.setGitBot(agentId, input),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.agentEnvStatus(agentId),
      });
      toast.success("Bot Git atualizado na VPS.");
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, "Erro ao atualizar bot Git"));
    },
  });
}

/**
 * Lista projetos vinculados ao agente. Endpoint pré-existente
 * (`GET /agents/:id/projects`).
 */
export function useAgentLinkedProjects(agentId: string | null) {
  return useQuery<LinkedProjectsResponse>({
    queryKey: QUERY_KEYS.agentLinkedProjects(agentId ?? ""),
    queryFn: () => agentEnvApi.listLinkedProjects(agentId!),
    enabled: !!agentId,
    staleTime: 60_000,
  });
}

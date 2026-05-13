"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deployKeyApi,
  type DeployKey,
  type RevokeDeployKeyResponse,
} from "@/lib/api/deploy-key";
import { QUERY_KEYS } from "@/lib/constants";

function extractErrorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { data?: { message?: unknown } } })
    ?.response;
  const msg = response?.data?.message;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg) && typeof msg[0] === "string") return msg[0];
  return fallback;
}

function extractErrorStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

/**
 * Lê a deploy key persistida (pubkey + fingerprint + timestamp) sem outbound.
 * Retorna `undefined` quando 404 (chave nunca gerada) — o componente decide
 * mostrar CTA "Gerar".
 */
export function useDeployKey(projectId: string, agentId: string | null) {
  return useQuery<DeployKey | null>({
    queryKey: QUERY_KEYS.deployKey(projectId, agentId ?? ""),
    queryFn: async () => {
      try {
        return await deployKeyApi.get(projectId, agentId!);
      } catch (err) {
        if (extractErrorStatus(err) === 404) return null;
        throw err;
      }
    },
    enabled: !!agentId,
    staleTime: 30_000,
  });
}

/**
 * Dispara `POST /projects/:id/agent/:agentId/deploy-key` (HMAC outbound).
 * Idempotente — se a chave já existe no agent, recebe a mesma com
 * `alreadyExisted=true`.
 */
export function useGenerateDeployKey(projectId: string, agentId: string) {
  const qc = useQueryClient();
  return useMutation<DeployKey, unknown, { comment?: string } | void>({
    mutationFn: (input) =>
      deployKeyApi.generate(projectId, agentId, input?.comment),
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEYS.deployKey(projectId, agentId), data);
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.deployKey(projectId, agentId),
      });
      toast.success(
        data.alreadyExisted
          ? "Deploy key já existia na VPS — reutilizada."
          : "Deploy key gerada na VPS.",
      );
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, "Erro ao gerar deploy key"));
    },
  });
}

/**
 * Apaga a deploy key do banco (DVincula metaDados). O arquivo na VPS
 * permanece — operador remove manualmente do GitHub.
 */
export function useRevokeDeployKey(projectId: string, agentId: string) {
  const qc = useQueryClient();
  return useMutation<RevokeDeployKeyResponse, unknown, void>({
    mutationFn: () => deployKeyApi.revoke(projectId, agentId),
    onSuccess: () => {
      qc.setQueryData(QUERY_KEYS.deployKey(projectId, agentId), null);
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.deployKey(projectId, agentId),
      });
      toast.success("Deploy key revogada. Remova manualmente do GitHub.");
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, "Erro ao revogar deploy key"));
    },
  });
}

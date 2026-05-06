import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mcpKeysApi } from "@/lib/api/mcp-keys";

const QUERY_KEY = ["mcp-key"] as const;

/**
 * Fetch MCP key info (hasKey, prefix, createdAt, lastUsedAt).
 * Auth: JWT (uses /auth/me/mcp-key).
 */
export function useMcpKeyInfo(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => mcpKeysApi.getInfo(),
    enabled,
    staleTime: 60 * 1000, // 1 min — lastUsedAt updates on each agent call
  });
}

/**
 * Generate (or REGENERATE) the user's MCP key.
 * Backend uses upsert semantics: previous key is invalidated automatically.
 * Plaintext returned ONCE — caller must show it in modal immediately.
 */
export function useGenerateMcpKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mcpKeysApi.generate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      // No toast here — the component shows a modal with the key
    },
    onError: (error: unknown) => {
      const status =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 429) {
        toast.error("Muitas requisicoes. Tente novamente em instantes.");
      } else if (status === 401) {
        toast.error("Sessao expirada. Faca login novamente.");
      } else if (typeof status === "number" && status >= 500) {
        toast.error("Erro no servidor ao gerar MCP key. Tente novamente.");
      } else if (status === undefined) {
        toast.error("Sem conexao com o servidor.");
      } else {
        toast.error("Erro ao gerar MCP key");
      }
    },
  });
}

/** Revoke the active MCP key. */
export function useRevokeMcpKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mcpKeysApi.revoke(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("MCP key revogada");
    },
    onError: (error: unknown) => {
      const status =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 429) {
        toast.error("Muitas requisicoes. Tente novamente em instantes.");
      } else if (typeof status === "number" && status >= 500) {
        toast.error("Erro no servidor ao revogar key.");
      } else if (status === undefined) {
        toast.error("Sem conexao com o servidor.");
      } else {
        toast.error("Erro ao revogar MCP key");
      }
    },
  });
}

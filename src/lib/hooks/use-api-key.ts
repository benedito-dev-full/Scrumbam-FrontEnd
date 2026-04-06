import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiKeysApi } from "@/lib/api/api-keys";
import { QUERY_KEYS } from "@/lib/constants";

/** Fetch API Key info (hasKey, prefix, createdAt, createdBy) */
export function useApiKeyInfo(projectId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.apiKey(projectId),
    queryFn: () => apiKeysApi.getInfo(projectId),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/** Generate a new API Key (returns plaintext ONCE) */
export function useGenerateApiKey(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiKeysApi.generate(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.apiKey(projectId),
      });
      // No toast here — the component shows a modal with the key
    },
    onError: (error: unknown) => {
      const status =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 409) {
        toast.error(
          "Projeto ja possui API Key ativa. Revogue antes de gerar nova.",
        );
      } else if (status === 403) {
        toast.error("Sem permissao. Apenas ADMIN pode gerar API Keys.");
      } else {
        toast.error("Erro ao gerar API Key");
      }
    },
  });
}

/** Revoke the active API Key */
export function useRevokeApiKey(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiKeysApi.revoke(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.apiKey(projectId),
      });
      toast.success("API Key revogada");
    },
    onError: () => {
      toast.error("Erro ao revogar API Key");
    },
  });
}

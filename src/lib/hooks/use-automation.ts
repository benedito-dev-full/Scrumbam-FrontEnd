"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  automationApi,
  type LinkAgentInput,
  type ListExecutionsQuery,
} from "@/lib/api/automation";

/**
 * Hooks de Automation Fase 2 — vinculo projeto<->agente, git
 * credentials, status do agente, historico de executions.
 *
 * Renomeado mentalmente: este NAO e o `use-automation` antigo (que era
 * sobre retrospective). O arquivo antigo foi renomeado para
 * `use-retrospective.ts` na Task P2-T2 (memo na agent memory).
 */

// =====================================================================
// QueryKeys
// =====================================================================

const automationKeys = {
  agentLink: (projectId: string) => ["automation", "agent-link", projectId],
  agentStatus: (projectId: string, livePing: boolean) => [
    "automation",
    "agent-status",
    projectId,
    livePing,
  ],
  gitCredentials: (projectId: string) => [
    "automation",
    "git-credentials",
    projectId,
  ],
  executions: (projectId: string, query: ListExecutionsQuery | undefined) => [
    "automation",
    "executions",
    projectId,
    query,
  ],
};

// =====================================================================
// Agent Link
// =====================================================================

/** GET vinculo do projeto. */
export function useAgentLink(projectId: string | null) {
  return useQuery({
    queryKey: automationKeys.agentLink(projectId ?? ""),
    queryFn: () => automationApi.getLink(projectId!),
    enabled: !!projectId,
  });
}

/** PATCH vinculo. ADMIN only. */
export function useLinkAgent(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LinkAgentInput) => automationApi.link(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: automationKeys.agentLink(projectId) });
      qc.invalidateQueries({
        queryKey: ["automation", "agent-status", projectId],
      });
      toast.success("Agente vinculado ao projeto.");
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Erro ao vincular agente";
      toast.error(msg);
    },
  });
}

/** DELETE vinculo. ADMIN only. */
export function useUnlinkAgent(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => automationApi.unlink(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: automationKeys.agentLink(projectId) });
      qc.invalidateQueries({
        queryKey: ["automation", "agent-status", projectId],
      });
      toast.success("Agente desvinculado do projeto.");
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Erro ao desvincular";
      toast.error(msg);
    },
  });
}

// =====================================================================
// Agent Status (probe)
// =====================================================================

/**
 * GET status do agente.
 *
 * `livePing=true` dispara PING via tunel (latencia real, custa I/O).
 * `livePing=false` consulta apenas o banco (cheap).
 */
export function useAgentStatus(
  projectId: string | null,
  livePing = false,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: automationKeys.agentStatus(projectId ?? "", livePing),
    queryFn: () => automationApi.getStatus(projectId!, livePing),
    enabled: !!projectId && (options?.enabled ?? true),
    // Sem auto-refetch para livePing (custa I/O); Refresh manual via botao
    refetchInterval: livePing ? false : 30_000,
    staleTime: livePing ? 0 : 10_000,
  });
}

/** Mutation para "Testar conexao" — forca livePing fresh. */
export function useTestConnection(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => automationApi.getStatus(projectId, true),
    onSuccess: (data) => {
      // Atualiza a query do livePing pra refletir resultado fresco
      qc.setQueryData(automationKeys.agentStatus(projectId, true), data);
      if (data.livePing?.ok) {
        const lat =
          data.livePing.latencyMs != null
            ? ` (${data.livePing.latencyMs}ms)`
            : "";
        toast.success(`Conexao OK${lat}`);
      } else {
        toast.error(
          data.livePing?.error
            ? `Falha: ${data.livePing.error}`
            : "Agente nao respondeu",
        );
      }
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Erro ao testar conexao";
      toast.error(msg);
    },
  });
}

// =====================================================================
// Git Credentials
// =====================================================================

/** GET info publica das credenciais Git. */
export function useGitCredentials(projectId: string | null) {
  return useQuery({
    queryKey: automationKeys.gitCredentials(projectId ?? ""),
    queryFn: () => automationApi.getGitCredentials(projectId!),
    enabled: !!projectId,
  });
}

/**
 * POST gera deploy key. Returns publicKey + fingerprint para UI.
 *
 * O caller exibe a public key copiavel + as instructions retornadas
 * (cole no GitHub etc).
 */
export function useGenerateGitCredentials(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => automationApi.generateGitCredentials(projectId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: automationKeys.gitCredentials(projectId),
      });
      toast.success("Deploy key gerada. Cadastre a public key no GitHub.");
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Erro ao gerar deploy key";
      toast.error(msg);
    },
  });
}

/** DELETE deploy key (apaga colunas no DProject). */
export function useRevokeGitCredentials(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => automationApi.revokeGitCredentials(projectId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: automationKeys.gitCredentials(projectId),
      });
      toast.success(
        "Deploy key revogada. Lembre de remove-la do GitHub manualmente.",
      );
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Erro ao revogar deploy key";
      toast.error(msg);
    },
  });
}

/** POST aplica .gitconfig na VPS. Pre-requisito: deploy key gerada. */
export function useApplyGitConfig(projectId: string) {
  return useMutation({
    mutationFn: () => automationApi.applyGitConfig(projectId),
    onSuccess: () => {
      toast.success("Git config aplicado na VPS.");
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Erro ao aplicar git config";
      toast.error(msg);
    },
  });
}

// =====================================================================
// Executions
// =====================================================================

/** GET historico de executions com cursor pagination. */
export function useExecutionHistory(
  projectId: string | null,
  query?: ListExecutionsQuery,
) {
  return useQuery({
    queryKey: automationKeys.executions(projectId ?? "", query),
    queryFn: () => automationApi.listExecutions(projectId!, query),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });
}

// =====================================================================
// Execucoes Fase 3
// =====================================================================

/** GET execucoes filtrando por status. Polling a cada 15s quando status=awaiting_approval. */
export function useExecutionsByStatus(projectId: string, status?: string) {
  return useQuery({
    queryKey: ["executions", projectId, status],
    queryFn: () =>
      automationApi.listExecutions(projectId, { status: status as ListExecutionsQuery["status"], limit: 20 }),
    refetchInterval: status === "awaiting_approval" ? 15_000 : false,
    enabled: !!projectId,
  });
}

/** GET detalhe de uma execucao. */
export function useExecution(executionId: string | null) {
  return useQuery({
    queryKey: ["execution", executionId],
    queryFn: () => automationApi.getExecution(executionId!),
    enabled: !!executionId,
  });
}

/** POST dispara execucao. Invalida cache de execucoes do projeto. */
export function useDispatchExecution(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (intentionId: string) =>
      automationApi.dispatchExecution(projectId, { intentionId }),
    onSuccess: () => {
      toast.success("Execucao iniciada");
      queryClient.invalidateQueries({ queryKey: ["executions", projectId] });
      queryClient.invalidateQueries({
        queryKey: automationKeys.executions(projectId, undefined),
      });
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Erro ao iniciar execucao";
      toast.error(msg);
    },
  });
}

/** POST aprova execucao awaiting_approval. */
export function useApproveExecution(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (executionId: string) =>
      automationApi.approveExecution(executionId),
    onSuccess: () => {
      toast.success("Execucao aprovada");
      queryClient.invalidateQueries({ queryKey: ["executions", projectId] });
      queryClient.invalidateQueries({
        queryKey: automationKeys.executions(projectId, undefined),
      });
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Erro ao aprovar execucao";
      toast.error(msg);
    },
  });
}

/** POST rejeita execucao awaiting_approval. */
export function useRejectExecution(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      executionId,
      reason,
    }: {
      executionId: string;
      reason: string;
    }) => automationApi.rejectExecution(executionId, { reason }),
    onSuccess: () => {
      toast.success("Execucao rejeitada");
      queryClient.invalidateQueries({ queryKey: ["executions", projectId] });
      queryClient.invalidateQueries({
        queryKey: automationKeys.executions(projectId, undefined),
      });
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Erro ao rejeitar execucao";
      toast.error(msg);
    },
  });
}

/** POST rollback de execucao. */
export function useRollbackExecution(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (executionId: string) =>
      automationApi.rollbackExecution(executionId),
    onSuccess: () => {
      toast.success("Rollback iniciado");
      queryClient.invalidateQueries({ queryKey: ["executions", projectId] });
      queryClient.invalidateQueries({
        queryKey: automationKeys.executions(projectId, undefined),
      });
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Erro ao iniciar rollback";
      toast.error(msg);
    },
  });
}

/**
 * Probe credencial Claude na VPS — on-demand, nao cachear.
 * Use como mutation (dispara ao clicar, nao no mount).
 */
export function useClaudeCredentialStatus(projectId: string) {
  return useMutation({
    mutationFn: () => automationApi.getClaudeCredentialStatus(projectId),
  });
}

/** Instrucoes SSH para configurar token Claude na VPS. */
export function useClaudeTokenInstructions(projectId: string) {
  return useMutation({
    mutationFn: () => automationApi.getClaudeTokenInstructions(projectId),
  });
}


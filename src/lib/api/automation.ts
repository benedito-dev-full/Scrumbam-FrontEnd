import api from "./client";
import { ENDPOINTS } from "./endpoints";

// =====================================================================
// Automation Fase 2 — Vinculo Projeto<->Agente + Git Credentials
// =====================================================================
//
// Mapeia os 9 endpoints de `src/automation/projects-link/projects-link.controller.ts`
// no backend Scrumban. Documentacao backend: `docs/automation-roadmap.md` v3.4.
//
// Fluxo de uso na UI:
// 1. Cadastrar agente (pagina /agents) -- Fase 1
// 2. Em /projects/[id]/automation:
//    a. PATCH agent-link (vincula agente ao projeto + remotePath/branch/repo)
//    b. POST git-credentials/generate (gera deploy key SSH na VPS)
//    c. Operador cadastra public key no GitHub manualmente
//    d. POST git-credentials/apply-config (aplica .gitconfig na VPS)
//    e. GET agent-status?livePing=true (testa conectividade real)

// === Types ===

export type ExecutionStatus =
  | "queued"
  | "running"
  | "awaiting_approval"
  | "success"
  | "failed"
  | "cancelled"
  | "rolled_back"
  | "timeout";

export type AgentStatusValue =
  | "pending_install"
  | "never_connected"
  | "online"
  | "offline";

export interface ProjectAgentLink {
  projectId: string;
  agent: {
    id: string;
    nome: string;
    status: AgentStatusValue;
    hostname: string | null;
    tunnelPort: number | null;
    lastHeartbeat: string | null;
  } | null;
  remotePath: string | null;
  remoteBranch: string | null;
  remoteRepoUrl: string | null;
  gitBotEmail: string;
  gitBotName: string;
  executionTimeoutMs: number;
}

export interface LinkAgentInput {
  idAgent: string;
  remotePath: string;
  remoteBranch?: string;
  remoteRepoUrl?: string;
  gitBotEmail?: string;
  gitBotName?: string;
  executionTimeoutMs?: number;
}

export interface AgentStatusResponse {
  projectId: string;
  agent: ProjectAgentLink["agent"];
  livePing?: {
    ok: boolean;
    latencyMs: number | null;
    error: string | null;
  } | null;
}

/**
 * Resposta de POST /projects/:id/git-credentials/generate.
 *
 * Issue M1 (review backend Fase 2): `privateKeyPath` foi removido para
 * nao expor layout do filesystem da VPS. Public key + fingerprint sao
 * suficientes para a UI; instrucoes guiam o operador.
 */
export interface GenerateGitCredentialsResponse {
  projectId: string;
  publicKey: string;
  fingerprint: string;
  instructions: string[];
}

export interface GitCredentialsInfo {
  projectId: string;
  hasKey: boolean;
  publicKey: string | null;
  fingerprint: string | null;
  gitBotEmail: string;
  gitBotName: string;
}

export interface Execution {
  id: string;
  idProject: string;
  idAgent: string | null;
  status: ExecutionStatus;
  intent: string | null;
  triggeredBy: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  riskLevel: "low" | "medium" | "high" | null;
  exitCode: number | null;
  logs: string | null;
  createdAt: string;
}

export interface ListExecutionsResponse {
  items: Execution[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ListExecutionsQuery {
  status?: ExecutionStatus;
  cursor?: string;
  limit?: number;
}

// === API client ===

export const automationApi = {
  // ----- Agent Link -----

  /** GET /projects/:id/agent-link — info do vinculo. */
  getLink: async (projectId: string): Promise<ProjectAgentLink> => {
    const { data } = await api.get<ProjectAgentLink>(
      ENDPOINTS.PROJECT_AGENT_LINK(projectId),
    );
    return data;
  },

  /** PATCH /projects/:id/agent-link — vincula agente ao projeto. ADMIN only. */
  link: async (
    projectId: string,
    input: LinkAgentInput,
  ): Promise<ProjectAgentLink> => {
    const { data } = await api.patch<ProjectAgentLink>(
      ENDPOINTS.PROJECT_AGENT_LINK(projectId),
      input,
    );
    return data;
  },

  /** DELETE /projects/:id/agent-link — desvincula agente. ADMIN only. */
  unlink: async (projectId: string): Promise<void> => {
    await api.delete(ENDPOINTS.PROJECT_AGENT_LINK(projectId));
  },

  /**
   * GET /projects/:id/agent-status?livePing=true|false
   *
   * Quando `livePing=true`, dispara PING via tunel SSH (latencia real).
   * Quando false, retorna apenas status do banco (mais barato).
   */
  getStatus: async (
    projectId: string,
    livePing = false,
  ): Promise<AgentStatusResponse> => {
    const { data } = await api.get<AgentStatusResponse>(
      ENDPOINTS.PROJECT_AGENT_STATUS(projectId),
      { params: { livePing } },
    );
    return data;
  },

  // ----- Git Credentials -----

  /**
   * POST /projects/:id/git-credentials/generate
   *
   * Dispara `ssh-keygen -t ed25519` no agente. Retorna public key +
   * fingerprint para UI exibir. Private key NUNCA chega ao backend.
   * ADMIN only.
   */
  generateGitCredentials: async (
    projectId: string,
  ): Promise<GenerateGitCredentialsResponse> => {
    const { data } = await api.post<GenerateGitCredentialsResponse>(
      ENDPOINTS.PROJECT_GIT_CREDENTIALS_GENERATE(projectId),
    );
    return data;
  },

  /** GET /projects/:id/git-credentials — info publica (sem private key). */
  getGitCredentials: async (projectId: string): Promise<GitCredentialsInfo> => {
    const { data } = await api.get<GitCredentialsInfo>(
      ENDPOINTS.PROJECT_GIT_CREDENTIALS(projectId),
    );
    return data;
  },

  /**
   * DELETE /projects/:id/git-credentials — revoga deploy key (apenas
   * apaga colunas no DProject; operador remove do GitHub manualmente).
   * ADMIN only.
   */
  revokeGitCredentials: async (projectId: string): Promise<void> => {
    await api.delete(ENDPOINTS.PROJECT_GIT_CREDENTIALS(projectId));
  },

  /**
   * POST /projects/:id/git-credentials/apply-config
   *
   * Aplica `.gitconfig` na VPS via comando `GIT_CONFIG_APPLY`. Define
   * core.sshCommand para usar a deploy key + user.email/name do bot.
   * Pre-requisito: deploy key gerada. ADMIN only.
   */
  applyGitConfig: async (projectId: string): Promise<void> => {
    await api.post(ENDPOINTS.PROJECT_GIT_CREDENTIALS_APPLY(projectId));
  },

  // ----- Executions -----

  /** GET /projects/:id/executions?status=&cursor=&limit= — historico. */
  listExecutions: async (
    projectId: string,
    query?: ListExecutionsQuery,
  ): Promise<ListExecutionsResponse> => {
    const { data } = await api.get<ListExecutionsResponse>(
      ENDPOINTS.PROJECT_EXECUTIONS(projectId),
      { params: query },
    );
    return data;
  },
};

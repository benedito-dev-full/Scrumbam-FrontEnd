import api from "./client";
import type {
  Execution as ExecutionV3,
  ClaudeCredentialStatus,
  ExecutionListResponse as ExecutionListResponseV3,
} from "@/types/execution";

// =====================================================================
// Automation Client — adaptado ao V2
// =====================================================================
//
// V2 endpoints utilizados:
// - POST   /projects/:id/agent           link agent (tipo: primary|secondary)
// - DELETE /projects/:id/agent/:agentId  unlink
// - GET    /projects/:id/agent/status    status dos agents vinculados
// - POST   /agents/install-token         gera token one-shot (regenerate)
// - GET    /executions                   lista global
// - GET    /executions/:id               detalhe
// - POST   /projects/:id/execute         dispatch (precisa command estruturado)
// - POST   /executions/:id/approve       aprova
// - POST   /executions/:id/reject        rejeita (reason obrigatorio)
// - POST   /executions/:id/rollback      rollback
// - GET    /projects/:id/claude-credential-status
// - GET    /projects/:id/claude-token-instructions
//
// V2 NAO TEM (stub no-op):
// - Git credentials (generate/get/revoke/apply-config)
// - Dispatch por intentionId (V2 quer command estruturado)
// - PATCH agent-link com remotePath/branch/repo (V2 so vincula agentId+tipo)

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
  /**
   * Slug canônico do projeto (auto-derivado de `project.nome` no backend).
   * Usado para nomear a deploy key SSH e para o operador identificar o
   * projeto no `~/.claude/CLAUDE.md` da VPS.
   */
  projectSlug: string | null;
  remoteBranch: string | null;
  remoteRepoUrl: string | null;
  executionTimeoutMs: number;
}

/**
 * Input do vínculo agente-projeto. V2 só aceita `agentId` + `tipo` no body
 * (o `projectSlug` é auto-gerado no backend a partir de `project.nome`).
 * Os demais campos são mantidos no input para futura expansão (V2 ignora hoje).
 */
export interface LinkAgentInput {
  idAgent: string;
  remoteBranch?: string;
  remoteRepoUrl?: string;
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
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | null;
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

// === Helpers ===

// V2 V2ProjectAgentStatus item shape (ver agent-status-response.dto.ts):
// { linkId, agentId, tipo, name, statusCode, lastSeen?, version?, claudeVersion?, tunnelPort }
// Adaptamos para o ProjectAgentLink legado escolhendo o primary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStatusToLink(projectId: string, raw: any): ProjectAgentLink {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = raw?.items ?? raw?.agents ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const primary = items.find((i: any) => i?.tipo === "primary") ?? items[0];
  return {
    projectId,
    agent: primary
      ? {
          id: primary.agentId,
          nome: primary.name ?? "",
          status: (primary.statusCode as AgentStatusValue) ?? "never_connected",
          hostname: primary.name ?? null,
          tunnelPort: primary.tunnelPort ?? null,
          lastHeartbeat: primary.lastSeen ?? null,
        }
      : null,
    projectSlug:
      typeof primary?.projectSlug === "string" ? primary.projectSlug : null,
    remoteBranch: null,
    remoteRepoUrl: null,
    executionTimeoutMs: 600000,
  };
}

// === API client ===

export const automationApi = {
  // ----- Agent Link -----

  /** GET /projects/:id/agent/status — info do vinculo. V2 retorna lista; expomos o primary. */
  getLink: async (projectId: string): Promise<ProjectAgentLink> => {
    const { data } = await api.get(`/projects/${projectId}/agent/status`);
    return mapStatusToLink(projectId, data);
  },

  /**
   * POST /projects/:id/agent — vincula agente. V2 so aceita { agentId, tipo }.
   * remotePath/branch/repo/gitBot/timeout do legado sao ignorados (V2 nao tem).
   */
  link: async (
    projectId: string,
    input: LinkAgentInput,
  ): Promise<ProjectAgentLink> => {
    await api.post(`/projects/${projectId}/agent`, {
      agentId: input.idAgent,
      tipo: "primary",
    });
    return automationApi.getLink(projectId);
  },

  /**
   * DELETE /projects/:id/agent/:agentId.
   * Como nao temos o agentId aqui, busca primary via status e desvincula.
   */
  unlink: async (projectId: string): Promise<void> => {
    const link = await automationApi.getLink(projectId);
    if (link.agent?.id) {
      await api.delete(`/projects/${projectId}/agent/${link.agent.id}`);
    }
  },

  /** GET /projects/:id/agent/status (V2 nao tem livePing — flag ignorada). */
  getStatus: async (
    projectId: string,
    _livePing = false,
  ): Promise<AgentStatusResponse> => {
    const link = await automationApi.getLink(projectId);
    return {
      projectId,
      agent: link.agent,
      livePing: null,
    };
  },

  // ----- Git Credentials (stubs — V2 nao implementa) -----

  generateGitCredentials: async (
    projectId: string,
  ): Promise<GenerateGitCredentialsResponse> => {
    return {
      projectId,
      publicKey: "",
      fingerprint: "",
      instructions: ["Git credentials ainda nao estao disponiveis no V2."],
    };
  },

  getGitCredentials: async (projectId: string): Promise<GitCredentialsInfo> => {
    return {
      projectId,
      hasKey: false,
      publicKey: null,
      fingerprint: null,
      gitBotEmail: "",
      gitBotName: "",
    };
  },

  revokeGitCredentials: async (_projectId: string): Promise<void> => {
    return;
  },

  applyGitConfig: async (_projectId: string): Promise<void> => {
    return;
  },

  // ----- Executions -----

  /** GET /executions?projectId=... — V2 nao tem rota nested em /projects, usa /executions com filtro. */
  listExecutions: async (
    projectId: string,
    query?: ListExecutionsQuery,
  ): Promise<ListExecutionsResponse> => {
    const params: Record<string, unknown> = { projectId };
    if (query?.status) params.status = query.status;
    if (query?.cursor) params.cursor = query.cursor;
    if (query?.limit !== undefined) params.limit = query.limit;
    const { data } = await api.get("/executions", { params });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawItems: any[] = Array.isArray(data) ? data : (data?.items ?? []);
    const items: Execution[] = rawItems.map((item) => ({
      ...item,
      // backend V2 envia command.text; frontend espera intent
      intent: item.intent ?? item.command?.text ?? null,
      idProject: item.idProject ?? item.projectId ?? projectId,
      idAgent: item.idAgent ?? null,
      status: item.status ?? item.approval?.status ?? "queued",
      startedAt: item.startedAt ?? item.claude?.startedAt ?? null,
      finishedAt: item.finishedAt ?? item.claude?.finishedAt ?? null,
      durationMs: item.durationMs ?? item.claude?.durationMs ?? null,
      riskLevel: item.riskLevel ?? null,
      exitCode: item.exitCode ?? item.claude?.exitCode ?? null,
      logs: item.logs ?? item.claude?.stdout ?? null,
    }));
    return {
      items,
      nextCursor: data?.pagination?.nextCursor ?? data?.nextCursor ?? null,
      hasMore: data?.pagination?.hasMore ?? data?.hasMore ?? false,
    };
  },

  getExecution: async (executionId: string): Promise<ExecutionV3> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await api.get<any>(`/executions/${executionId}`);
    // mapeia formato V2 do backend para o que o modal espera
    return {
      ...data,
      intent: data.intent ?? data.command?.text ?? null,
      status: data.status ?? data.approval?.status ?? "queued",
      riskLevel: data.riskLevel ?? null,
      durationMs: data.durationMs ?? data.claude?.durationMs ?? null,
      commitHash: data.commitHash ?? data.git?.headAfter ?? null,
      pullRequestUrl: data.pullRequestUrl ?? data.pullRequest?.url ?? null,
      rollbackRef: data.rollbackRef ?? data.pullRequest?.rollbackRef ?? null,
      claudeRuntimeData: data.claudeRuntimeData ?? (data.claude ? {
        stdout: data.claude.stdout,
        stderr: data.claude.stderr,
        exitCode: data.claude.exitCode,
        filesAffected: data.git?.filesChanged ? undefined : undefined,
      } : undefined),
    } as ExecutionV3;
  },

  /**
   * POST /projects/:id/execute — dispara `claude -p "<titulo da task>"` na VPS.
   *
   * Conector V3 Intention → comando estruturado V2:
   *  1. Busca a task pelo id (`GET /tasks/:id`) para extrair `nome`/`titulo`.
   *  2. Constrói comando estruturado `{ executable: "claude", args: ["-p", titulo] }`.
   *  3. POST /projects/:id/execute com `taskId` original (vínculo
   *     execution → task para o ExecutionHistory mostrar).
   *
   * O backend (`ExecutionAccessGuard` + `CommandValidatorService`) valida
   * que o usuário tem permissão no projeto e que o executable está na
   * allowlist. O Risk Gate (F13) classifica o risco automaticamente.
   * Se HIGH, fica em `awaiting_approval` na fila — senão dispara já.
   */
  dispatchExecution: async (
    projectId: string,
    body: { intentionId: string },
  ): Promise<{ executionId: string }> => {
    // 1. Buscar task para obter o título (intenção em linguagem natural)
    const { data: task } = await api.get<{
      chave?: string | number;
      nome?: string;
      titulo?: string;
    }>(`/tasks/${body.intentionId}`);
    const prompt = task?.nome ?? task?.titulo;
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      throw new Error(
        `Task ${body.intentionId} não tem título — impossível dispatchar Claude Code.`,
      );
    }

    // 2. Montar comando estruturado aceito pelo backend.
    //    `claude -p "<prompt>"` roda non-interactive (sem TUI), retornando
    //    saída em texto e finalizando. timeoutMs 30min cobre tasks médias.
    const payload = {
      command: {
        executable: "claude",
        args: ["-p", prompt],
        timeoutMs: 1_800_000,
      },
      taskId: body.intentionId,
    };

    // 3. Dispatch — backend retorna a execution recém-criada
    const { data } = await api.post<{ id?: string; executionId?: string }>(
      `/projects/${projectId}/execute`,
      payload,
    );
    return { executionId: data?.id ?? data?.executionId ?? "" };
  },

  approveExecution: async (executionId: string): Promise<void> => {
    await api.post(`/executions/${executionId}/approve`, {});
  },

  rejectExecution: async (
    executionId: string,
    body: { reason: string },
  ): Promise<void> => {
    await api.post(`/executions/${executionId}/reject`, body);
  },

  rollbackExecution: async (executionId: string): Promise<void> => {
    await api.post(`/executions/${executionId}/rollback`);
  },

  getClaudeCredentialStatus: async (
    projectId: string,
  ): Promise<ClaudeCredentialStatus> => {
    const { data } = await api.get<ClaudeCredentialStatus>(
      `/projects/${projectId}/claude-credential-status`,
    );
    return data;
  },

  getClaudeTokenInstructions: async (
    projectId: string,
  ): Promise<{
    projectId: string;
    xdgConfigHome: string;
    authJsonPath: string;
    setupTokenSnippet: string;
  }> => {
    const { data } = await api.get<{
      projectId: string;
      xdgConfigHome: string;
      authJsonPath: string;
      setupTokenSnippet: string;
    }>(`/projects/${projectId}/claude-token-instructions`);
    return data;
  },

  /** GET /executions global. */
  listExecutionsGlobal: async (params?: {
    projectId?: string;
    status?: string;
    cursor?: string;
    limit?: number;
  }): Promise<ExecutionListResponseV3> => {
    const { data } = await api.get<ExecutionListResponseV3>(`/executions`, {
      params,
    });
    return data;
  },
};

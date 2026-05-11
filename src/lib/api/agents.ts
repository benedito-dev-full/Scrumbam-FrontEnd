import api from "./client";

// === Types ===

export type AgentStatus =
  | "pending_install"
  | "never_connected"
  | "online"
  | "offline";

export interface Agent {
  id: string;
  nome: string;
  status: AgentStatus;
  hostname: string | null;
  agentVersion: string | null;
  tunnelPort: number | null;
  lastHeartbeat: string | null;
  installedAt: string | null;
  createdAt: string;
}

/** Resposta de POST /agents — inclui one-liner de instalação. */
export interface CreateAgentResponse extends Agent {
  installToken: string;
  installTokenExp: string;
  oneLineInstall: string;
}

export interface RegenerateInstallTokenResponse {
  installToken: string;
  installTokenExp: string;
  oneLineInstall: string;
}

export interface CreateAgentInput {
  nome: string;
  /** V2 exige projectId — o frontend legado nao passava */
  projectId?: string;
}

// === API Client (adaptado ao V2) ===
//
// V2 NAO TEM CRUD standalone de agents. O fluxo do V2 e:
// 1. Owner do projeto: POST /agents/install-token { projectId } -> token one-shot
// 2. VPS executa one-liner que chama POST /agents/install { installToken, hostname, ... }
//    -> retorna agentId
// 3. Agent emite POST /agents/:id/heartbeat com auth proprio
// 4. Owner do projeto: POST /projects/:id/agent { agentId, tipo } para vincular
//
// Como o frontend legado tinha "lista global de agents", "cria agent
// sem projeto", etc., a maioria desses metodos vira stub. Para fluxo
// real, use src/lib/api/automation.ts (link/unlink/status).

export const agentsApi = {
  /**
   * Stub — V2 nao tem endpoint global de listagem de agents.
   * Para listar agents de um projeto, use automationApi.getStatus(projectId).
   */
  list: async (_status?: AgentStatus): Promise<Agent[]> => {
    return [];
  },

  /**
   * Stub — V2 nao tem GET /agents/:id direto.
   * Para informacoes do agent vinculado a um projeto, use automationApi.getLink(projectId).
   */
  get: async (_id: string): Promise<Agent> => {
    throw new Error(
      "agentsApi.get nao suportado no V2. Use automationApi.getLink(projectId).",
    );
  },

  /**
   * Cria install-token V2. Exige projectId (V2 vincula token ao projeto).
   * Retorna o token + one-liner formatado para a UI exibir.
   */
  create: async (input: CreateAgentInput): Promise<CreateAgentResponse> => {
    if (!input.projectId) {
      throw new Error(
        "V2 exige projectId em create — passe input.projectId (use a tela de automacao do projeto).",
      );
    }
    const { data } = await api.post<{
      token: string;
      installTokenId: string;
      expiresAt: string;
    }>("/agents/install-token", { projectId: input.projectId });

    const oneLineInstall = `curl -fsSL ${typeof window !== "undefined" ? window.location.origin : ""}/agent-dist/install.sh | INSTALL_TOKEN=${data.token} bash`;

    return {
      id: data.installTokenId,
      nome: input.nome,
      status: "pending_install",
      hostname: null,
      agentVersion: null,
      tunnelPort: null,
      lastHeartbeat: null,
      installedAt: null,
      createdAt: new Date().toISOString(),
      installToken: data.token,
      installTokenExp: data.expiresAt,
      oneLineInstall,
    };
  },

  /**
   * Stub — V2 nao tem DELETE /agents/:id global.
   * Para desvincular agent de um projeto, use automationApi.unlink(projectId).
   */
  remove: async (_id: string): Promise<void> => {
    throw new Error(
      "agentsApi.remove nao suportado no V2. Use automationApi.unlink(projectId).",
    );
  },

  /**
   * Regenera install-token. V2 nao tem endpoint dedicado de regenerate —
   * gerar um install-token novo para o mesmo projeto produz o mesmo efeito.
   * Como o frontend legado nao passa projectId, este metodo lanca erro.
   * Use create({ nome, projectId }) novamente.
   */
  regenerateInstallToken: async (
    _id: string,
  ): Promise<RegenerateInstallTokenResponse> => {
    throw new Error(
      "regenerateInstallToken nao suportado no V2. Chame agentsApi.create({ nome, projectId }) novamente.",
    );
  },
};

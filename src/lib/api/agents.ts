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
  /** ID do install-token gerado pela API (installTokenId retornado por POST /agents/install-token). */
  installTokenId?: string | null;
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

// === API Client (adaptado ao V2 — multi-projeto) ===
//
// Fluxo V2:
// 1. Admin: POST /agents/install-token { projectId? } -> token one-shot
//    (projectId opcional: ausente = agente standalone, vincula projetos depois)
// 2. VPS executa one-liner que chama POST /agents/install { installToken, hostname, ... }
//    -> retorna agentId
// 3. Agent emite POST /agents/:id/heartbeat com auth proprio
// 4. Vincular/desvincular projetos: POST/DELETE /agents/:id/projects
//
// V2 ainda nao expoe GET/DELETE global de agents — list/get/remove
// permanecem stubs. Para detalhes por projeto use automationApi.

export const agentsApi = {
  /**
   * Lista todos os agents (DEntidade -156) acessíveis ao usuário autenticado.
   * Status é calculado em runtime pelo backend (janela 90s para `online`).
   */
  list: async (status?: AgentStatus): Promise<Agent[]> => {
    const { data } = await api.get<Agent[]>("/agents", {
      params: status ? { status } : undefined,
    });
    return data;
  },

  /**
   * V2 não expõe `GET /agents/:id` standalone. Como fallback, baixa a
   * lista completa (`GET /agents`) e filtra localmente. A lista é pequena
   * (agents da org do usuário) e já vem cacheada pelo `useAgents()`, então
   * o custo é aceitável.
   *
   * Lança NotFoundException client-side se o id não aparecer na lista —
   * isso reflete corretamente o caso "agent não existe ou usuário sem
   * acesso", e permite o `useAgent` cair em `data=undefined` sem precisar
   * de tratamento especial de exceção.
   */
  get: async (id: string): Promise<Agent> => {
    const all = await agentsApi.list();
    const found = all.find((a) => a.id === id);
    if (!found) {
      throw Object.assign(new Error(`Agent ${id} não encontrado`), {
        response: { status: 404 },
      });
    }
    return found;
  },

  /**
   * Cria install-token V2. `projectId` é opcional — quando ausente, o
   * agente é criado standalone e pode ser vinculado a múltiplos projetos
   * depois via `POST /agents/:id/projects`.
   */
  create: async (input: CreateAgentInput): Promise<CreateAgentResponse> => {
    const body: { projectId?: string } = {};
    if (input.projectId) body.projectId = input.projectId;
    const { data } = await api.post<{
      token: string;
      installTokenId: string;
      expiresAt: string;
    }>("/agents/install-token", body);

    const backendOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1").replace(/\/api\/v1\/?$/, "");
    const oneLineInstall = `curl -fsSL ${backendOrigin}/api/v1/agent-dist/install.sh | INSTALL_TOKEN=${data.token} bash`;

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

import api from "./client";
import { ENDPOINTS } from "./endpoints";

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
}

// === API Client ===

export const agentsApi = {
  /** Lista agentes da organização atual. */
  list: async (status?: AgentStatus): Promise<Agent[]> => {
    const { data } = await api.get<Agent[]>(ENDPOINTS.AGENTS, {
      params: status ? { status } : undefined,
    });
    return data;
  },

  /** Detalhe de um agente. */
  get: async (id: string): Promise<Agent> => {
    const { data } = await api.get<Agent>(ENDPOINTS.AGENT(id));
    return data;
  },

  /** Cadastra novo agente. ADMIN only. Retorna installToken + one-liner UMA VEZ. */
  create: async (input: CreateAgentInput): Promise<CreateAgentResponse> => {
    const { data } = await api.post<CreateAgentResponse>(
      ENDPOINTS.AGENTS,
      input,
    );
    return data;
  },

  /** Soft delete: libera porta, fecha tunel, remove authorized_keys. ADMIN only. */
  remove: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.AGENT(id));
  },

  /** Regenera installToken (apenas para agentes em pending_install). ADMIN only. */
  regenerateInstallToken: async (
    id: string,
  ): Promise<RegenerateInstallTokenResponse> => {
    const { data } = await api.post<RegenerateInstallTokenResponse>(
      ENDPOINTS.AGENT_REGENERATE_TOKEN(id),
    );
    return data;
  },
};

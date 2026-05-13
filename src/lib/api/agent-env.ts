import api from "./client";

/**
 * Status de credenciais do agent (env file da VPS). Booleanos — o frontend
 * NUNCA recebe o valor plaintext (PAT/Anthropic key ficam só no env file 0600
 * da VPS — ADR-V2-041). `lastEnvUpdatedAt` é ISO 8601 ou null se nunca
 * configurado.
 */
export interface EnvStatus {
  hasGithubToken: boolean;
  hasAnthropicKey: boolean;
  lastEnvUpdatedAt: string | null;
  /**
   * Nome do bot Git configurado (`null` se nunca configurado).
   * Plaintext porque não é sensível (público em `git log`).
   */
  gitBotName: string | null;
  /**
   * Email do bot Git configurado (`null` se nunca configurado).
   */
  gitBotEmail: string | null;
}

/**
 * Payload de `PUT /agents/:id/env`. Todos opcionais — só os preenchidos
 * são enviados (o backend faz merge). Mínimo 1 campo obrigatório (validação
 * server-side via BadRequestException).
 */
export interface SetAgentEnvInput {
  githubToken?: string;
  anthropicApiKey?: string;
  anthropicAuthToken?: string;
}

/**
 * Payload de `PUT /agents/:id/git-bot`. Ambos obrigatórios — atualiza
 * `~scrumban-agent/.gitconfig` na VPS via SET_ENV outbound.
 */
export interface SetGitBotInput {
  name: string;
  email: string;
}

/**
 * Configuração atual do bot Git (lida do `dados.gitBotName/Email` no
 * `DEntidade -156`). Backend retorna junto do env-status para evitar
 * 2 chamadas.
 */
export interface GitBotConfig {
  name: string | null;
  email: string | null;
}

/**
 * Item da lista de projetos vinculados ao agent. Resposta de
 * `GET /agents/:id/projects` (já existente, criado em fase anterior).
 */
export interface LinkedProject {
  projectId: string;
  nome: string;
  idEstab: string | null;
}

export interface LinkedProjectsResponse {
  agentId: string;
  projects: LinkedProject[];
}

export const agentEnvApi = {
  /**
   * Lê status das credenciais persistidas no env file da VPS. Booleanos
   * — backend não devolve plaintext (ADR-V2-041).
   */
  getEnvStatus: async (agentId: string): Promise<EnvStatus> => {
    const { data } = await api.get<EnvStatus>(`/agents/${agentId}/env-status`);
    return data;
  },

  /**
   * Atualiza credenciais (PAT GitHub, Anthropic API/Auth tokens) no env file
   * da VPS. Dispatcha `SET_ENV` outbound HMAC; agent reescreve `/etc/scrumban-
   * agent/environment` atômicamente e dá `systemctl restart self` via sudoers
   * escopo mínimo.
   *
   * Backend retorna 204 + atualiza `envStatus.lastEnvUpdatedAt`.
   */
  setEnv: async (agentId: string, input: SetAgentEnvInput): Promise<void> => {
    await api.put(`/agents/${agentId}/env`, input);
  },

  /**
   * Atualiza name/email do bot Git no `~scrumban-agent/.gitconfig` da VPS.
   * Idem `setEnv` em transporte.
   */
  setGitBot: async (agentId: string, input: SetGitBotInput): Promise<void> => {
    await api.put(`/agents/${agentId}/git-bot`, input);
  },

  /**
   * Lista projetos atualmente vinculados ao agente (DVincula -185).
   * Endpoint pré-existente.
   */
  listLinkedProjects: async (
    agentId: string,
  ): Promise<LinkedProjectsResponse> => {
    const { data } = await api.get<LinkedProjectsResponse>(
      `/agents/${agentId}/projects`,
    );
    return data;
  },
};

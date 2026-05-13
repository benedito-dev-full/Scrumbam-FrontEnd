import api from "./client";

/**
 * Deploy key SSH per-projeto-VPS. Privada nunca sai da VPS (ADR-V2-042) —
 * frontend recebe apenas pubkey + fingerprint + snippet/instruções pra colar
 * no GitHub.
 */
export interface DeployKey {
  publicKey: string;
  fingerprint: string;
  /**
   * Snippet pronto pra `~/.ssh/config` (formato `Host github.com-<slug>`).
   */
  sshConfigSnippet: string;
  /**
   * Lista ordenada de instruções (markdown plain) — render como `<ol>`.
   * Ex: "Abra https://github.com/...", "Cole pubkey no campo Key", etc.
   */
  instructions: string[];
  generatedAt: string;
  /**
   * `true` quando o agent já tinha a chave (idempotente — retornou a chave
   * existente sem regerar).
   */
  alreadyExisted: boolean;
}

export interface RevokeDeployKeyResponse {
  revoked: true;
  revokedAt: string;
}

export const deployKeyApi = {
  /**
   * POST /projects/:projectId/agent/:agentId/deploy-key
   * Idempotente — se a chave já existe no agent, retorna a mesma com
   * `alreadyExisted=true`.
   */
  generate: async (
    projectId: string,
    agentId: string,
    comment?: string,
  ): Promise<DeployKey> => {
    const { data } = await api.post<DeployKey>(
      `/projects/${projectId}/agent/${agentId}/deploy-key`,
      comment ? { comment } : {},
    );
    return data;
  },

  /**
   * GET /projects/:projectId/agent/:agentId/deploy-key
   * Lê do banco sem outbound. 404 se nunca foi gerada.
   */
  get: async (projectId: string, agentId: string): Promise<DeployKey> => {
    const { data } = await api.get<DeployKey>(
      `/projects/${projectId}/agent/${agentId}/deploy-key`,
    );
    return data;
  },

  /**
   * DELETE /projects/:projectId/agent/:agentId/deploy-key
   * Apaga só os campos da deploy key no banco. O arquivo .pub/.priv na VPS
   * NÃO é removido automaticamente (cleanup manual aceitável).
   */
  revoke: async (
    projectId: string,
    agentId: string,
  ): Promise<RevokeDeployKeyResponse> => {
    const { data } = await api.delete<RevokeDeployKeyResponse>(
      `/projects/${projectId}/agent/${agentId}/deploy-key`,
    );
    return data;
  },
};

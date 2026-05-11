import api from "./client";

// === Types ===

export interface McpKeyInfo {
  hasKey: boolean;
  prefix: string | null;
  createdAt: string | null;
  lastUsedAt: string | null;
}

export interface GenerateMcpKeyResponse {
  key: string; // plaintext — show ONCE
  prefix: string;
  createdAt: string;
}

// V2 shapes
interface McpKeyListItem {
  id: string;
  prefix: string;
  scopes: string[];
  disabled: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

interface McpKeyCreated {
  id: string;
  prefix: string;
  plaintext: string;
  scopes: string[];
  createdAt: string;
}

const BASE = "/mcp/keys";

/**
 * Cliente MCP Keys (V2).
 *
 * V2 suporta multiplas keys por usuario. O frontend assume key unica
 * (legacy contract), entao representamos como "a primeira ativa".
 *
 * - `getInfo`: lista keys e retorna a primeira nao-disabled
 * - `generate`: cria nova key; backend NAO revoga as antigas automaticamente
 * - `revoke`: revoga TODAS as keys ativas (mantem semantica do contrato legado)
 */
export const mcpKeysApi = {
  getInfo: async (): Promise<McpKeyInfo> => {
    const { data } = await api.get<McpKeyListItem[]>(BASE);
    const active = (Array.isArray(data) ? data : []).find((k) => !k.disabled);
    if (!active) {
      return { hasKey: false, prefix: null, createdAt: null, lastUsedAt: null };
    }
    return {
      hasKey: true,
      prefix: active.prefix,
      createdAt: active.createdAt,
      lastUsedAt: active.lastUsedAt,
    };
  },

  generate: async (): Promise<GenerateMcpKeyResponse> => {
    const { data } = await api.post<McpKeyCreated>(BASE, {});
    return {
      key: data.plaintext,
      prefix: data.prefix,
      createdAt: data.createdAt,
    };
  },

  /** Revoga TODAS as MCP keys ativas (mantem contrato legado de "uma key por user"). */
  revoke: async (): Promise<void> => {
    const { data } = await api.get<McpKeyListItem[]>(BASE);
    const active = (Array.isArray(data) ? data : []).filter((k) => !k.disabled);
    await Promise.allSettled(active.map((k) => api.delete(`${BASE}/${k.id}`)));
  },
};

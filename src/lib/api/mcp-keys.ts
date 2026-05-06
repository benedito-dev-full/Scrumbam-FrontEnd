import api from "./client";
import { ENDPOINTS } from "./endpoints";

// === Types ===

export interface McpKeyInfo {
  hasKey: boolean;
  prefix: string | null;
  createdAt: string | null;
  lastUsedAt: string | null;
}

export interface GenerateMcpKeyResponse {
  key: string; // plaintext — show ONCE
  prefix: string; // scrumban_mcp_42_a8f3...
  createdAt: string;
}

// === API Client ===

export const mcpKeysApi = {
  /**
   * Get MCP Key info (prefix, status, last used).
   * Returns hasKey=false if user never generated one.
   * Auth: JWT.
   */
  getInfo: async (): Promise<McpKeyInfo> => {
    const { data } = await api.get<McpKeyInfo>(ENDPOINTS.MCP_KEY);
    return data;
  },

  /**
   * Generate a new MCP Key. REPLACES the previous one (revoke + create atomic).
   * Returns plaintext ONCE; subsequent GETs return only the prefix.
   * Auth: JWT.
   */
  generate: async (): Promise<GenerateMcpKeyResponse> => {
    const { data } = await api.post<GenerateMcpKeyResponse>(ENDPOINTS.MCP_KEY);
    return data;
  },

  /**
   * Revoke the active MCP Key. After this, agents using the key will get 401.
   * Auth: JWT.
   */
  revoke: async (): Promise<void> => {
    await api.delete(ENDPOINTS.MCP_KEY);
  },
};

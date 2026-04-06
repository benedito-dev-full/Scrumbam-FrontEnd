import api from "./client";
import { ENDPOINTS } from "./endpoints";

// === Types ===

export interface ApiKeyInfo {
  hasKey: boolean;
  prefix: string | null;
  createdAt: string | null;
  createdBy: string | null;
}

export interface GenerateApiKeyResponse {
  key: string; // plaintext — show ONCE
  prefix: string; // scrumban_pk_2_a8f3...
  createdAt: string;
  message: string;
}

// === API Client ===

export const apiKeysApi = {
  /** Get API Key info (prefix, status). ADMIN only. */
  getInfo: async (projectId: string): Promise<ApiKeyInfo> => {
    const { data } = await api.get(ENDPOINTS.PROJECT_API_KEY(projectId));
    return data;
  },

  /** Generate new API Key. Returns plaintext ONCE. ADMIN only. */
  generate: async (projectId: string): Promise<GenerateApiKeyResponse> => {
    const { data } = await api.post(ENDPOINTS.PROJECT_API_KEY(projectId));
    return data;
  },

  /** Revoke active API Key. ADMIN only. */
  revoke: async (projectId: string): Promise<void> => {
    await api.delete(ENDPOINTS.PROJECT_API_KEY(projectId));
  },
};

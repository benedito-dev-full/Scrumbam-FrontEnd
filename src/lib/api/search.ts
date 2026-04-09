/**
 * API Client: Search (Busca Global)
 *
 * Wraps the backend GET /search endpoint for unified cross-entity search.
 */

import api from "./client";
import { ENDPOINTS } from "./endpoints";

export interface SearchTaskResult {
  id: string;
  name: string;
  description?: string;
  status: { code: string; name: string };
  project: { id: string; name: string };
  type: "task";
}

export interface SearchProjectResult {
  id: string;
  name: string;
  description?: string;
  taskCount: number;
  type: "project";
}

export interface SearchPersonResult {
  id: string;
  name: string;
  email?: string;
  role: string | null;
  type: "person";
}

export interface SearchResponse {
  query: string;
  results: {
    tasks: SearchTaskResult[];
    projects: SearchProjectResult[];
    people: SearchPersonResult[];
  };
  counts: {
    tasks: number;
    projects: number;
    people: number;
    total: number;
  };
  searchTimeMs: number;
}

export const searchApi = {
  /**
   * Busca global unificada em tasks, projetos e pessoas.
   * organizationId e extraido do JWT no backend (tenant isolation).
   */
  search: async (
    q: string,
    projectId?: string,
    limit: number = 10,
  ): Promise<SearchResponse> => {
    const params: Record<string, string | number> = { q, limit };
    if (projectId) {
      params.projectId = projectId;
    }
    const { data } = await api.get<SearchResponse>(ENDPOINTS.SEARCH, {
      params,
    });
    return data;
  },
};

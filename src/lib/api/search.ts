/**
 * API Client: Search (Busca Global) — adaptado ao V2.
 *
 * V2 retorna `{ tasks, projects, people, cursors, meta }` com fields PT-BR.
 * O contrato legado do frontend espera `{ query, results: {…}, counts, searchTimeMs }`.
 * Este client traduz o response do V2 para o shape esperado pelo CommandPalette.
 */

import api from "./client";
import { ENDPOINTS } from "./endpoints";

// === Tipos legados que o frontend consome ===

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

// === Shapes V2 ===

interface V2TaskItem {
  chave: string;
  nome: string;
  descricao: string | null;
  idProject: string | null;
  projectNome: string | null;
  idStatus: string | null;
  criadoEm: string;
}

interface V2ProjectItem {
  chave: string;
  nome: string;
  descricao: string | null;
  criadoEm: string;
}

interface V2PersonItem {
  chave: string;
  nome: string;
  email: string | null;
  criadoEm: string;
}

interface V2SearchResponse {
  tasks: V2TaskItem[];
  projects: V2ProjectItem[];
  people: V2PersonItem[];
  cursors: {
    task: string | null;
    project: string | null;
    person: string | null;
  };
  meta: {
    q: string;
    limit: number;
    organizationId: string;
  };
}

// === Mappers ===

function mapTask(t: V2TaskItem): SearchTaskResult {
  return {
    id: t.chave,
    name: t.nome,
    description: t.descricao ?? undefined,
    // V2 retorna so idStatus; o code/name e desconhecido sem outra request.
    status: { code: t.idStatus ?? "", name: "" },
    project: {
      id: t.idProject ?? "",
      name: t.projectNome ?? "",
    },
    type: "task",
  };
}

function mapProject(p: V2ProjectItem): SearchProjectResult {
  return {
    id: p.chave,
    name: p.nome,
    description: p.descricao ?? undefined,
    // V2 nao retorna taskCount na busca — deixar 0 (CommandPalette nao depende).
    taskCount: 0,
    type: "project",
  };
}

function mapPerson(p: V2PersonItem): SearchPersonResult {
  return {
    id: p.chave,
    name: p.nome,
    email: p.email ?? undefined,
    role: null,
    type: "person",
  };
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

    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const { data } = await api.get<V2SearchResponse>(ENDPOINTS.SEARCH, {
      params,
    });
    const elapsed =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) -
      start;

    const tasks = (data.tasks ?? []).map(mapTask);
    const projects = (data.projects ?? []).map(mapProject);
    const people = (data.people ?? []).map(mapPerson);

    return {
      query: data.meta?.q ?? q,
      results: { tasks, projects, people },
      counts: {
        tasks: tasks.length,
        projects: projects.length,
        people: people.length,
        total: tasks.length + projects.length + people.length,
      },
      searchTimeMs: Math.round(elapsed),
    };
  },
};

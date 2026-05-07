import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type {
  Project,
  ProjectDetail,
  CreateProjectDto,
  ProjectSummary,
  DeleteProjectResponse,
} from "@/types";

// Maps backend response (id/name) to frontend types (chave/nome)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProject(raw: any): Project {
  return {
    chave: raw.id || raw.chave,
    nome: raw.name || raw.nome,
    descricao: raw.description || raw.descricao || null,
    dataInicio: raw.startDate || raw.dataInicio || null,
    dataFim: raw.endDate || raw.dataFim || null,
    criadoEm: raw.createdAt || raw.criadoEm,
    taskCount: raw.taskCount ?? 0,
    responsavel: raw.owner
      ? {
          chave: raw.owner.id || raw.owner.chave,
          nome: raw.owner.name || raw.owner.nome,
        }
      : raw.responsavel || null,
  };
}

export const projectsApi = {
  list: async (organizationId?: string): Promise<Project[]> => {
    const params = organizationId ? { organizationId } : {};
    const { data } = await api.get(ENDPOINTS.PROJECTS, { params });
    return (Array.isArray(data) ? data : []).map(mapProject);
  },

  getById: async (id: string): Promise<ProjectDetail> => {
    const { data } = await api.get(ENDPOINTS.PROJECT(id));
    const p = mapProject(data);
    return {
      ...p,
      idResponsavel: p.responsavel?.chave || null,
    };
  },

  create: async (
    dto: CreateProjectDto,
    organizationId?: string,
  ): Promise<Project> => {
    const { useAuthStore } = await import("@/lib/stores/auth-store");
    const orgId = organizationId || useAuthStore.getState().user?.orgId || "";
    const { data } = await api.post(ENDPOINTS.PROJECTS, {
      name: dto.nome,
      description: dto.descricao || undefined,
      organizationId: orgId,
    });
    return mapProject(data);
  },

  remove: async (id: string): Promise<DeleteProjectResponse> => {
    const { data } = await api.delete<DeleteProjectResponse>(
      ENDPOINTS.PROJECT(id),
    );
    return data;
  },

  getSummaries: async (organizationId?: string): Promise<ProjectSummary[]> => {
    const params = organizationId ? { organizationId } : {};
    const { data } = await api.get(ENDPOINTS.PROJECT_SUMMARIES, { params });
    return data.summaries ?? [];
  },
};

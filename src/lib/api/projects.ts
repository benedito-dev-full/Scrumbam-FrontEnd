import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type {
  Project,
  ProjectDetail,
  CreateProjectDto,
  UpdateProjectDto,
  ProjectSummary,
  DeleteProjectResponse,
} from "@/types";

// Maps backend V2 ProjectResponseDto to frontend Project type
// V2 returns: id, nome, prefix, description, orgId, memberCount, automationEnabled, gitRepo, criadoEm, atualizadoEm
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProject(raw: any): Project {
  return {
    chave: raw.id || raw.chave,
    nome: raw.nome || raw.name,
    descricao: raw.description || raw.descricao || null,
    dataInicio: raw.startDate || raw.dataInicio || null,
    dataFim: raw.endDate || raw.dataFim || null,
    criadoEm: raw.criadoEm || raw.createdAt,
    taskCount: raw.taskCount ?? raw.memberCount ?? 0,
    teamId: raw.teamId ?? null,
    responsavel: raw.owner
      ? {
          chave: raw.owner.id || raw.owner.chave,
          nome: raw.owner.nome || raw.owner.name,
        }
      : raw.responsavel || null,
  };
}

export const projectsApi = {
  list: async (
    _organizationId?: string,
    _teamId?: string,
  ): Promise<Project[]> => {
    // V2 GET /projects: filtra automaticamente por user do JWT.
    // Aceita apenas cursor/limit. Retorna { items, pagination }.
    const { data } = await api.get(ENDPOINTS.PROJECTS);
    const items = Array.isArray(data) ? data : (data?.items ?? []);
    return items.map(mapProject);
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
    // V2 CreateProjectDto: { nome, prefix?, description?, orgId?, automationEnabled?, gitRepo? }
    // idTeam/memberIds nao existem em V2 — usar /projects/:id/members em chamada separada.
    const { useAuthStore } = await import("@/lib/stores/auth-store");
    const orgId = organizationId || useAuthStore.getState().user?.orgId || "";
    const { data } = await api.post(ENDPOINTS.PROJECTS, {
      nome: dto.nome,
      description: dto.descricao || undefined,
      orgId: orgId || undefined,
    });
    return mapProject(data);
  },

  /**
   * Atualiza projeto via PATCH /projects/:id (V2 — apenas MANAGER no backend).
   *
   * V2 UpdateProjectDto aceita: nome, description, prefix, automationEnabled, gitRepo.
   * NAO aceita idTeam ou startDate (legacy — ignorados aqui).
   */
  update: async (id: string, dto: UpdateProjectDto): Promise<Project> => {
    const payload: Record<string, unknown> = {};
    if (dto.nome !== undefined) payload.nome = dto.nome;
    if (dto.descricao !== undefined) payload.description = dto.descricao;
    // idTeam e startDate sao legacy — V2 nao aceita
    const { data } = await api.patch(ENDPOINTS.PROJECT(id), payload);
    return mapProject(data);
  },

  remove: async (id: string): Promise<DeleteProjectResponse> => {
    const { data } = await api.delete<DeleteProjectResponse>(
      ENDPOINTS.PROJECT(id),
    );
    return data;
  },

  // Stub — V2 nao implementa /projects/summaries. UI mostra estado vazio.
  getSummaries: async (_organizationId?: string): Promise<ProjectSummary[]> => {
    return [];
  },
};

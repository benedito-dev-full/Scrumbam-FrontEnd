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
  /**
   * Lista projetos do usuario (V2 — `GET /projects`).
   *
   * Quando `teamId` informado, envia como query param para o backend
   * filtrar por DVincula -182 PROJECT_TEAM_LINK (ADR-V2-029).
   * Quando omitido, lista todos os projetos do usuario (inclui orfaos).
   *
   * @param _organizationId - Reservado (V2 escopa por user do JWT).
   * @param teamId - Filtra projetos vinculados ao time.
   */
  list: async (
    _organizationId?: string,
    teamId?: string,
  ): Promise<Project[]> => {
    const params: Record<string, string> = {};
    if (teamId) params.teamId = teamId;
    const { data } = await api.get(ENDPOINTS.PROJECTS, {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
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

  /**
   * Cria projeto (V2 — `POST /projects`).
   *
   * Aceita `teamId` (canonico V2) ou `idTeam` (legacy — mapeado).
   * Quando informado, o backend cria DVincula -182 atomicamente na mesma
   * transacao (ADR-V2-029).
   */
  create: async (
    dto: CreateProjectDto,
    organizationId?: string,
  ): Promise<Project> => {
    const { useAuthStore } = await import("@/lib/stores/auth-store");
    const orgId = organizationId || useAuthStore.getState().user?.orgId || "";
    const teamId = dto.teamId ?? dto.idTeam;
    const { data } = await api.post(ENDPOINTS.PROJECTS, {
      nome: dto.nome,
      description: dto.descricao || undefined,
      orgId: orgId || undefined,
      teamId: teamId || undefined,
    });
    return mapProject(data);
  },

  /**
   * Atualiza projeto via PATCH /projects/:id (V2 — apenas MANAGER).
   *
   * Convencao para teamId (ADR-V2-029):
   *  - `teamId === null` desvincula (soft-delete DVincula -182).
   *  - `teamId === string` reatribui.
   *  - `teamId` ausente preserva.
   *
   * Aceita `teamId` (canonico V2) ou `idTeam` (legacy — mapeado). Usa
   * `'teamId' in dto || 'idTeam' in dto` para preservar `null` no body
   * (diferente de `!== undefined`, que perderia esse caso em alguns
   * serializers).
   */
  update: async (id: string, dto: UpdateProjectDto): Promise<Project> => {
    const payload: Record<string, unknown> = {};
    if (dto.nome !== undefined) payload.nome = dto.nome;
    if (dto.descricao !== undefined) payload.description = dto.descricao;
    // teamId: aceitar null explicito.
    if (Object.prototype.hasOwnProperty.call(dto, "teamId")) {
      payload.teamId = dto.teamId;
    } else if (Object.prototype.hasOwnProperty.call(dto, "idTeam")) {
      payload.teamId = dto.idTeam;
    }
    // ownerId (responsavel do projeto): aceitar null explicito.
    if (Object.prototype.hasOwnProperty.call(dto, "ownerId")) {
      payload.ownerId = dto.ownerId;
    }
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

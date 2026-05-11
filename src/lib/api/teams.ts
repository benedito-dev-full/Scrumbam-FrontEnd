import api from "./client";
import { ENDPOINTS } from "./endpoints";
import { useAuthStore } from "@/lib/stores/auth-store";
import type {
  Team,
  TeamMember,
  CreateTeamDto,
  UpdateTeamDto,
  AddTeamMemberDto,
  UpdateTeamMemberRoleDto,
} from "@/types/team";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrapList<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function resolveOrgId(orgIdParam?: string): string {
  return orgIdParam || useAuthStore.getState().user?.orgId || "";
}

/**
 * Cliente API do modulo Times (V2).
 *
 * V2 usa rotas namespaced sob `/organizations/:orgId/teams` para listar/criar.
 * Rotas individuais `/teams/:id` e `/teams/mine` permanecem.
 */
export const teamsApi = {
  /** Lista times onde o usuario logado e membro (JWT). */
  listMine: async (): Promise<Team[]> => {
    const { data } = await api.get(ENDPOINTS.TEAMS_MINE);
    return unwrapList<Team>(data);
  },

  /** Lista times da organizacao. V2: GET /organizations/:orgId/teams. */
  list: async (organizationId: string): Promise<Team[]> => {
    const orgId = resolveOrgId(organizationId);
    if (!orgId) return [];
    const { data } = await api.get(`/organizations/${orgId}/teams`);
    return unwrapList<Team>(data);
  },

  getById: async (id: string): Promise<Team> => {
    const { data } = await api.get<Team>(ENDPOINTS.TEAM(id));
    return data;
  },

  getMembers: async (id: string): Promise<TeamMember[]> => {
    const { data } = await api.get(ENDPOINTS.TEAM_MEMBERS(id));
    return unwrapList<TeamMember>(data);
  },

  /**
   * Cria time. V2: POST /organizations/:orgId/teams.
   * Mapeia name→nome, key→prefix. color/icon nao existem no V2 (ignorados).
   */
  create: async (
    dto: CreateTeamDto,
    organizationId?: string,
  ): Promise<Team> => {
    const orgId = resolveOrgId(organizationId);
    if (!orgId) throw new Error("organizationId required to create team");
    const payload: Record<string, unknown> = {
      nome: dto.name,
      prefix: dto.key,
    };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined || payload[k] === null) delete payload[k];
    });
    const { data } = await api.post<Team>(
      `/organizations/${orgId}/teams`,
      payload,
    );
    return data;
  },

  /** Edita time. V2: PATCH /teams/:id. Mapeia name→nome. */
  update: async (id: string, dto: UpdateTeamDto): Promise<Team> => {
    const payload: Record<string, unknown> = {};
    if (dto.name !== undefined) payload.nome = dto.name;
    // key/color/icon nao existem no V2 — omitidos
    const { data } = await api.patch<Team>(ENDPOINTS.TEAM(id), payload);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.TEAM(id));
  },

  /** Adiciona membro. V2 exige `cargo` ('LEAD'|'MEMBER'). */
  addMember: async (
    teamId: string,
    dto: AddTeamMemberDto,
  ): Promise<TeamMember> => {
    const cargo: "LEAD" | "MEMBER" = dto.cargo === "ADMIN" ? "LEAD" : "MEMBER";
    const payload = { userId: dto.userId, cargo };
    const { data } = await api.post<TeamMember>(
      ENDPOINTS.TEAM_MEMBERS(teamId),
      payload,
    );
    return data;
  },

  /** Edita cargo do membro. V2: PATCH /teams/:id/members/:userId, body { cargo }. */
  updateMemberRole: async (
    teamId: string,
    userId: string,
    dto: UpdateTeamMemberRoleDto,
  ): Promise<void> => {
    const cargo: "LEAD" | "MEMBER" = dto.cargo === "ADMIN" ? "LEAD" : "MEMBER";
    await api.patch(ENDPOINTS.TEAM_MEMBER(teamId, userId), { cargo });
  },

  removeMember: async (teamId: string, userId: string): Promise<void> => {
    await api.delete(ENDPOINTS.TEAM_MEMBER(teamId, userId));
  },
};

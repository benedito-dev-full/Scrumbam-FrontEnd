import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type {
  Team,
  TeamMember,
  CreateTeamDto,
  UpdateTeamDto,
  AddTeamMemberDto,
  UpdateTeamMemberRoleDto,
} from "@/types/team";

/**
 * Cliente API do modulo Times (12 endpoints `/api/v1/teams*`).
 * Padrao espelha `agents.ts`. Backend retorna camelCase ja no shape final.
 */
export const teamsApi = {
  /** Lista times onde o usuario logado e membro (JWT). */
  listMine: async (): Promise<Team[]> => {
    const { data } = await api.get<Team[]>(ENDPOINTS.TEAMS_MINE);
    return Array.isArray(data) ? data : [];
  },

  /** Lista times da organizacao (?organizationId=X). */
  list: async (organizationId: string): Promise<Team[]> => {
    const { data } = await api.get<Team[]>(ENDPOINTS.TEAMS, {
      params: { organizationId },
    });
    return Array.isArray(data) ? data : [];
  },

  /** Detalhe de um time. */
  getById: async (id: string): Promise<Team> => {
    const { data } = await api.get<Team>(ENDPOINTS.TEAM(id));
    return data;
  },

  /** Membros do time. */
  getMembers: async (id: string): Promise<TeamMember[]> => {
    const { data } = await api.get<TeamMember[]>(ENDPOINTS.TEAM_MEMBERS(id));
    return Array.isArray(data) ? data : [];
  },

  /** Cria time. ADMIN only. */
  create: async (dto: CreateTeamDto): Promise<Team> => {
    const { data } = await api.post<Team>(ENDPOINTS.TEAMS, dto);
    return data;
  },

  /** Edita time. */
  update: async (id: string, dto: UpdateTeamDto): Promise<Team> => {
    const { data } = await api.patch<Team>(ENDPOINTS.TEAM(id), dto);
    return data;
  },

  /** Soft delete. Retorna 409 se ainda ha projetos vinculados. */
  remove: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.TEAM(id));
  },

  /** Adiciona membro. ADMIN only. */
  addMember: async (
    teamId: string,
    dto: AddTeamMemberDto,
  ): Promise<TeamMember> => {
    const { data } = await api.post<TeamMember>(
      ENDPOINTS.TEAM_MEMBERS(teamId),
      dto,
    );
    return data;
  },

  /** Edita cargo do membro. */
  updateMemberRole: async (
    teamId: string,
    userId: string,
    dto: UpdateTeamMemberRoleDto,
  ): Promise<void> => {
    await api.patch(ENDPOINTS.TEAM_MEMBER(teamId, userId), dto);
  },

  /** Remove membro. */
  removeMember: async (teamId: string, userId: string): Promise<void> => {
    await api.delete(ENDPOINTS.TEAM_MEMBER(teamId, userId));
  },
};

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
function unwrapItems(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  // V2 envelopa membros em { members: [...] }
  if (Array.isArray(data?.members)) return data.members;
  return [];
}

// V2 retorna { id, nome, prefix, orgId, memberCount, criadoEm, atualizadoEm, description? }
// Frontend espera { id, name, key, color, icon, organizationId, lastIssueSeq, memberCount, createdAt, canEdit, canDelete }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTeam(raw: any): Team {
  return {
    id: String(raw.id ?? raw.chave ?? ""),
    name: String(raw.nome ?? raw.name ?? ""),
    key: String(raw.prefix ?? raw.key ?? "DEV"),
    color: raw.color ?? raw.dados?.color ?? null,
    icon: raw.icon ?? raw.dados?.icon ?? null,
    organizationId: String(raw.orgId ?? raw.organizationId ?? ""),
    lastIssueSeq: Number(raw.lastIssueSeq ?? 0),
    memberCount: Number(raw.memberCount ?? 0),
    createdAt: String(
      raw.criadoEm ?? raw.createdAt ?? new Date().toISOString(),
    ),
    canEdit: Boolean(raw.canEdit ?? false),
    canDelete: Boolean(raw.canDelete ?? false),
    myCargo:
      raw.myCargo === "LEAD" || raw.myCargo === "MEMBER" ? raw.myCargo : null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMember(raw: any): TeamMember {
  return {
    userId: String(raw.userId ?? raw.id ?? raw.chave ?? ""),
    name: String(raw.name ?? raw.nome ?? ""),
    email: raw.email ?? null,
    cargo: raw.cargo === "LEAD" ? "LEAD" : "MEMBER",
    joinedAt: String(raw.joinedAt ?? raw.criadoEm ?? raw.createdAt ?? ""),
  };
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
    return unwrapItems(data).map(mapTeam);
  },

  /** Lista times da organizacao. V2: GET /organizations/:orgId/teams. */
  list: async (organizationId: string): Promise<Team[]> => {
    const orgId = resolveOrgId(organizationId);
    if (!orgId) return [];
    const { data } = await api.get(`/organizations/${orgId}/teams`);
    return unwrapItems(data).map(mapTeam);
  },

  getById: async (id: string): Promise<Team> => {
    const { data } = await api.get(ENDPOINTS.TEAM(id));
    return mapTeam(data);
  },

  getMembers: async (id: string): Promise<TeamMember[]> => {
    const { data } = await api.get(ENDPOINTS.TEAM_MEMBERS(id));
    return unwrapItems(data).map(mapMember);
  },

  /**
   * Cria time. V2: POST /organizations/:orgId/teams.
   * Mapeia name→nome, key→prefix; color/icon trafegam direto (persistidos
   * em `DEntidade.dados` no backend).
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
    if (dto.color !== undefined) payload.color = dto.color;
    if (dto.icon !== undefined) payload.icon = dto.icon;
    // Limpa apenas keys undefined; null e propositalmente preservado
    // (significa "limpar valor" no backend).
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });
    const { data } = await api.post(`/organizations/${orgId}/teams`, payload);
    return mapTeam(data);
  },

  /** Edita time. V2: PATCH /teams/:id. Mapeia name→nome; color/icon diretos. */
  update: async (id: string, dto: UpdateTeamDto): Promise<Team> => {
    const payload: Record<string, unknown> = {};
    if (dto.name !== undefined) payload.nome = dto.name;
    if (dto.color !== undefined) payload.color = dto.color;
    if (dto.icon !== undefined) payload.icon = dto.icon;
    // key (prefix) ainda nao e editavel no V2 — omitido
    const { data } = await api.patch(ENDPOINTS.TEAM(id), payload);
    return mapTeam(data);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.TEAM(id));
  },

  /** Adiciona membro. V2 exige `cargo` ('LEAD'|'MEMBER'). */
  addMember: async (
    teamId: string,
    dto: AddTeamMemberDto,
  ): Promise<TeamMember> => {
    const payload = { userId: dto.userId, cargo: dto.cargo ?? "MEMBER" };
    const { data } = await api.post(ENDPOINTS.TEAM_MEMBERS(teamId), payload);
    return mapMember(data);
  },

  /** Edita cargo do membro. V2: PATCH /teams/:id/members/:userId, body { cargo }. */
  updateMemberRole: async (
    teamId: string,
    userId: string,
    dto: UpdateTeamMemberRoleDto,
  ): Promise<void> => {
    await api.patch(ENDPOINTS.TEAM_MEMBER(teamId, userId), { cargo: dto.cargo });
  },

  removeMember: async (teamId: string, userId: string): Promise<void> => {
    await api.delete(ENDPOINTS.TEAM_MEMBER(teamId, userId));
  },
};

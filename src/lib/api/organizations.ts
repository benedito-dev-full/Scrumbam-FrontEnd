import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type {
  Organization,
  UpdateOrganizationDto,
  OrgMember,
  AddOrgMemberDto,
  AddOrgMemberResponse,
  UpdateUserRoleDto,
} from "@/types";

// V2 OrganizationResponseDto: { id, nome, description, memberCount, criadoEm, atualizadoEm }
// Frontend Organization:     { id, name, email, phone, createdAt, memberCount }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrganization(raw: any): Organization {
  return {
    id: String(raw.id ?? raw.chave ?? ""),
    name: String(raw.nome ?? raw.name ?? ""),
    email: raw.email ?? null,
    phone: raw.phone ?? null,
    createdAt: String(
      raw.criadoEm ?? raw.createdAt ?? new Date().toISOString(),
    ),
    memberCount: Number(raw.memberCount ?? 0),
  };
}

// V2 OrgMemberDto:    { userId, nome, email?, role, idClasse }
// Frontend OrgMember: { id, name, email, phone, role, organizationId, createdAt }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrgMember(raw: any): OrgMember {
  return {
    id: String(raw.userId ?? raw.id ?? ""),
    name: String(raw.nome ?? raw.name ?? ""),
    email: raw.email ?? "",
    phone: raw.phone ?? null,
    role: (raw.role ?? "MEMBER") as OrgMember["role"],
    organizationId: String(raw.organizationId ?? ""),
    createdAt: String(raw.criadoEm ?? raw.createdAt ?? ""),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrapItems(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export const organizationsApi = {
  getOrg: async (orgId: string): Promise<Organization> => {
    const { data } = await api.get(ENDPOINTS.ORG(orgId));
    return mapOrganization(data);
  },

  /**
   * V2 PATCH /organizations/:id aceita `{ nome?, description? }`.
   * Frontend manda { name, email, phone } — mapeia name→nome; email/phone sao ignorados (V2 nao guarda).
   */
  updateOrg: async (
    orgId: string,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> => {
    const payload: Record<string, unknown> = {};
    if (dto.name !== undefined) payload.nome = dto.name;
    // email/phone nao existem no V2 — silenciosamente ignorados
    const { data } = await api.patch(ENDPOINTS.ORG(orgId), payload);
    return mapOrganization(data);
  },

  listUsers: async (orgId: string): Promise<OrgMember[]> => {
    const { data } = await api.get(ENDPOINTS.ORG_USERS(orgId));
    return unwrapItems(data).map(mapOrgMember);
  },

  /**
   * V2 espera `{ userId, role: 'MEMBER'|'VIEWER' }` — vincula user JÁ EXISTENTE.
   * Frontend legado mandava `{ name, email, password }` (criar user na hora).
   * Como o contrato mudou estruturalmente, expomos um erro descritivo
   * até a UI ser refeita para "convidar usuario existente por entidadeId".
   */
  addUser: async (
    _orgId: string,
    _dto: AddOrgMemberDto,
  ): Promise<AddOrgMemberResponse> => {
    throw new Error(
      "Convite por email ainda nao disponivel no V2. Use 'adicionar membro existente' (precisa entidadeId).",
    );
  },

  removeUser: async (orgId: string, userId: string): Promise<void> => {
    await api.delete(ENDPOINTS.ORG_USER(orgId, userId));
  },

  /** V2: PATCH /organizations/:id/members/:userId body { role }. */
  updateUserRole: async (
    orgId: string,
    userId: string,
    dto: UpdateUserRoleDto,
  ): Promise<void> => {
    await api.patch(ENDPOINTS.ORG_USER_ROLE(orgId, userId), { role: dto.role });
  },
};

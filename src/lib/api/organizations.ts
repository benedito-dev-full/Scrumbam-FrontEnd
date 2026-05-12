import api from "./client";
import { invitesApi } from "./invites";
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
  // V2 /organizations/:id/members retorna { members: [...] }
  if (Array.isArray(data?.members)) return data.members;
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
   * Convida novo membro por email (ADR-V2-028).
   *
   * Substitui o stub legado que criava conta com senha temporaria.
   * Agora delega para `invitesApi.createInvite` — backend gera token,
   * persiste em DTabela e dispara email com link `/invite?token=...`.
   *
   * NUNCA envia password — accept flow gera credencial no servidor.
   *
   * Backend valida que o caller eh ADMIN da org via `OrgTenantGuard`.
   *
   * @throws AxiosError 409 — email ja eh membro / convite pendente existe.
   * @throws AxiosError 429 — rate limit (3/min).
   */
  addUser: async (
    orgId: string,
    dto: AddOrgMemberDto,
  ): Promise<AddOrgMemberResponse> => {
    const role: "MEMBER" | "VIEWER" =
      dto.role === "VIEWER" ? "VIEWER" : "MEMBER";
    const created = await invitesApi.createInvite(orgId, {
      email: dto.email,
      role,
    });
    return {
      // Convite ainda nao virou user — devolvemos a info que temos.
      id: created.id,
      name: dto.name ?? dto.email,
      email: created.email,
      role: created.role,
      organizationId: orgId,
    };
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

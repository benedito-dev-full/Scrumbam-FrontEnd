// Organization types (aligned with backend OrganizationsController responses)

export type OrgRole = "ADMIN" | "MEMBER" | "VIEWER";

export interface Organization {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  memberCount: number;
}

export interface UpdateOrganizationDto {
  name?: string;
  email?: string;
  phone?: string;
}

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: OrgRole;
  organizationId: string;
  createdAt: string;
}

export interface AddOrgMemberDto {
  name: string;
  email: string;
  password: string;
  role?: OrgRole;
}

export interface AddOrgMemberResponse {
  id: string;
  name: string;
  email: string;
  role: OrgRole;
  organizationId: string;
}

export interface UpdateUserRoleDto {
  role: OrgRole;
}

// Me (auth/me) types
export interface MeResponse {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  /** Legado — V1 retornava `role`. V2 retorna `orgRole`. Mantido como opcional. */
  role?: string;
  /** V2 retorna `orgRole` (ADMIN/MEMBER/VIEWER). */
  orgRole?: string;
  organizationId: string;
  organizationName: string;
  createdAt: string;
  /**
   * Lista de orgs com vínculo ativo do usuário (ADR-V2-030 — Multi-tenant).
   * Populada pelo backend em GET /auth/me. Opcional para back-compat.
   */
  availableOrgs?: {
    id: string;
    nome: string;
    role: OrgRole;
  }[];
  /**
   * Estado órfão (ADR-V2-038). Quando `true`, o usuário não tem workspace
   * ativa — JWT é válido mas não contém `organizationId`. Frontend deve
   * redirecionar para `/orphan` (tela de empty state com CTAs para criar
   * workspace ou aceitar convite pendente).
   *
   * Opcional para back-compat com backends pré-ADR-V2-038.
   */
  isOrphan?: boolean;
}

export interface UpdateMeDto {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

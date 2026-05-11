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
  role: string;
  organizationId: string;
  organizationName: string;
  createdAt: string;
}

export interface UpdateMeDto {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

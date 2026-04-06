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

export const organizationsApi = {
  getOrg: async (orgId: string): Promise<Organization> => {
    const { data } = await api.get<Organization>(ENDPOINTS.ORG(orgId));
    return data;
  },

  updateOrg: async (
    orgId: string,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> => {
    const { data } = await api.patch<Organization>(ENDPOINTS.ORG(orgId), dto);
    return data;
  },

  listUsers: async (orgId: string): Promise<OrgMember[]> => {
    const { data } = await api.get<OrgMember[]>(ENDPOINTS.ORG_USERS(orgId));
    return data;
  },

  addUser: async (
    orgId: string,
    dto: AddOrgMemberDto,
  ): Promise<AddOrgMemberResponse> => {
    const { data } = await api.post<AddOrgMemberResponse>(
      ENDPOINTS.ORG_USERS(orgId),
      dto,
    );
    return data;
  },

  removeUser: async (orgId: string, userId: string): Promise<void> => {
    await api.delete(ENDPOINTS.ORG_USER(orgId, userId));
  },

  updateUserRole: async (
    orgId: string,
    userId: string,
    dto: UpdateUserRoleDto,
  ): Promise<void> => {
    await api.patch(ENDPOINTS.ORG_USER_ROLE(orgId, userId), dto);
  },
};

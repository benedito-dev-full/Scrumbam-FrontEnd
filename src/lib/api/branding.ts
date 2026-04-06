import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type { Branding, UpdateBrandingDto } from "@/types";

export const brandingApi = {
  get: async (orgId: string): Promise<Branding> => {
    const { data } = await api.get<Branding>(ENDPOINTS.ORG_BRANDING(orgId));
    return data;
  },

  update: async (orgId: string, dto: UpdateBrandingDto): Promise<Branding> => {
    const { data } = await api.put<Branding>(
      ENDPOINTS.ORG_BRANDING(orgId),
      dto,
    );
    return data;
  },
};

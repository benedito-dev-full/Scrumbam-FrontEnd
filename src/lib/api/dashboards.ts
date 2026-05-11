import api from "./client";
import { ENDPOINTS } from "./endpoints";
import {
  mapApiTeamDashboard,
  mapApiMemberDashboard,
  mapApiCompanyOverview,
} from "@/lib/adapters/api-dashboard-adapter";
import type { TeamDashboard, MemberDashboard, CompanyOverview } from "@/types";

export interface DailySummary {
  createdToday: number;
  completedToday: number;
  movedToday: number;
  activeNow: number;
  date: string;
}

export const dashboardsApi = {
  getTeamMetrics: async (projectId: string): Promise<TeamDashboard> => {
    const { data } = await api.get(
      `${ENDPOINTS.DASHBOARDS}/projects/${projectId}/metrics`,
    );
    return mapApiTeamDashboard(data);
  },

  // Stub — V2 nao implementa /dashboards/me. Retorna dashboard vazio.
  getMyMetrics: async (): Promise<MemberDashboard> => {
    return mapApiMemberDashboard({});
  },

  // Stub — V2 nao implementa /dashboards/company. Retorna overview vazio.
  getCompanyOverview: async (): Promise<CompanyOverview> => {
    return mapApiCompanyOverview({});
  },

  getDailySummary: async (projectId: string): Promise<DailySummary> => {
    const { data } = await api.get(
      ENDPOINTS.DASHBOARD_DAILY_SUMMARY(projectId),
    );
    return data;
  },
};

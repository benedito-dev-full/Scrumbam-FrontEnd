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

  getMyMetrics: async (): Promise<MemberDashboard> => {
    const { data } = await api.get(ENDPOINTS.DASHBOARDS_ME);
    return mapApiMemberDashboard(data);
  },

  getCompanyOverview: async (): Promise<CompanyOverview> => {
    const { data } = await api.get(ENDPOINTS.DASHBOARDS_COMPANY);
    return mapApiCompanyOverview(data);
  },

  getDailySummary: async (projectId: string): Promise<DailySummary> => {
    const { data } = await api.get(
      ENDPOINTS.DASHBOARD_DAILY_SUMMARY(projectId),
    );
    return data;
  },
};

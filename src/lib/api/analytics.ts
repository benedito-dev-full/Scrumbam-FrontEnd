import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type {
  PeriodComparison,
  CapacityForecast,
  StakeholderReport,
} from "@/types";

export const analyticsApi = {
  comparePeriods: async (
    projectId: string,
    period1?: number,
    period2?: number,
  ): Promise<PeriodComparison> => {
    const params: Record<string, string> = {};
    if (period1) params.period1 = String(period1);
    if (period2) params.period2 = String(period2);
    const { data } = await api.get<PeriodComparison>(
      ENDPOINTS.ANALYTICS_COMPARE(projectId),
      { params },
    );
    return data;
  },

  capacityForecast: async (projectId: string): Promise<CapacityForecast> => {
    const { data } = await api.get<CapacityForecast>(
      ENDPOINTS.ANALYTICS_CAPACITY_FORECAST(projectId),
    );
    return data;
  },

  stakeholderReport: async (
    projectId: string,
    period?: number,
  ): Promise<StakeholderReport> => {
    const params: Record<string, string> = {};
    if (period) params.period = String(period);
    const { data } = await api.get<StakeholderReport>(
      ENDPOINTS.ANALYTICS_STAKEHOLDER_REPORT(projectId),
      { params },
    );
    return data;
  },
};

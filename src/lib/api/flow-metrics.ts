import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type {
  CycleTimeResponse,
  LeadTimeResponse,
  ThroughputResponse,
  WipAgeResponse,
  CfdResponse,
  FlowDashboard,
} from "@/types";

/**
 * Adapter: contrato legado usa `period: number` (ex: 30 = ultimos 30 dias).
 * V2 espera `period` como enum 'today'|'week'|'month' OU `periodFrom`+`periodTo`
 * no formato YYYY-MM-DD. Convertemos numero -> periodFrom/periodTo.
 */
function buildPeriodParams(periodDays?: number): Record<string, string> {
  if (!periodDays || periodDays <= 0) return {};
  const today = new Date();
  const from = new Date(today.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const fmt = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  return {
    periodFrom: fmt(from),
    periodTo: fmt(today),
  };
}

export const flowMetricsApi = {
  getCycleTime: async (
    projectId: string,
    period = 30,
  ): Promise<CycleTimeResponse> => {
    const { data } = await api.get(ENDPOINTS.FLOW_CYCLE_TIME(projectId), {
      params: buildPeriodParams(period),
    });
    return data;
  },

  getLeadTime: async (
    projectId: string,
    period = 30,
  ): Promise<LeadTimeResponse> => {
    const { data } = await api.get(ENDPOINTS.FLOW_LEAD_TIME(projectId), {
      params: buildPeriodParams(period),
    });
    return data;
  },

  getThroughput: async (
    projectId: string,
    period = 30,
  ): Promise<ThroughputResponse> => {
    const { data } = await api.get(ENDPOINTS.FLOW_THROUGHPUT(projectId), {
      params: buildPeriodParams(period),
    });
    return data;
  },

  getWipAge: async (projectId: string): Promise<WipAgeResponse> => {
    const { data } = await api.get(ENDPOINTS.FLOW_WIP_AGE(projectId));
    return data;
  },

  getCfd: async (projectId: string, period = 30): Promise<CfdResponse> => {
    const { data } = await api.get(ENDPOINTS.FLOW_CFD(projectId), {
      params: buildPeriodParams(period),
    });
    return data;
  },

  getFlowDashboard: async (
    projectId: string,
    period = 30,
  ): Promise<FlowDashboard> => {
    const { data } = await api.get(ENDPOINTS.FLOW_DASHBOARD(projectId), {
      params: buildPeriodParams(period),
    });
    return data;
  },
};

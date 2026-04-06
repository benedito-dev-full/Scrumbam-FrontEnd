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

export const flowMetricsApi = {
  getCycleTime: async (
    projectId: string,
    period = 30,
  ): Promise<CycleTimeResponse> => {
    const { data } = await api.get(ENDPOINTS.FLOW_CYCLE_TIME(projectId), {
      params: { period },
    });
    return data;
  },

  getLeadTime: async (
    projectId: string,
    period = 30,
  ): Promise<LeadTimeResponse> => {
    const { data } = await api.get(ENDPOINTS.FLOW_LEAD_TIME(projectId), {
      params: { period },
    });
    return data;
  },

  getThroughput: async (
    projectId: string,
    period = 30,
  ): Promise<ThroughputResponse> => {
    const { data } = await api.get(ENDPOINTS.FLOW_THROUGHPUT(projectId), {
      params: { period },
    });
    return data;
  },

  getWipAge: async (projectId: string): Promise<WipAgeResponse> => {
    const { data } = await api.get(ENDPOINTS.FLOW_WIP_AGE(projectId));
    return data;
  },

  getCfd: async (projectId: string, period = 30): Promise<CfdResponse> => {
    const { data } = await api.get(ENDPOINTS.FLOW_CFD(projectId), {
      params: { period },
    });
    return data;
  },

  getFlowDashboard: async (
    projectId: string,
    period = 30,
  ): Promise<FlowDashboard> => {
    const { data } = await api.get(ENDPOINTS.FLOW_DASHBOARD(projectId), {
      params: { period },
    });
    return data;
  },
};

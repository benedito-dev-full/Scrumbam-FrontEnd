"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { dashboardsApi } from "@/lib/api/dashboards";
import { flowMetricsApi } from "@/lib/api/flow-metrics";

const STALE_TIME = 2 * 60 * 1000; // 2 minutes

// ---- Dashboard hooks ----

export function useDailySummary(projectId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.dashboard.team(projectId ?? ""), "daily-summary"],
    queryFn: () => dashboardsApi.getDailySummary(projectId!),
    enabled: !!projectId,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useTeamDashboard(projectId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.team(projectId ?? ""),
    queryFn: () => dashboardsApi.getTeamMetrics(projectId!),
    enabled: !!projectId,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useMyDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.me,
    queryFn: () => dashboardsApi.getMyMetrics(),
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useCompanyDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.company,
    queryFn: () => dashboardsApi.getCompanyOverview(),
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

// ---- Flow Metrics hooks ----

export function useFlowDashboard(
  projectId: string | undefined,
  period: number = 30,
) {
  return useQuery({
    queryKey: QUERY_KEYS.flowMetrics.dashboard(projectId ?? "", period),
    queryFn: () => flowMetricsApi.getFlowDashboard(projectId!, period),
    enabled: !!projectId,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useThroughput(
  projectId: string | undefined,
  period: number = 30,
) {
  return useQuery({
    queryKey: QUERY_KEYS.flowMetrics.throughput(projectId ?? "", period),
    queryFn: () => flowMetricsApi.getThroughput(projectId!, period),
    enabled: !!projectId,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useCfd(projectId: string | undefined, period: number = 30) {
  return useQuery({
    queryKey: QUERY_KEYS.flowMetrics.cfd(projectId ?? "", period),
    queryFn: () => flowMetricsApi.getCfd(projectId!, period),
    enabled: !!projectId,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useWipAge(projectId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.flowMetrics.wipAge(projectId ?? ""),
    queryFn: () => flowMetricsApi.getWipAge(projectId!),
    enabled: !!projectId,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useCycleTimeDetails(
  projectId: string | undefined,
  period: number = 30,
) {
  return useQuery({
    queryKey: QUERY_KEYS.flowMetrics.cycleTime(projectId ?? "", period),
    queryFn: () => flowMetricsApi.getCycleTime(projectId!, period),
    enabled: !!projectId,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useLeadTimeDetails(
  projectId: string | undefined,
  period: number = 30,
) {
  return useQuery({
    queryKey: QUERY_KEYS.flowMetrics.leadTime(projectId ?? "", period),
    queryFn: () => flowMetricsApi.getLeadTime(projectId!, period),
    enabled: !!projectId,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

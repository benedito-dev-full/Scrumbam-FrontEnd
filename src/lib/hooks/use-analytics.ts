"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import { QUERY_KEYS } from "@/lib/constants";

export function usePeriodComparison(
  projectId: string | null,
  period1 = 30,
  period2 = 60,
) {
  return useQuery({
    queryKey: QUERY_KEYS.analytics.compare(projectId ?? "", period1, period2),
    queryFn: () => analyticsApi.comparePeriods(projectId!, period1, period2),
    enabled: !!projectId,
  });
}

export function useCapacityForecast(projectId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.analytics.forecast(projectId ?? ""),
    queryFn: () => analyticsApi.capacityForecast(projectId!),
    enabled: !!projectId,
  });
}

export function useStakeholderReport(projectId: string | null, period = 30) {
  return useQuery({
    queryKey: QUERY_KEYS.analytics.stakeholder(projectId ?? "", period),
    queryFn: () => analyticsApi.stakeholderReport(projectId!, period),
    enabled: !!projectId,
  });
}

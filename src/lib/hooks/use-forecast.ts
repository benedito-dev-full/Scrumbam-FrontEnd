"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { forecastApi } from "@/lib/api/forecast";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes (forecasts don't change often)

export function useForecast(
  projectId: string | undefined,
  items: number,
  confidence: number,
  weeks?: number,
) {
  return useQuery({
    queryKey: QUERY_KEYS.forecast(projectId ?? "", items, confidence),
    queryFn: () =>
      forecastApi.getForecast(projectId!, { items, confidence, weeks }),
    enabled: !!projectId && items > 0,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

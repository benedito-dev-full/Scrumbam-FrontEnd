"use client";

import { useQuery } from "@tanstack/react-query";
import { activityApi, type ActivityQueryParams } from "@/lib/api/activity";

export function useProjectActivity(
  projectId: string | null | undefined,
  params?: ActivityQueryParams,
) {
  return useQuery({
    queryKey: ["project-activity", projectId, params?.cursor, params?.limit],
    queryFn: () => activityApi.getProjectActivity(projectId!, params),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}

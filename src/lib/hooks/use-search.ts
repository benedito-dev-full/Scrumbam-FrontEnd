"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { searchApi, type SearchResponse } from "@/lib/api/search";

/**
 * Hook for unified global search (Cmd+K).
 *
 * Uses TanStack Query with debounced query string.
 * Only fetches when query has >= 2 characters.
 * Keeps previous data while loading new results (smooth UX).
 *
 * @param query - Search term (debounce should be applied by caller)
 * @param options - Optional projectId filter
 */
export function useSearch(
  query: string,
  options?: { projectId?: string },
) {
  return useQuery<SearchResponse>({
    queryKey: QUERY_KEYS.search(query),
    queryFn: () => searchApi.search(query, options?.projectId),
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}

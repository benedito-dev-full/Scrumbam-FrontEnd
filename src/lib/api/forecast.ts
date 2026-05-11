import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type { ForecastResponse } from "@/types";

export interface ForecastParams {
  items?: number;
  confidence?: number;
  weeks?: number;
}

/**
 * V2 forecast aceita apenas: { historicalSprints? (1-12), iterations? (100-50000) }.
 * O contrato legado do frontend usa { items, confidence, weeks } — todos ignorados aqui
 * (V2 retorna percentis p50/p75/p85/p95 e o frontend escolhe pela `confidence`).
 *
 * `weeks` (se vier) e usado como heuristica grosseira: 1 sprint = ~2 semanas.
 */
export const forecastApi = {
  getForecast: async (
    projectId: string,
    params?: ForecastParams,
  ): Promise<ForecastResponse> => {
    const v2Params: Record<string, number> = {};
    if (params?.weeks) {
      const sprints = Math.max(1, Math.min(12, Math.round(params.weeks / 2)));
      v2Params.historicalSprints = sprints;
    }
    const { data } = await api.get<ForecastResponse>(
      ENDPOINTS.FORECAST(projectId),
      { params: v2Params },
    );
    return data;
  },
};

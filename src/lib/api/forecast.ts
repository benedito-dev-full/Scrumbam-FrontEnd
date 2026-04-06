import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type { ForecastResponse } from "@/types";

export interface ForecastParams {
  items?: number;
  confidence?: number;
  weeks?: number;
}

export const forecastApi = {
  getForecast: async (
    projectId: string,
    params?: ForecastParams,
  ): Promise<ForecastResponse> => {
    const { data } = await api.get<ForecastResponse>(
      ENDPOINTS.FORECAST(projectId),
      { params },
    );
    return data;
  },
};

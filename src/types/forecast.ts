// Forecast types -- aligned with backend ForecastResponseDto

export interface SimulationPercentiles {
  p50: string;
  p75: string;
  p85: string;
  p95: string;
}

export interface ForecastResponse {
  items: number;
  confidence: number;
  estimatedDate: string;
  simulations: SimulationPercentiles;
  simulationCount: number;
  averageThroughputPerWeek: number;
  historicalWeeks: number;
}

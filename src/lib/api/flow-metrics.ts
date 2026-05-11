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
 * Contrato legado usa `period: number` (ex: 30 = ultimos 30 dias).
 * V2 espera `period` enum 'today'|'week'|'month' OU `periodFrom`+`periodTo`
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

/**
 * Wrapper que captura erros (400, 404, 500, timeout) e retorna fallback.
 * Componentes ja tratam arrays vazios com empty states amigaveis.
 */
async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

// === Shapes empty pra fallback ===

const EMPTY_CYCLE_TIME = {
  averageDays: 0,
  p50Days: 0,
  p85Days: 0,
  sampleCount: 0,
} as unknown as CycleTimeResponse;

const EMPTY_THROUGHPUT: ThroughputResponse = {
  weeks: [],
  averagePerWeek: 0,
};

const EMPTY_WIP_AGE: WipAgeResponse = {
  cards: [],
  agingCount: 0,
  agingThresholdDays: 0,
};

const EMPTY_CFD: CfdResponse = {
  days: [],
};

const EMPTY_FLOW_DASHBOARD = {
  cycleTime: { averageDays: 0, p50Days: 0, p85Days: 0, sampleCount: 0 },
  leadTime: { averageDays: 0, p50Days: 0, p85Days: 0, sampleCount: 0 },
  throughputPerWeek: 0,
  wipAgingCount: 0,
  totalCards: 0,
  completedCards: 0,
} as unknown as FlowDashboard;

// === Mappers V2 -> shape legado ===

// V2 ThroughputResponseDto: { series: [{date, count}], total, granularity }
// Frontend ThroughputResponse: { weeks: [{weekStart, count}], averagePerWeek }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapThroughput(raw: any): ThroughputResponse {
  const series = Array.isArray(raw?.series) ? raw.series : [];
  if (series.length === 0) return EMPTY_THROUGHPUT;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weeks = series.map((p: any) => ({
    weekStart: String(p.date ?? ""),
    count: Number(p.count ?? 0),
  }));
  const total = Number(
    raw?.total ??
      weeks.reduce(
        (acc: number, w: { weekStart: string; count: number }) => acc + w.count,
        0,
      ),
  );
  const avg = weeks.length > 0 ? total / weeks.length : 0;
  return {
    weeks,
    averagePerWeek: avg,
  } as unknown as ThroughputResponse;
}

// V2 CfdResponseDto: { series: [{date, counts: {INBOX:n, READY:n, ...}}] }
// Frontend CfdResponse: { days: [{date, columns: [{name, columnId, count}]}] }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCfd(raw: any): CfdResponse {
  const series = Array.isArray(raw?.series) ? raw.series : [];
  if (series.length === 0) return EMPTY_CFD;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const days = series.map((d: any) => {
    const counts = (d?.counts ?? {}) as Record<string, number>;
    const columns = Object.entries(counts).map(([name, count]) => ({
      name,
      columnId: name,
      count: Number(count ?? 0),
    }));
    return { date: String(d.date ?? ""), columns };
  });
  return { days } as unknown as CfdResponse;
}

// V2 WipAgeResponseDto: { byStatus: [{statusCode, avgAgeHours, maxAgeHours, count}], ... }
// Frontend WipAgeResponse: { cards: [...], agingCount, agingThresholdDays }
// O frontend espera lista de tasks individuais, V2 retorna agregado. Devolvemos vazio
// (componentes mostram empty state) e mantemos contadores agregados se vierem.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWipAge(raw: any): WipAgeResponse {
  if (!raw || typeof raw !== "object") return EMPTY_WIP_AGE;
  return {
    cards: Array.isArray(raw.cards) ? raw.cards : [],
    agingCount: Number(raw.agingCount ?? 0),
    agingThresholdDays: Number(raw.agingThresholdDays ?? 0),
  };
}

// V2 dashboard shape varia; tratamos com defensividade.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFlowDashboard(raw: any): FlowDashboard {
  if (!raw || typeof raw !== "object") return EMPTY_FLOW_DASHBOARD;
  return {
    cycleTime: raw.cycleTime ?? EMPTY_CYCLE_TIME,
    leadTime: raw.leadTime ?? EMPTY_CYCLE_TIME,
    throughputPerWeek: Number(raw.throughputPerWeek ?? 0),
    wipAgingCount: Number(raw.wipAgingCount ?? 0),
    totalCards: Number(raw.totalCards ?? 0),
    completedCards: Number(raw.completedCards ?? 0),
  } as unknown as FlowDashboard;
}

async function get<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const { data } = await api.get<T>(url, params ? { params } : undefined);
  return data;
}

export const flowMetricsApi = {
  getCycleTime: async (
    projectId: string,
    period = 30,
  ): Promise<CycleTimeResponse> =>
    safe(
      get<CycleTimeResponse>(
        ENDPOINTS.FLOW_CYCLE_TIME(projectId),
        buildPeriodParams(period),
      ),
      EMPTY_CYCLE_TIME,
    ),

  getLeadTime: async (
    projectId: string,
    period = 30,
  ): Promise<LeadTimeResponse> =>
    safe(
      get<LeadTimeResponse>(
        ENDPOINTS.FLOW_LEAD_TIME(projectId),
        buildPeriodParams(period),
      ),
      EMPTY_CYCLE_TIME as unknown as LeadTimeResponse,
    ),

  getThroughput: async (
    projectId: string,
    period = 30,
  ): Promise<ThroughputResponse> => {
    const raw = await safe(
      get<unknown>(
        ENDPOINTS.FLOW_THROUGHPUT(projectId),
        buildPeriodParams(period),
      ),
      null,
    );
    return mapThroughput(raw);
  },

  getWipAge: async (projectId: string): Promise<WipAgeResponse> => {
    const raw = await safe(
      get<unknown>(ENDPOINTS.FLOW_WIP_AGE(projectId)),
      null,
    );
    return mapWipAge(raw);
  },

  getCfd: async (projectId: string, period = 30): Promise<CfdResponse> => {
    const raw = await safe(
      get<unknown>(ENDPOINTS.FLOW_CFD(projectId), buildPeriodParams(period)),
      null,
    );
    return mapCfd(raw);
  },

  getFlowDashboard: async (
    projectId: string,
    period = 30,
  ): Promise<FlowDashboard> => {
    const raw = await safe(
      get<unknown>(
        ENDPOINTS.FLOW_DASHBOARD(projectId),
        buildPeriodParams(period),
      ),
      null,
    );
    return mapFlowDashboard(raw);
  },
};

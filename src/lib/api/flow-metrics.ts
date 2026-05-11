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
 * Wrapper que captura erros (400 historico insuficiente, 404 etc) e retorna
 * um fallback "vazio" do shape esperado. Componentes ja tratam arrays vazios
 * com empty states amigaveis.
 */
async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

// Shapes vazios pra cada response — UI mostra empty state quando data nao tem itens.
const EMPTY_CYCLE_TIME: CycleTimeResponse = {
  averageDays: 0,
  p50Days: 0,
  p85Days: 0,
  sampleCount: 0,
} as unknown as CycleTimeResponse;

const EMPTY_LEAD_TIME: LeadTimeResponse =
  EMPTY_CYCLE_TIME as unknown as LeadTimeResponse;

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

const EMPTY_FLOW_DASHBOARD: FlowDashboard = {
  cycleTime: { averageDays: 0, p50Days: 0, p85Days: 0, sampleCount: 0 },
  leadTime: { averageDays: 0, p50Days: 0, p85Days: 0, sampleCount: 0 },
  throughputPerWeek: 0,
  wipAgingCount: 0,
  totalCards: 0,
  completedCards: 0,
} as unknown as FlowDashboard;

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
      EMPTY_LEAD_TIME,
    ),

  getThroughput: async (
    projectId: string,
    period = 30,
  ): Promise<ThroughputResponse> =>
    safe(
      get<ThroughputResponse>(
        ENDPOINTS.FLOW_THROUGHPUT(projectId),
        buildPeriodParams(period),
      ),
      EMPTY_THROUGHPUT,
    ),

  getWipAge: async (projectId: string): Promise<WipAgeResponse> =>
    safe(get<WipAgeResponse>(ENDPOINTS.FLOW_WIP_AGE(projectId)), EMPTY_WIP_AGE),

  getCfd: async (projectId: string, period = 30): Promise<CfdResponse> =>
    safe(
      get<CfdResponse>(
        ENDPOINTS.FLOW_CFD(projectId),
        buildPeriodParams(period),
      ),
      EMPTY_CFD,
    ),

  getFlowDashboard: async (
    projectId: string,
    period = 30,
  ): Promise<FlowDashboard> =>
    safe(
      get<FlowDashboard>(
        ENDPOINTS.FLOW_DASHBOARD(projectId),
        buildPeriodParams(period),
      ),
      EMPTY_FLOW_DASHBOARD,
    ),
};

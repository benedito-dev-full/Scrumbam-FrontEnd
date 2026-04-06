// Flow Metrics types -- aligned with backend DTOs (real contracts)
// Backend: Scrumban-Backend/src/scrumban/flow-metrics/dto/flow-metrics-response.dto.ts

export interface TimeStats {
  average: number;
  median: number;
  p85: number;
  sampleSize: number;
}

export interface CardCycleTime {
  taskId: string;
  titulo: string;
  cycleTimeDays: number;
}

export interface CycleTimeResponse {
  stats: TimeStats;
  cards: CardCycleTime[];
}

export interface CardLeadTime {
  taskId: string;
  titulo: string;
  leadTimeDays: number;
}

export interface LeadTimeResponse {
  stats: TimeStats;
  cards: CardLeadTime[];
}

export interface WeekThroughput {
  week: string; // ISO format: '2026-W12'
  count: number;
}

export interface ThroughputResponse {
  weeks: WeekThroughput[];
  averagePerWeek: number;
}

export interface CardWipAge {
  taskId: string;
  titulo: string;
  columnName: string;
  columnId: string;
  ageDays: number;
  isAging: boolean;
}

export interface WipAgeResponse {
  cards: CardWipAge[];
  agingCount: number;
  agingThresholdDays: number;
}

export interface CfdColumn {
  name: string;
  columnId: string;
  count: number;
}

export interface CfdDay {
  date: string; // YYYY-MM-DD
  columns: CfdColumn[];
}

export interface CfdResponse {
  days: CfdDay[];
}

export interface FlowDashboard {
  cycleTime: TimeStats;
  leadTime: TimeStats;
  throughputPerWeek: number;
  wipAgingCount: number;
  totalCards: number;
  completedCards: number;
}

// Analytics types -- aligned with backend DTOs

export interface PeriodComparison {
  throughputPeriod1: number;
  throughputPeriod2: number;
  variationPercent: number;
  trend: "melhoria" | "piora" | "estavel";
  period1Days: number;
  period2Days: number;
}

export interface CapacityForecast {
  backlogSize: number;
  avgWeeklyThroughput: number;
  weeksToComplete: number | null;
  estimatedCompletionDate: string | null;
  summary: string;
}

export interface StakeholderReport {
  projectId: string;
  projectNome: string;
  generatedAt: string;
  periodDays: number;
  summary: {
    totalTasks: number;
    tasksCompleted: number;
    tasksPending: number;
    tasksInProgress: number;
    completionPercent: number;
  };
  performance: {
    avgCycleTimeDays: number | null;
    throughputPerWeek: number;
    wipCount: number;
  };
  forecast: {
    backlogSize: number;
    weeksToComplete: number | null;
    estimatedCompletionDate: string | null;
  };
}

// Scrumban board constants -- aligned with backend DClasse/DTabela seeds

// Default column statuses (DTabela idClasse=-200)
export const STATUS = {
  TODO: "-201",
  DOING: "-202",
  DONE: "-203",
} as const;

// Task priorities (DTabela idClasse=-210)
export const PRIORITY = {
  HIGH: "-211",
  MEDIUM: "-212",
  LOW: "-213",
} as const;

// Task types (DTabela idClasse=-220)
export const TASK_TYPE = {
  FEATURE: "-221",
  BUG: "-222",
  IMPROVEMENT: "-223",
} as const;

// Status display config (aligned with CSS semantic variables)
export const STATUS_CONFIG: Record<string, { label: string; cssVar: string }> =
  {
    [STATUS.TODO]: {
      label: "A Fazer",
      cssVar: "--status-todo",
    },
    [STATUS.DOING]: {
      label: "Em Andamento",
      cssVar: "--status-doing",
    },
    [STATUS.DONE]: {
      label: "Concluido",
      cssVar: "--status-done",
    },
  };

// Priority display config (uses CSS semantic variables)
export const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; cssVar: string; bgClass: string }
> = {
  [PRIORITY.HIGH]: {
    label: "Alta",
    color: "var(--priority-high)",
    cssVar: "--priority-high",
    bgClass: "bg-priority-high/10 text-priority-high",
  },
  [PRIORITY.MEDIUM]: {
    label: "Media",
    color: "var(--priority-medium)",
    cssVar: "--priority-medium",
    bgClass: "bg-priority-medium/10 text-priority-medium",
  },
  [PRIORITY.LOW]: {
    label: "Baixa",
    color: "var(--priority-low)",
    cssVar: "--priority-low",
    bgClass: "bg-priority-low/10 text-priority-low",
  },
};

// Task type display config (uses CSS semantic variables)
export const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; cssVar: string; bgClass: string }
> = {
  [TASK_TYPE.FEATURE]: {
    label: "Feature",
    color: "var(--type-feature)",
    cssVar: "--type-feature",
    bgClass: "bg-type-feature/10 text-type-feature",
  },
  [TASK_TYPE.BUG]: {
    label: "Bug",
    color: "var(--type-bug)",
    cssVar: "--type-bug",
    bgClass: "bg-type-bug/10 text-type-bug",
  },
  [TASK_TYPE.IMPROVEMENT]: {
    label: "Melhoria",
    color: "var(--type-improvement)",
    cssVar: "--type-improvement",
    bgClass: "bg-type-improvement/10 text-type-improvement",
  },
};

/**
 * Maps a column chave (DTabela ID) or codigo to its semantic CSS color variable name.
 * Falls back to --status-backlog for unknown columns.
 */
export function getColumnStatusVar(
  chave: string,
  codigo?: string,
): { color: string; bg: string; isDone: boolean } {
  // Try matching by chave (seed IDs)
  const config = STATUS_CONFIG[chave];
  if (config) {
    return {
      color: config.cssVar,
      bg: `${config.cssVar}-bg`,
      isDone: chave === STATUS.DONE,
    };
  }

  // Try matching by codigo string (case-insensitive)
  const code = (codigo ?? "").toUpperCase();
  if (
    code.includes("TODO") ||
    code.includes("TO_DO") ||
    code.includes("BACKLOG")
  ) {
    return { color: "--status-todo", bg: "--status-todo-bg", isDone: false };
  }
  if (
    code.includes("DOING") ||
    code.includes("IN_PROGRESS") ||
    code.includes("WIP")
  ) {
    return { color: "--status-doing", bg: "--status-doing-bg", isDone: false };
  }
  if (
    code.includes("REVIEW") ||
    code.includes("TESTING") ||
    code.includes("QA")
  ) {
    return {
      color: "--status-review",
      bg: "--status-review-bg",
      isDone: false,
    };
  }
  if (
    code.includes("DONE") ||
    code.includes("COMPLETED") ||
    code.includes("CLOSED")
  ) {
    return { color: "--status-done", bg: "--status-done-bg", isDone: true };
  }

  return {
    color: "--status-backlog",
    bg: "--status-backlog-bg",
    isDone: false,
  };
}

export const RISK_LEVEL_CONFIG = {
  LOW: {
    label: 'Baixo',
    className: 'bg-green-500/10 text-green-600 border border-green-500/30',
    iconColor: 'text-green-500',
  },
  MEDIUM: {
    label: 'Médio',
    className: 'bg-amber-500/10 text-amber-600 border border-amber-500/30',
    iconColor: 'text-amber-500',
  },
  HIGH: {
    label: 'Alto',
    className: 'bg-red-500/10 text-red-600 border border-red-500/30',
    iconColor: 'text-red-500',
  },
} as const

export const APPROVAL_FLOW_CONFIG = {
  queued: { label: 'Em fila', className: 'bg-blue-500/10 text-blue-600 border border-blue-500/30' },
  awaiting_approval: { label: 'Aguard. aprovação', className: 'bg-purple-500/10 text-purple-600 border border-purple-500/30' },
  approved: { label: 'Aprovado', className: 'bg-green-500/10 text-green-600 border border-green-500/30' },
  rejected: { label: 'Rejeitado', className: 'bg-red-500/10 text-red-600 border border-red-500/30' },
  expired: { label: 'Expirado', className: 'bg-muted text-muted-foreground border border-border' },
} as const

export const EXECUTION_STATUS_CONFIG = {
  queued: { label: 'Em fila', className: 'bg-blue-500/10 text-blue-600 border border-blue-500/30' },
  running: { label: 'Rodando', className: 'bg-amber-500/10 text-amber-600 border border-amber-500/30' },
  awaiting_approval: { label: 'Aguard. aprovação', className: 'bg-purple-500/10 text-purple-600 border border-purple-500/30' },
  success: { label: 'Sucesso', className: 'bg-green-500/10 text-green-600 border border-green-500/30' },
  failed: { label: 'Falhou', className: 'bg-red-500/10 text-red-600 border border-red-500/30' },
  timeout: { label: 'Timeout', className: 'bg-orange-500/10 text-orange-600 border border-orange-500/30' },
  rolled_back: { label: 'Revertido', className: 'bg-muted text-muted-foreground border border-border' },
  cancelled: { label: 'Cancelado', className: 'bg-muted text-muted-foreground border border-border' },
} as const

// WIP limit thresholds
export const WIP = {
  WARNING_THRESHOLD: 0.8, // 80% - yellow warning
  BLOCKED_THRESHOLD: 1.0, // 100% - red blocked
} as const;

// Query keys for TanStack Query
export const QUERY_KEYS = {
  projects: ["projects"] as const,
  project: (id: string) => ["project", id] as const,
  projectSummaries: (orgId?: string) => ["project-summaries", orgId] as const,
  columns: (projectId: string) => ["columns", projectId] as const,
  tasks: (projectId: string, filters?: Record<string, string | undefined>) =>
    ["tasks", projectId, filters] as const,
  tags: ["tags"] as const,
  comments: (taskId: string) => ["comments", taskId] as const,
  dashboard: {
    team: (projectId: string) => ["dashboard", "team", projectId] as const,
    me: ["dashboard", "me"] as const,
    company: ["dashboard", "company"] as const,
  },
  flowMetrics: {
    cycleTime: (projectId: string, period: number) =>
      ["flow-metrics", "cycle-time", projectId, period] as const,
    leadTime: (projectId: string, period: number) =>
      ["flow-metrics", "lead-time", projectId, period] as const,
    throughput: (projectId: string, period: number) =>
      ["flow-metrics", "throughput", projectId, period] as const,
    wipAge: (projectId: string) =>
      ["flow-metrics", "wip-age", projectId] as const,
    cfd: (projectId: string, period: number) =>
      ["flow-metrics", "cfd", projectId, period] as const,
    dashboard: (projectId: string, period: number) =>
      ["flow-metrics", "dashboard", projectId, period] as const,
  },
  forecast: (projectId: string, items: number, confidence: number) =>
    ["forecast", projectId, items, confidence] as const,
  retrospective: (projectId: string, period: number) =>
    ["retrospective", projectId, period] as const,
  analytics: {
    compare: (projectId: string, p1: number, p2: number) =>
      ["analytics", "compare", projectId, p1, p2] as const,
    forecast: (projectId: string) =>
      ["analytics", "capacity-forecast", projectId] as const,
    stakeholder: (projectId: string, period: number) =>
      ["analytics", "stakeholder", projectId, period] as const,
  },
  intentions: {
    list: (projectId: string) => ["intentions", projectId] as const,
    detail: (id: string) => ["intentions", "detail", id] as const,
  },
  organization: (orgId: string) => ["organization", orgId] as const,
  orgMembers: (orgId: string) => ["org-members", orgId] as const,
  me: ["me"] as const,
  apiKey: (projectId: string) => ["api-key", projectId] as const,
  search: (query: string) => ["search", query] as const,
  agents: (status?: string) => ["agents", status ?? "all"] as const,
  agent: (id: string) => ["agent", id] as const,
} as const;

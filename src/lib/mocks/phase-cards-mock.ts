/**
 * Mock data para o PhaseCardsTab.
 *
 * Substituir por chamadas reais (phasesApi.listByProject + getMetrics + getCriticalTasks)
 * quando o design estiver aprovado. Estrutura ja compativel com Phase + PhaseMetrics
 * para troca quase 1:1.
 */

export type PhaseStatus = "on-track" | "at-risk" | "blocked" | "done";

export interface PhaseAssignee {
  id: string;
  name: string;
  initials: string;
  /** Cor de fundo para o fallback (sem foto). */
  color: string;
}

export interface PhaseRecentActivity {
  taskTitle: string;
  /** ISO timestamp. */
  timestamp: string;
}

export interface PhaseCardData {
  id: string;
  name: string;
  description?: string;
  status: PhaseStatus;
  metrics: {
    total: number;
    done: number;
    executing: number;
    failed: number;
    pending: number;
    percent: number;
  };
  assignees: PhaseAssignee[];
  lastActivity: PhaseRecentActivity;
  /** ISO date. */
  deadline?: string;
  subPhasesCount: number;
}

const NOW = Date.now();
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

const u = (id: string, name: string, color: string): PhaseAssignee => ({
  id,
  name,
  initials: name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase(),
  color,
});

const USERS = {
  bene: u("u1", "Benedito Bittencourt", "#8b5cf6"),
  ana: u("u2", "Ana Souza", "#10b981"),
  pedro: u("u3", "Pedro Lima", "#f59e0b"),
  marina: u("u4", "Marina Costa", "#06b6d4"),
  lucas: u("u5", "Lucas Almeida", "#f43f5e"),
  carla: u("u6", "Carla Mendes", "#3b82f6"),
};

export const MOCK_PHASE_CARDS: PhaseCardData[] = [
  {
    id: "phase-1",
    name: "Setup e Infraestrutura",
    description: "Provisionamento Dokploy, CI/CD, secrets, healthchecks.",
    status: "done",
    metrics: {
      total: 18,
      done: 18,
      executing: 0,
      failed: 0,
      pending: 0,
      percent: 100,
    },
    assignees: [USERS.bene, USERS.ana],
    lastActivity: {
      taskTitle: "Healthcheck do worker BullMQ em producao",
      timestamp: new Date(NOW - 3 * DAY).toISOString(),
    },
    deadline: new Date(NOW - 5 * DAY).toISOString(),
    subPhasesCount: 0,
  },
  {
    id: "phase-2",
    name: "Backend — Auth & RBAC",
    description: "JWT, refresh tokens, DVincula duplo, guards e middlewares.",
    status: "on-track",
    metrics: {
      total: 32,
      done: 25,
      executing: 3,
      failed: 0,
      pending: 4,
      percent: 78,
    },
    assignees: [USERS.bene, USERS.pedro, USERS.ana],
    lastActivity: {
      taskTitle: "Refresh token rotation com blacklist no Redis",
      timestamp: new Date(NOW - 2 * HOUR).toISOString(),
    },
    deadline: new Date(NOW + 7 * DAY).toISOString(),
    subPhasesCount: 2,
  },
  {
    id: "phase-3",
    name: "Backend — Core APIs",
    description:
      "Endpoints genericos: /entidades, /tabelas, /tasks, /projects.",
    status: "on-track",
    metrics: {
      total: 64,
      done: 33,
      executing: 5,
      failed: 1,
      pending: 25,
      percent: 52,
    },
    assignees: [USERS.bene, USERS.marina, USERS.pedro, USERS.ana],
    lastActivity: {
      taskTitle: "Filtro idClasse polimorfico no /entidades",
      timestamp: new Date(NOW - 45 * 60 * 1000).toISOString(),
    },
    deadline: new Date(NOW + 18 * DAY).toISOString(),
    subPhasesCount: 4,
  },
  {
    id: "phase-4",
    name: "Backend — Integracoes",
    description: "Telegram, MCP, webhooks HMAC, automation Claude Code.",
    status: "at-risk",
    metrics: {
      total: 41,
      done: 9,
      executing: 2,
      failed: 4,
      pending: 26,
      percent: 23,
    },
    assignees: [USERS.lucas, USERS.bene],
    lastActivity: {
      taskTitle: "Risk gate F13 — 58 testes adversariais",
      timestamp: new Date(NOW - 6 * HOUR).toISOString(),
    },
    deadline: new Date(NOW + 4 * DAY).toISOString(),
    subPhasesCount: 3,
  },
  {
    id: "phase-5",
    name: "Frontend — Foundation",
    description: "Next.js 15, design system, autenticacao, layout app shell.",
    status: "on-track",
    metrics: {
      total: 27,
      done: 16,
      executing: 2,
      failed: 0,
      pending: 9,
      percent: 60,
    },
    assignees: [USERS.bene, USERS.carla],
    lastActivity: {
      taskTitle: "Side nav colapsavel com badges por projeto",
      timestamp: new Date(NOW - 90 * 60 * 1000).toISOString(),
    },
    deadline: new Date(NOW + 11 * DAY).toISOString(),
    subPhasesCount: 1,
  },
  {
    id: "phase-6",
    name: "Frontend — Paineis",
    description: "Workspace, projetos, intentions, flow metrics, hill chart.",
    status: "on-track",
    metrics: {
      total: 38,
      done: 13,
      executing: 4,
      failed: 1,
      pending: 20,
      percent: 35,
    },
    assignees: [USERS.bene, USERS.carla, USERS.marina],
    lastActivity: {
      taskTitle: "Aba Issues com agrupamento por fase (ADR-V2-047)",
      timestamp: new Date(NOW - 18 * HOUR).toISOString(),
    },
    deadline: new Date(NOW + 22 * DAY).toISOString(),
    subPhasesCount: 5,
  },
  {
    id: "phase-7",
    name: "QA & Polishing",
    description: "Golden tests, performance budgets, acessibilidade, docs.",
    status: "blocked",
    metrics: {
      total: 22,
      done: 1,
      executing: 0,
      failed: 2,
      pending: 19,
      percent: 5,
    },
    assignees: [USERS.ana],
    lastActivity: {
      taskTitle: "Bloqueado por dependencia em Backend — Integracoes",
      timestamp: new Date(NOW - 2 * DAY).toISOString(),
    },
    deadline: new Date(NOW + 35 * DAY).toISOString(),
    subPhasesCount: 0,
  },
];

/** Tasks "soltas" — sem idPai. Render no card "Sem bloco". */
export const MOCK_ORPHAN_COUNT = 7;

/** KPIs agregados (calculados, mas ja prontos pra evitar recompute). */
export function aggregateKpis(phases: PhaseCardData[]) {
  const sum = phases.reduce(
    (acc, p) => ({
      total: acc.total + p.metrics.total,
      done: acc.done + p.metrics.done,
      executing: acc.executing + p.metrics.executing,
      failed: acc.failed + p.metrics.failed,
      pending: acc.pending + p.metrics.pending,
    }),
    { total: 0, done: 0, executing: 0, failed: 0, pending: 0 },
  );
  const percent = sum.total > 0 ? Math.round((sum.done / sum.total) * 100) : 0;
  const atRisk = phases.filter(
    (p) => p.status === "at-risk" || p.status === "blocked",
  ).length;
  // Prazo mais proximo dentre fases nao concluidas.
  const nextDeadline = phases
    .filter((p) => p.deadline && p.status !== "done")
    .map((p) => new Date(p.deadline!).getTime())
    .sort((a, b) => a - b)[0];
  return { ...sum, percent, atRisk, nextDeadline };
}

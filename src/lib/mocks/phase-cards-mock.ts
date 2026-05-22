/**
 * Mock data para o PhaseCardsTab.
 *
 * Substituir por chamadas reais (phasesApi.listByProject + getMetrics + getCriticalTasks)
 * quando o design estiver aprovado. Estrutura ja compativel com Phase + PhaseMetrics
 * para troca quase 1:1.
 */

export type PhaseStatus = "on-track" | "at-risk" | "blocked" | "done";
export type PhasePriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus =
  | "inbox"
  | "ready"
  | "executing"
  | "done"
  | "failed"
  | "cancelled";

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

export interface PhaseTaskMock {
  id: string;
  title: string;
  status: TaskStatus;
  assignee?: PhaseAssignee;
  /** ISO timestamp. */
  updatedAt: string;
}

export interface PhaseCardData {
  id: string;
  name: string;
  description?: string;
  status: PhaseStatus;
  /** Prioridade definida pelo PO/lider. Usado para ordenacao. */
  priority: PhasePriority;
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
  /** Tasks da fase (mockadas para drill-in). */
  tasks: PhaseTaskMock[];
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

function makeTasks(
  phaseId: string,
  rows: Array<
    [
      title: string,
      status: TaskStatus,
      hoursAgo: number,
      assignee?: PhaseAssignee,
    ]
  >,
): PhaseTaskMock[] {
  return rows.map(([title, status, hoursAgo, assignee], i) => ({
    id: `${phaseId}-t${i + 1}`,
    title,
    status,
    assignee,
    updatedAt: new Date(NOW - hoursAgo * HOUR).toISOString(),
  }));
}

export const MOCK_PHASE_CARDS: PhaseCardData[] = [
  {
    id: "phase-1",
    name: "Setup e Infraestrutura",
    description: "Provisionamento Dokploy, CI/CD, secrets, healthchecks.",
    status: "done",
    priority: "low",
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
    tasks: makeTasks("phase-1", [
      ["Provisionar VPS e Dokploy", "done", 72, USERS.bene],
      ["Configurar pipelines de CI no GitHub Actions", "done", 60, USERS.ana],
      ["Subir Postgres com backups automaticos", "done", 48, USERS.bene],
      ["Definir secrets via Doppler", "done", 30, USERS.ana],
      ["Healthcheck do worker BullMQ em producao", "done", 24, USERS.bene],
    ]),
  },
  {
    id: "phase-2",
    name: "Backend — Auth & RBAC",
    description: "JWT, refresh tokens, DVincula duplo, guards e middlewares.",
    status: "on-track",
    priority: "medium",
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
    tasks: makeTasks("phase-2", [
      [
        "Refresh token rotation com blacklist no Redis",
        "executing",
        2,
        USERS.bene,
      ],
      [
        "JwtAuthGuard com tenant context propagation",
        "executing",
        4,
        USERS.pedro,
      ],
      [
        "DVincula duplo: papel global + papel por projeto",
        "executing",
        8,
        USERS.ana,
      ],
      ["Endpoint /auth/me com claims canonicos", "done", 26, USERS.bene],
      ["Login com magic link via Telegram", "ready", 14, USERS.pedro],
      ["Rate limit de login por IP", "inbox", 12, USERS.ana],
    ]),
  },
  {
    id: "phase-3",
    name: "Backend — Core APIs",
    description:
      "Endpoints genericos: /entidades, /tabelas, /tasks, /projects.",
    status: "on-track",
    priority: "high",
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
    tasks: makeTasks("phase-3", [
      ["Filtro idClasse polimorfico no /entidades", "executing", 1, USERS.bene],
      ["CRUD /tabelas com paginacao cursor", "executing", 3, USERS.marina],
      ["Soft delete em /tasks com auditoria", "done", 28, USERS.pedro],
      ["Falha intermitente no /projects/:id/tree", "failed", 6, USERS.ana],
      ["Validacao Zod no DTO de criacao", "ready", 18, USERS.marina],
      ["Webhook signature validation", "inbox", 30, USERS.bene],
    ]),
  },
  {
    id: "phase-4",
    name: "Backend — Integracoes",
    description: "Telegram, MCP, webhooks HMAC, automation Claude Code.",
    status: "at-risk",
    priority: "urgent",
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
    tasks: makeTasks("phase-4", [
      ["Risk gate F13 — 58 testes adversariais", "executing", 6, USERS.lucas],
      ["Worker MCP travando em concurrency=4", "failed", 10, USERS.bene],
      ["Telegram listener com voz Groq Whisper", "failed", 22, USERS.lucas],
      ["Webhook outbound HMAC com retry expo", "executing", 14, USERS.bene],
      ["Falha no parse de JSON do MCP /resources", "failed", 28, USERS.lucas],
      ["Automation Claude Code — sandbox initial", "inbox", 40, USERS.bene],
      ["Reentry de webhook bloqueado", "failed", 50, USERS.lucas],
    ]),
  },
  {
    id: "phase-5",
    name: "Frontend — Foundation",
    description: "Next.js 15, design system, autenticacao, layout app shell.",
    status: "on-track",
    priority: "medium",
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
    tasks: makeTasks("phase-5", [
      [
        "Side nav colapsavel com badges por projeto",
        "executing",
        1,
        USERS.carla,
      ],
      ["Auth flow com refresh transparente", "executing", 3, USERS.bene],
      ["Tema dark/light com tokens semanticos", "done", 36, USERS.carla],
      ["Layout shell com breadcrumb dinamico", "done", 50, USERS.bene],
      ["Configurar Tailwind 4 com plugin custom", "ready", 24, USERS.carla],
    ]),
  },
  {
    id: "phase-6",
    name: "Frontend — Paineis",
    description: "Workspace, projetos, intentions, flow metrics, hill chart.",
    status: "on-track",
    priority: "high",
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
    tasks: makeTasks("phase-6", [
      ["Aba Issues como dashboard de cards", "executing", 0.5, USERS.bene],
      ["Drill-in de fase com lista de tasks", "executing", 1, USERS.bene],
      ["Hill chart com drag interactivo", "executing", 8, USERS.carla],
      ["Flow metrics com cycle time chart", "executing", 12, USERS.marina],
      ["Modal de criar intention via voz", "failed", 24, USERS.carla],
      ["Tela de detalhe da intention", "done", 48, USERS.bene],
      ["Filtros avancados em /intentions", "ready", 30, USERS.marina],
      ["Telegram bot inline no painel", "inbox", 60, USERS.carla],
    ]),
  },
  {
    id: "phase-7",
    name: "QA & Polishing",
    description: "Golden tests, performance budgets, acessibilidade, docs.",
    status: "blocked",
    priority: "urgent",
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
    tasks: makeTasks("phase-7", [
      ["Bloqueado: aguarda Backend — Integracoes", "failed", 48, USERS.ana],
      ["Performance budget no Lighthouse CI", "failed", 70, USERS.ana],
      ["Configurar Playwright para golden tests", "done", 96, USERS.ana],
      ["Acessibilidade WCAG 2.1 AA", "inbox", 100, USERS.ana],
      ["Documentar API com OpenAPI 3.1", "inbox", 110, USERS.ana],
    ]),
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

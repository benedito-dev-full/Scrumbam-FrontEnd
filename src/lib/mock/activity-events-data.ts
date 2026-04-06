import type { ActivityEvent } from "@/types/intention";

// ============================================================
// Helper -- datas relativas para mock realista
// ============================================================

function hoursAgo(n: number): string {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ============================================================
// 15 Activity Events -- timeline de atividade dos projetos
// ============================================================

export const MOCK_ACTIVITY_EVENTS: ActivityEvent[] = [
  {
    id: "evt-001",
    tipo: "intention.completed",
    projectSlug: "devari-backend",
    intentionTitle: "Fix N+1 query no endpoint /entidades",
    intentionId: "int-009",
    timestamp: hoursAgo(4),
    details: {
      prUrl: "https://github.com/devari/backend/pull/42",
      actorName: "devari-backend",
    },
  },
  {
    id: "evt-002",
    tipo: "intention.executing",
    projectSlug: "devari-backend",
    intentionTitle: "Cache Redis para dashboards",
    intentionId: "int-007",
    timestamp: hoursAgo(2),
    details: {
      actorName: "devari-backend",
    },
  },
  {
    id: "evt-003",
    tipo: "intention.executing",
    projectSlug: "scrumban-be",
    intentionTitle: "Modulo de templates de email",
    intentionId: "int-008",
    timestamp: hoursAgo(1),
    details: {
      actorName: "scrumban-be",
    },
  },
  {
    id: "evt-004",
    tipo: "intention.ready",
    projectSlug: "devari-backend",
    intentionTitle: "Endpoint de resumo por sprint",
    intentionId: "int-004",
    timestamp: daysAgo(1),
    details: {
      actorName: "Devari Admin",
    },
  },
  {
    id: "evt-005",
    tipo: "intention.created",
    projectSlug: "scrumban-be",
    intentionTitle: "Corrigir calculo de cycle time",
    intentionId: "int-005",
    timestamp: daysAgo(1),
    details: {
      actorName: "Devari Admin",
    },
  },
  {
    id: "evt-006",
    tipo: "intention.completed",
    projectSlug: "scrumban-be",
    intentionTitle: "Implementar PrismaService padrao",
    intentionId: "int-010",
    timestamp: daysAgo(1),
    details: {
      prUrl: "https://github.com/devari/scrumban-be/pull/15",
      actorName: "scrumban-be",
    },
  },
  {
    id: "evt-007",
    tipo: "intention.completed",
    projectSlug: "devari-backend",
    intentionTitle: "Migrar DatabaseService para PrismaService",
    intentionId: "int-011",
    timestamp: daysAgo(2),
    details: {
      prUrl: "https://github.com/devari/backend/pull/38",
      actorName: "devari-backend",
    },
  },
  {
    id: "evt-008",
    tipo: "intention.failed",
    projectSlug: "devari-backend",
    intentionTitle: "Autenticacao biometrica no mobile",
    intentionId: "int-012",
    timestamp: daysAgo(2),
    details: {
      motivo:
        "Dependencia react-native-biometrics incompativel com Expo SDK 52",
      actorName: "devari-backend",
    },
  },
  {
    id: "evt-009",
    tipo: "intention.ready",
    projectSlug: "scrumban-be",
    intentionTitle: "Webhook de notificacao Slack",
    intentionId: "int-006",
    timestamp: daysAgo(2),
    details: {
      actorName: "Devari Admin",
    },
  },
  {
    id: "evt-010",
    tipo: "intention.created",
    projectSlug: "devari-backend",
    intentionTitle: "Cache Redis para dashboards",
    intentionId: "int-007",
    timestamp: daysAgo(2),
    details: {
      actorName: "Devari Admin",
    },
  },
  {
    id: "evt-011",
    tipo: "intention.cancelled",
    projectSlug: "scrumban-be",
    intentionTitle: "Migrar para Fastify",
    intentionId: "int-cancelled-1",
    timestamp: daysAgo(3),
    details: {
      motivo: "Decidimos manter Express -- complexidade nao justifica",
      actorName: "Devari Admin",
    },
  },
  {
    id: "evt-012",
    tipo: "intention.created",
    projectSlug: "scrumban-be",
    intentionTitle: "Modulo de templates de email",
    intentionId: "int-008",
    timestamp: daysAgo(3),
    details: {
      actorName: "Devari Admin",
    },
  },
  {
    id: "evt-013",
    tipo: "intention.validating",
    projectSlug: "devari-backend",
    intentionTitle: "Endpoint de resumo por sprint",
    intentionId: "int-004",
    timestamp: daysAgo(1),
    details: {
      actorName: "Devari Admin",
    },
  },
  {
    id: "evt-014",
    tipo: "intention.validated",
    projectSlug: "devari-backend",
    intentionTitle: "Fix N+1 query no endpoint /entidades",
    intentionId: "int-009",
    timestamp: hoursAgo(3),
    details: {
      actorName: "Devari Admin",
    },
  },
  {
    id: "evt-015",
    tipo: "intention.discarded",
    projectSlug: "scrumban-be",
    intentionTitle: "Dashboard de vendas mensal com graficos",
    intentionId: "int-003",
    timestamp: daysAgo(5),
    details: {
      motivo: "Duplicada -- ja existe intencao similar int-004",
      actorName: "Devari Admin",
    },
  },
];

import type { IntentionDocument, IntentionCanal } from "@/types/intention";

// ============================================================
// Helper -- datas relativas para mock realista
// ============================================================

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function hoursAgo(n: number): string {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

function minutesAgo(n: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - n);
  return d.toISOString();
}

// ============================================================
// 12 Intencoes V3 -- repositorio passivo
// ============================================================

export const MOCK_INTENTIONS: IntentionDocument[] = [
  // ---- INBOX (3) -- material bruto, precisa refinamento ----

  {
    id: "int-001",
    title: "Filtro por regiao no relatorio de vendas",
    status: "inbox",
    type: "code",
    priority: "medium",
    canal: "whatsapp",
    projectSlug: null,
    deliverables: null,
    problema:
      "Usuarios pedem filtro por regiao nos relatorios. Atualmente so filtra por periodo.",
    contexto: "",
    solucaoProposta: "",
    criteriosAceite: [],
    naoObjetivos: [],
    riscos: [],
    apetiteDias: 0,
    createdBy: "Devari Admin",
    timeline: [
      {
        id: "t1",
        timestamp: minutesAgo(45),
        actor: "WhatsApp Bot",
        actorType: "system",
        action: "Intencao capturada via WhatsApp",
      },
    ],
    hillPosition: 5,
    createdAt: minutesAgo(45),
    updatedAt: minutesAgo(45),
    inboxAt: minutesAgo(45),
    readyAt: null,
    executingAt: null,
    completedAt: null,
  },

  {
    id: "int-002",
    title: "Bug no login com Google OAuth",
    status: "inbox",
    type: "code",
    priority: "medium",
    canal: "email",
    projectSlug: null,
    deliverables: null,
    problema:
      "Redirect loop ao tentar login com Google. Reportado por 3 usuarios diferentes.",
    contexto: "",
    solucaoProposta: "",
    criteriosAceite: [],
    naoObjetivos: [],
    riscos: [],
    apetiteDias: 0,
    createdBy: "Devari Admin",
    timeline: [
      {
        id: "t1",
        timestamp: hoursAgo(5),
        actor: "Email Parser",
        actorType: "system",
        action: "Intencao capturada via email de suporte",
      },
    ],
    hillPosition: 3,
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(5),
    inboxAt: hoursAgo(5),
    readyAt: null,
    executingAt: null,
    completedAt: null,
  },

  {
    id: "int-003",
    title: "Dashboard de vendas mensal com graficos",
    status: "inbox",
    type: "code",
    priority: "medium",
    canal: "slack",
    projectSlug: null,
    deliverables: null,
    problema:
      "Time comercial precisa de dashboard com metricas de vendas por mes. Atualmente consultam planilha manual.",
    contexto: "",
    solucaoProposta: "",
    criteriosAceite: [],
    naoObjetivos: [],
    riscos: [],
    apetiteDias: 0,
    createdBy: "Devari Admin",
    timeline: [
      {
        id: "t1",
        timestamp: hoursAgo(8),
        actor: "Slack Bot",
        actorType: "system",
        action: "Intencao capturada via canal #produto no Slack",
      },
    ],
    hillPosition: 2,
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(8),
    inboxAt: hoursAgo(8),
    readyAt: null,
    executingAt: null,
    completedAt: null,
  },

  // ---- READY (4) -- refinadas, disponiveis para projeto puxar ----

  {
    id: "int-004",
    title: "Endpoint de resumo por sprint",
    status: "ready",
    type: "code",
    priority: "high",
    canal: "web",
    projectSlug: "2",
    deliverables: null,
    problema:
      "Frontend precisa de endpoint que agregue metricas por sprint (velocity, burndown). Atualmente calcula no client com multiplas queries.",
    contexto:
      "Backend ja tem DashboardService com groupBy. Falta endpoint especifico que retorne dados pre-agregados por sprint.",
    solucaoProposta:
      "Criar GET /dashboards/:projectId/sprint-summary que retorna velocity, burndown e cycle time por sprint.",
    criteriosAceite: [
      "Endpoint retorna velocity da sprint",
      "Inclui dados de burndown (planejado vs realizado)",
      "Cycle time medio por sprint",
      "Cache de 5min para evitar queries repetidas",
    ],
    naoObjetivos: ["NAO criar frontend do burndown chart nesta intencao"],
    riscos: ["Query pode ser lenta se sprint tiver muitas tasks (>200)"],
    apetiteDias: 3,
    createdBy: "Devari Admin",
    timeline: [
      {
        id: "t1",
        timestamp: daysAgo(2),
        actor: "Devari Admin",
        actorType: "human",
        action: "Criou intencao",
      },
      {
        id: "t2",
        timestamp: daysAgo(1),
        actor: "Devari Admin",
        actorType: "human",
        action: "Refinou documento -- pronto para execucao",
      },
    ],
    hillPosition: 25,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    inboxAt: daysAgo(2),
    readyAt: daysAgo(1),
    executingAt: null,
    completedAt: null,
  },

  {
    id: "int-005",
    title: "Corrigir calculo de cycle time",
    status: "ready",
    type: "code",
    priority: "urgent",
    canal: "web",
    projectSlug: "2",
    deliverables: null,
    problema:
      "Cycle time esta contando tempo em colunas 'paused'. Deveria contar apenas tempo em colunas ativas (doing, review).",
    contexto:
      "FlowMetricsService.getCycleTime() itera DEvento CARD_MOVEMENT. Nao filtra colunas pausadas.",
    solucaoProposta:
      "Adicionar filtro de colunas ativas no calculo. Colunas com metaDados.paused=true devem ser excluidas.",
    criteriosAceite: [
      "Cycle time exclui tempo em colunas pausadas",
      "Testes unitarios cobrindo cenario com pause",
      "Dashboard de metricas atualizado",
    ],
    naoObjetivos: [],
    riscos: [],
    apetiteDias: 1,
    createdBy: "Devari Admin",
    timeline: [
      {
        id: "t1",
        timestamp: daysAgo(1),
        actor: "Devari Admin",
        actorType: "human",
        action: "Criou e refinou intencao",
      },
    ],
    hillPosition: 20,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    inboxAt: daysAgo(1),
    readyAt: daysAgo(1),
    executingAt: null,
    completedAt: null,
  },

  {
    id: "int-006",
    title: "Webhook de notificacao Slack",
    status: "ready",
    type: "code",
    priority: "medium",
    canal: "api",
    projectSlug: "2",
    deliverables: null,
    problema:
      "Equipe nao recebe notificacao quando card muda de status. Precisam checar o board manualmente.",
    contexto:
      "Backend ja tem EventProducerService e sistema de webhooks. Falta criar webhook especifico para Slack.",
    solucaoProposta:
      "Criar webhook handler que formata eventos de CARD_MOVEMENT como Slack Block Kit e envia para webhook URL configurado.",
    criteriosAceite: [
      "Notificacao Slack ao mover card entre colunas",
      "Formato Block Kit com titulo, projeto, coluna from/to",
      "Configuracao de webhook URL por projeto",
    ],
    naoObjetivos: ["NAO implementar Slack OAuth (usar webhook simples)"],
    riscos: ["Rate limit do Slack (1 msg/seg por webhook)"],
    apetiteDias: 2,
    createdBy: "Devari Admin",
    timeline: [
      {
        id: "t1",
        timestamp: daysAgo(3),
        actor: "Devari Admin",
        actorType: "human",
        action: "Criou intencao via API",
      },
      {
        id: "t2",
        timestamp: daysAgo(2),
        actor: "Devari Admin",
        actorType: "human",
        action: "Refinou criterios de aceite",
      },
    ],
    hillPosition: 18,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
    inboxAt: daysAgo(3),
    readyAt: daysAgo(2),
    executingAt: null,
    completedAt: null,
  },

  {
    id: "int-013",
    title: "Adicionar suporte a multiplos idiomas",
    status: "ready",
    type: "code",
    priority: "low",
    canal: "web",
    projectSlug: "2",
    deliverables: null,
    problema:
      "Plataforma so esta disponivel em portugues. Clientes LATAM pedem suporte a espanhol e ingles.",
    contexto:
      "Frontend usa Next.js que tem i18n nativo. Backend retorna mensagens hardcoded.",
    solucaoProposta:
      "Implementar next-intl no frontend com 3 locales (pt-BR, en, es). Backend: extrair mensagens para JSON.",
    criteriosAceite: [
      "Selector de idioma no header",
      "3 locales: pt-BR (default), en, es",
      "Todas strings da UI traduzidas",
    ],
    naoObjetivos: ["NAO traduzir documentacao interna"],
    riscos: ["Volume de strings para traduzir (200+)"],
    apetiteDias: 7,
    createdBy: "Devari Admin",
    timeline: [
      {
        id: "t1",
        timestamp: daysAgo(4),
        actor: "Devari Admin",
        actorType: "human",
        action: "Criou e refinou intencao",
      },
    ],
    hillPosition: 15,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
    inboxAt: daysAgo(4),
    readyAt: daysAgo(4),
    executingAt: null,
    completedAt: null,
  },

  // ---- EXECUTING (2) -- projeto trabalhando, operacao atomica ----

  {
    id: "int-007",
    title: "Cache Redis para dashboards",
    status: "executing",
    type: "code",
    priority: "high",
    canal: "web",
    projectSlug: "2",
    deliverables: null,
    problema:
      "Dashboard principal leva 3-4s para carregar. Queries de agregacao pesadas executam a cada request.",
    contexto:
      "Redis ja esta configurado (BullMQ). Falta usar para cache de metricas agregadas.",
    solucaoProposta:
      "Adicionar cache Redis com TTL de 5min nos endpoints de dashboard. Invalidar cache quando card muda de status.",
    criteriosAceite: [
      "Dashboard carrega em <500ms (cache hit)",
      "TTL de 5 minutos",
      "Cache invalidado ao mover card",
      "Fallback para query direta se Redis offline",
    ],
    naoObjetivos: [],
    riscos: ["Dados levemente defasados (max 5min)"],
    apetiteDias: 2,
    createdBy: "Devari Admin",
    timeline: [
      {
        id: "t1",
        timestamp: hoursAgo(3),
        actor: "Devari Admin",
        actorType: "human",
        action: "Intencao movida para READY",
      },
      {
        id: "t2",
        timestamp: hoursAgo(2),
        actor: "devari-backend",
        actorType: "system",
        action: "Projeto puxou intencao -- iniciando execucao",
      },
    ],
    hillPosition: 70,
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(2),
    inboxAt: daysAgo(2),
    readyAt: daysAgo(1),
    executingAt: hoursAgo(2),
    completedAt: null,
  },

  {
    id: "int-008",
    title: "Modulo de templates de email",
    status: "executing",
    type: "code",
    priority: "medium",
    canal: "web",
    projectSlug: "2",
    deliverables: null,
    problema:
      "Emails transacionais sao strings hardcoded. Nao tem template engine, nao tem preview, nao tem versionamento.",
    contexto:
      "MailService usa @nestjs/mailer com strings inline. Precisamos de templates Handlebars com layout base.",
    solucaoProposta:
      "Criar modulo de templates com Handlebars. Layout base responsivo. CRUD de templates com preview.",
    criteriosAceite: [
      "Template engine Handlebars integrado",
      "Layout base responsivo (header + footer)",
      "3 templates iniciais: welcome, reset-password, notification",
      "Endpoint de preview (renderiza sem enviar)",
    ],
    naoObjetivos: ["NAO implementar editor visual de templates"],
    riscos: [],
    apetiteDias: 3,
    createdBy: "Devari Admin",
    timeline: [
      {
        id: "t1",
        timestamp: hoursAgo(5),
        actor: "Devari Admin",
        actorType: "human",
        action: "Intencao movida para READY",
      },
      {
        id: "t2",
        timestamp: hoursAgo(1),
        actor: "scrumban-be",
        actorType: "system",
        action: "Projeto puxou intencao -- iniciando execucao",
      },
    ],
    hillPosition: 70,
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(1),
    inboxAt: daysAgo(3),
    readyAt: daysAgo(2),
    executingAt: hoursAgo(1),
    completedAt: null,
  },

  // ---- DONE (3) -- projeto reportou conclusao ----

  {
    id: "int-009",
    title: "Fix N+1 query no endpoint /entidades",
    status: "done",
    type: "code",
    priority: "urgent",
    canal: "web",
    projectSlug: "2",
    deliverables: {
      prUrl: "https://github.com/devari/backend/pull/42",
      prNumber: 42,
      summary: "Substituido loop por include Prisma. Query time: 2.3s -> 45ms.",
      filesChanged: 3,
    },
    problema:
      "Endpoint /entidades faz N+1 queries. Com 500 entidades, leva 4-5s.",
    contexto: "EntidadeService.findAll() usa loop com findFirst para vinculos.",
    solucaoProposta:
      "Substituir loop por Prisma include. Adicionar select para reduzir payload.",
    criteriosAceite: [
      "Query time <200ms para 500 entidades",
      "Zero N+1 queries (verificado com DATABASE_LOGGING)",
    ],
    naoObjetivos: [],
    riscos: [],
    apetiteDias: 1,
    createdBy: "Devari Admin",
    timeline: [
      {
        id: "t1",
        timestamp: hoursAgo(6),
        actor: "Devari Admin",
        actorType: "human",
        action: "Criou e refinou intencao",
      },
      {
        id: "t2",
        timestamp: hoursAgo(5),
        actor: "devari-backend",
        actorType: "system",
        action: "Projeto puxou e executou",
      },
      {
        id: "t3",
        timestamp: hoursAgo(4),
        actor: "devari-backend",
        actorType: "system",
        action: "Concluido -- PR #42 aberto",
      },
    ],
    hillPosition: 100,
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(4),
    inboxAt: hoursAgo(6),
    readyAt: hoursAgo(6),
    executingAt: hoursAgo(5),
    completedAt: hoursAgo(4),
  },

  {
    id: "int-010",
    title: "Documentacao da API publica",
    status: "done",
    type: "documentation",
    priority: "medium",
    canal: "web",
    projectSlug: "2",
    deliverables: {
      prUrl: "https://github.com/devari/scrumban/pull/55",
      prNumber: 55,
      summary: "Swagger completo para 24 endpoints. README atualizado.",
      filesChanged: 8,
    },
    problema:
      "API publica nao tem documentacao. Parceiros integram por tentativa e erro.",
    contexto: "NestJS com Swagger parcial. Faltam decorators em 15 endpoints.",
    solucaoProposta:
      "Adicionar @ApiOperation, @ApiResponse em todos endpoints publicos. Atualizar README com exemplos.",
    criteriosAceite: [
      "Swagger completo para todos endpoints",
      "README com exemplos de curl",
    ],
    naoObjetivos: [],
    riscos: [],
    apetiteDias: 2,
    createdBy: "Devari Admin",
    timeline: [
      {
        id: "t1",
        timestamp: daysAgo(2),
        actor: "Devari Admin",
        actorType: "human",
        action: "Criou intencao",
      },
      {
        id: "t2",
        timestamp: daysAgo(1),
        actor: "scrumban-be",
        actorType: "system",
        action: "Concluido -- PR #55 aberto",
      },
    ],
    hillPosition: 100,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    inboxAt: daysAgo(2),
    readyAt: daysAgo(2),
    executingAt: daysAgo(1),
    completedAt: daysAgo(1),
  },

  {
    id: "int-014",
    title: "Corrigir bug no upload de imagens >2MB",
    status: "done",
    type: "code",
    priority: "urgent",
    canal: "web",
    projectSlug: "2",
    deliverables: {
      prUrl: "https://github.com/devari/backend/pull/41",
      prNumber: 41,
      summary: "Limite aumentado para 10MB. Validacao no frontend adicionada.",
      filesChanged: 2,
    },
    problema:
      "Upload de imagens >2MB falha silenciosamente. Reportado 5x esta semana.",
    contexto: "Multer configurado com limite de 2MB. Frontend nao valida.",
    solucaoProposta:
      "Aumentar limite para 10MB. Adicionar validacao de tamanho no frontend com feedback.",
    criteriosAceite: [
      "Limite de 10MB no backend",
      "Validacao no frontend antes do upload",
      "Mensagem de erro clara",
    ],
    naoObjetivos: [],
    riscos: [],
    apetiteDias: 1,
    createdBy: "Devari Admin",
    timeline: [
      {
        id: "t1",
        timestamp: daysAgo(3),
        actor: "Devari Admin",
        actorType: "human",
        action: "Criou intencao (bug urgente)",
      },
      {
        id: "t2",
        timestamp: daysAgo(3),
        actor: "devari-backend",
        actorType: "system",
        action: "Concluido em 8 minutos -- PR #41",
      },
    ],
    hillPosition: 100,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    inboxAt: daysAgo(3),
    readyAt: daysAgo(3),
    executingAt: daysAgo(3),
    completedAt: daysAgo(3),
  },

  // ---- FAILED (1) -- terminal ----

  {
    id: "int-011",
    title: "Otimizar queries do dashboard com CTEs",
    status: "failed",
    type: "refactor",
    priority: "low",
    canal: "web",
    projectSlug: "2",
    deliverables: null,
    failureReason: "CTE incompativel com Prisma raw queries",
    problema: "Dashboard leva 4-5s. N+1 queries no DashboardService.",
    contexto: "Prisma com includes aninhados gerando queries excessivas.",
    solucaoProposta:
      "Reescrever queries com raw SQL usando CTEs. Adicionar cache Redis.",
    criteriosAceite: ["Dashboard carrega em <1s", "Zero N+1 queries"],
    naoObjetivos: [],
    riscos: ["Raw SQL dificulta manutencao"],
    apetiteDias: 3,
    createdBy: "Devari Admin",
    timeline: [
      {
        id: "t1",
        timestamp: daysAgo(2),
        actor: "devari-backend",
        actorType: "system",
        action: "Projeto puxou intencao",
      },
      {
        id: "t2",
        timestamp: daysAgo(2),
        actor: "devari-backend",
        actorType: "system",
        action: "Falhou: CTE gerado incompativel com Prisma raw",
      },
    ],
    hillPosition: 42,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2),
    inboxAt: daysAgo(4),
    readyAt: daysAgo(3),
    executingAt: daysAgo(2),
    completedAt: null,
  },

  // ---- VALIDATING (1) -- sendo validado (criterios, scope, riscos) ----

  {
    id: "int-015",
    title: "Endpoint de health-check com dependencias",
    status: "validating",
    type: "code",
    priority: "medium",
    canal: "web",
    projectSlug: "2",
    deliverables: null,
    problema:
      "Health-check atual retorna 200 sempre. Nao verifica PostgreSQL, Redis ou BullMQ.",
    contexto:
      "NestJS tem @nestjs/terminus para health checks. Falta configurar indicadores.",
    solucaoProposta:
      "Criar /health endpoint com checks de DB, Redis e queues. Retornar 503 se qualquer dependencia falhar.",
    criteriosAceite: [
      "Endpoint /health verifica PostgreSQL, Redis e BullMQ",
      "Retorna 503 se qualquer dependencia offline",
      "Formato compativel com Kubernetes liveness/readiness",
    ],
    naoObjetivos: ["NAO implementar metricas Prometheus nesta intencao"],
    riscos: ["Health check pode ser lento se Redis estiver degradado"],
    apetiteDias: 1,
    createdBy: "Devari Admin",
    timeline: [
      {
        id: "t1",
        timestamp: daysAgo(2),
        actor: "Devari Admin",
        actorType: "human",
        action: "Criou e refinou intencao",
      },
      {
        id: "t2",
        timestamp: hoursAgo(6),
        actor: "Devari Admin",
        actorType: "human",
        action: "Enviou para validacao -- revisando criterios",
      },
    ],
    hillPosition: 35,
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(6),
    inboxAt: daysAgo(2),
    readyAt: daysAgo(1),
    executingAt: null,
    completedAt: null,
  },

  // ---- VALIDATED (1) -- validado, pronto para execucao ----

  {
    id: "int-016",
    title: "Rate limiting por IP e por usuario",
    status: "validated",
    type: "code",
    priority: "high",
    canal: "slack",
    projectSlug: "2",
    deliverables: null,
    problema:
      "API publica sem rate limiting. Qualquer cliente pode fazer requests ilimitados.",
    contexto:
      "NestJS tem @nestjs/throttler. Redis disponivel para distributed rate limiting.",
    solucaoProposta:
      "Configurar ThrottlerModule com Redis store. 100 req/min por IP, 1000 req/min por usuario autenticado.",
    criteriosAceite: [
      "Rate limit 100 req/min por IP (nao autenticado)",
      "Rate limit 1000 req/min por usuario (autenticado)",
      "Header X-RateLimit-Remaining no response",
      "Resposta 429 com Retry-After header",
    ],
    naoObjetivos: ["NAO implementar rate limit por endpoint especifico"],
    riscos: ["Redis single point of failure para rate limiting"],
    apetiteDias: 2,
    createdBy: "Devari Admin",
    timeline: [
      {
        id: "t1",
        timestamp: daysAgo(3),
        actor: "Devari Admin",
        actorType: "human",
        action: "Criou intencao via Slack",
      },
      {
        id: "t2",
        timestamp: daysAgo(2),
        actor: "Devari Admin",
        actorType: "human",
        action: "Refinou criterios e enviou para validacao",
      },
      {
        id: "t3",
        timestamp: daysAgo(1),
        actor: "Devari Admin",
        actorType: "human",
        action: "Validado -- criterios claros, riscos aceitos",
      },
    ],
    hillPosition: 40,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
    inboxAt: daysAgo(3),
    readyAt: daysAgo(2),
    executingAt: null,
    completedAt: null,
  },

  // ---- CANCELLED (1) -- terminal ----

  {
    id: "int-012",
    title: "Migrar para GraphQL",
    status: "cancelled",
    type: "refactor",
    priority: "low",
    canal: "email",
    projectSlug: "2",
    deliverables: null,
    failureReason:
      "Decidido manter REST. GraphQL nao justifica o custo de migracao.",
    problema:
      "Frontend faz multiplas requests para montar uma pagina. GraphQL resolveria com 1 query.",
    contexto:
      "Backend REST com 30+ endpoints. Migracao completa levaria semanas.",
    solucaoProposta:
      "Migrar para GraphQL usando @nestjs/graphql com schema-first approach.",
    criteriosAceite: [],
    naoObjetivos: [],
    riscos: [],
    apetiteDias: 10,
    createdBy: "Devari Admin",
    timeline: [
      {
        id: "t1",
        timestamp: daysAgo(7),
        actor: "Devari Admin",
        actorType: "human",
        action: "Criou intencao",
      },
      {
        id: "t2",
        timestamp: daysAgo(5),
        actor: "Devari Admin",
        actorType: "human",
        action: "Cancelou -- REST atende bem, migracao nao justificada",
      },
    ],
    hillPosition: 10,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(5),
    inboxAt: daysAgo(7),
    readyAt: null,
    executingAt: null,
    completedAt: null,
  },
];

// ============================================================
// Helpers de consulta
// ============================================================

export function getIntentionsByStatus(status: string): IntentionDocument[] {
  if (status === "all") return MOCK_INTENTIONS;
  return MOCK_INTENTIONS.filter((i) => i.status === status);
}

export function getIntentionById(id: string): IntentionDocument | undefined {
  return MOCK_INTENTIONS.find((i) => i.id === id);
}

export function getIntentionsByProject(slug: string): IntentionDocument[] {
  return MOCK_INTENTIONS.filter((i) => i.projectSlug === slug);
}

export function getIntentionsByCanal(
  canal: IntentionCanal,
): IntentionDocument[] {
  return MOCK_INTENTIONS.filter((i) => i.canal === canal);
}

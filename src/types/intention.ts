// Intent-first types -- V3: Repositorio passivo de intencoes
// 4 estados principais: INBOX, READY, EXECUTING, DONE
// + intermediarios: VALIDATING, VALIDATED
// + terminais: FAILED, CANCELLED, DISCARDED

// ============================================================
// DClasse IDs do backend (seed scrumban-be)
// Mapeamento direto para chaves negativas do seed de classes
// ============================================================

export const STATUS_IDS = {
  INBOX: "-441",
  READY: "-442",
  EXECUTING: "-443",
  DONE: "-444",
  FAILED: "-445",
  CANCELLED: "-446",
  DISCARDED: "-447",
  VALIDATING: "-448",
  VALIDATED: "-449",
} as const;

export const CANAL_IDS = {
  WEB: "-451",
  WHATSAPP: "-452",
  EMAIL: "-453",
  SLACK: "-454",
  API: "-455",
} as const;

export const PRIORITY_IDS = {
  URGENT: "-424",
  HIGH: "-421",
  MEDIUM: "-422",
  LOW: "-423",
} as const;

export const TYPE_IDS = {
  FEATURE: "-431",
  BUG: "-432",
  IMPROVEMENT: "-433",
  REVIEW: "-434",
  EXPLAIN: "-435",
} as const;

// Mapeamento status string -> DClasse ID (para future API integration)
export const STATUS_TO_ID: Record<IntentionStatus, string> = {
  inbox: STATUS_IDS.INBOX,
  ready: STATUS_IDS.READY,
  executing: STATUS_IDS.EXECUTING,
  done: STATUS_IDS.DONE,
  failed: STATUS_IDS.FAILED,
  cancelled: STATUS_IDS.CANCELLED,
  discarded: STATUS_IDS.DISCARDED,
  validating: STATUS_IDS.VALIDATING,
  validated: STATUS_IDS.VALIDATED,
};

// Mapeamento canal string -> DClasse ID
export const CANAL_TO_ID: Record<IntentionCanal, string> = {
  web: CANAL_IDS.WEB,
  whatsapp: CANAL_IDS.WHATSAPP,
  email: CANAL_IDS.EMAIL,
  slack: CANAL_IDS.SLACK,
  api: CANAL_IDS.API,
};

export type IntentionStatus =
  | "inbox" // Capturado, precisa refinamento humano
  | "ready" // Refinado, disponivel para projeto puxar
  | "validating" // Sendo validado (criterios, riscos, scope)
  | "validated" // Validado, pronto para execucao
  | "executing" // Projeto pegou, operacao atomica
  | "done" // Projeto reportou conclusao
  | "failed" // Projeto nao conseguiu
  | "cancelled" // Era relevante mas nao e mais
  | "discarded"; // Nunca foi relevante

export type IntentionType =
  | "feature"
  | "bug"
  | "improvement"
  | "code"
  | "analysis"
  | "documentation"
  | "test"
  | "review"
  | "refactor";

export type IntentionPriority = "urgent" | "high" | "medium" | "low";

export type IntentionCanal = "web" | "whatsapp" | "email" | "slack" | "api";

export interface IntentionDeliverables {
  prUrl?: string;
  prNumber?: number;
  summary: string;
  filesChanged?: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorType: "human" | "system";
  action: string;
  details?: string;
}

export interface IntentionDocument {
  id: string;
  title: string;
  status: IntentionStatus;
  type: IntentionType;
  priority: IntentionPriority;

  // Canal de origem (como a intencao chegou)
  canal: IntentionCanal;

  // Projeto destino (qual repo vai executar)
  projectSlug: string | null;

  // Deliverables (resultado quando DONE)
  deliverables: IntentionDeliverables | null;

  // Documento de intencao
  problema: string;
  contexto: string;
  solucaoProposta: string;
  criteriosAceite: string[];
  naoObjetivos: string[];
  riscos: string[];

  // Configuracao de execucao
  apetiteDias: number;
  createdBy: string;

  // Timeline
  timeline: TimelineEvent[];

  // Hill Chart position (0-100)
  // 0-49: uphill (discovery), 50: top (clarity), 51-100: downhill (execution)
  hillPosition: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Timestamps de transicao V3 (metricas de fluxo)
  inboxAt: string;
  readyAt: string | null;
  executingAt: string | null;
  completedAt: string | null;

  // Motivo (para failed/cancelled/discarded)
  failureReason?: string;
}

/**
 * DTO simplificado para criacao de intencoes (V3).
 * O Scrumban e um To-Do-List: apenas titulo + projeto sao obrigatorios.
 * Campos avancados (problema, criterios, riscos) podem ser preenchidos
 * na tela de detalhe da intencao apos criacao.
 */
export interface CreateIntentionDto {
  title: string;
  description: string; // obrigatório — descreve o problema (min 20 chars)
  taskTypeId: string; // "-431" FEATURE | "-432" BUG | "-433" IMPROVEMENT
  priorityId: string; // "-424" URGENT | "-421" HIGH | "-422" MEDIUM | "-423" LOW
  projectId: string;
}

/**
 * @deprecated DTO legado do wizard 4-step. Mantido para referencia.
 * Usar CreateIntentionDto (simplificado) para novas implementacoes.
 */
export interface CreateIntentionDtoLegacy {
  title: string;
  problema: string;
  contexto?: string;
  solucaoProposta?: string;
  criteriosAceite?: string[];
  naoObjetivos?: string[];
  riscos?: string[];
  type: IntentionType;
  priority: IntentionPriority;
  apetiteDias: number;
  canal?: IntentionCanal;
}

export interface IntentionFilters {
  status?: IntentionStatus | "all";
  type?: IntentionType | "all";
  priority?: IntentionPriority | "all";
  canal?: IntentionCanal | "all";
  projectSlug?: string | "all";
  searchTerm?: string;
}

// ============================================================
// Activity Events (timeline de atividade dos projetos)
// ============================================================

export type ActivityEventType =
  | "intention.created"
  | "intention.ready"
  | "intention.executing"
  | "intention.completed"
  | "intention.failed"
  | "intention.cancelled"
  | "intention.discarded"
  | "intention.validating"
  | "intention.validated";

export interface ActivityEvent {
  id: string;
  tipo: ActivityEventType;
  projectSlug: string;
  intentionTitle: string;
  intentionId: string;
  timestamp: string;
  details?: {
    prUrl?: string;
    motivo?: string;
    actorName?: string;
  };
}

/**
 * Adapter: Frontend IntentionDocument/CreateIntentionDto -> Backend Task body
 *
 * Maps frontend intention data to the backend POST/PUT /tasks body format.
 * Used when creating or updating intentions through the API.
 */

import type { CreateIntentionDto, IntentionDocument } from "@/types/intention";
import {
  STATUS_TO_ID,
  CANAL_TO_ID,
  PRIORITY_IDS,
  TYPE_IDS,
} from "@/types/intention";

// ============================================================
// Priority string -> DTabela chave (idPrioridade)
// ============================================================

const PRIORITY_STRING_TO_ID: Record<string, string> = {
  urgent: PRIORITY_IDS.URGENT,
  high: PRIORITY_IDS.HIGH,
  medium: PRIORITY_IDS.MEDIUM,
  low: PRIORITY_IDS.LOW,
};

// ============================================================
// Type string -> DTabela chave (idTipoTask)
// ============================================================

const TYPE_STRING_TO_ID: Record<string, string> = {
  code: TYPE_IDS.FEATURE,
  analysis: TYPE_IDS.EXPLAIN,
  documentation: TYPE_IDS.FEATURE, // No exact match, use Feature
  test: TYPE_IDS.FEATURE,
  review: TYPE_IDS.REVIEW,
  refactor: TYPE_IDS.IMPROVEMENT,
};

// ============================================================
// Create: CreateIntentionDto -> POST /tasks body
// ============================================================

export interface CreateIntentionTaskBody {
  name: string;
  projectId: string;
  statusId?: string;
  priorityId?: string;
  taskTypeId?: string;
  problema?: string;
  contexto?: string;
  solucaoProposta?: string;
  criteriosAceite?: string[];
  naoObjetivos?: string[];
  riscos?: string[];
  storyPoints?: number;
  canalId?: string;
  hillPosition?: number;
}

export function mapCreateIntentionToTaskBody(
  dto: CreateIntentionDto,
  projectId: string,
): CreateIntentionTaskBody {
  return {
    name: dto.title,
    projectId: projectId,
    taskTypeId: dto.taskTypeId || TYPE_IDS.FEATURE,
    priorityId: dto.priorityId || PRIORITY_IDS.MEDIUM,
    problema: dto.description,
  };
}

// ============================================================
// Update: Partial<IntentionDocument> -> PUT /tasks/:id body
// ============================================================

export interface UpdateIntentionTaskBody {
  name?: string;
  priorityId?: string;
  taskTypeId?: string;
  problema?: string;
  contexto?: string;
  solucaoProposta?: string;
  criteriosAceite?: string[];
  naoObjetivos?: string[];
  riscos?: string[];
  storyPoints?: number;
  hillPosition?: number;
}

export function mapIntentionUpdatesToTaskBody(
  updates: Partial<IntentionDocument>,
): UpdateIntentionTaskBody {
  const body: UpdateIntentionTaskBody = {};

  if (updates.title !== undefined) {
    body.name = updates.title;
  }

  if (updates.priority !== undefined) {
    body.priorityId =
      PRIORITY_STRING_TO_ID[updates.priority] ?? PRIORITY_IDS.MEDIUM;
  }

  if (updates.type !== undefined) {
    body.taskTypeId = TYPE_STRING_TO_ID[updates.type] ?? TYPE_IDS.FEATURE;
  }

  if (updates.problema !== undefined) {
    body.problema = updates.problema;
  }

  if (updates.contexto !== undefined) {
    body.contexto = updates.contexto;
  }

  if (updates.solucaoProposta !== undefined) {
    body.solucaoProposta = updates.solucaoProposta;
  }

  if (updates.criteriosAceite !== undefined) {
    body.criteriosAceite = updates.criteriosAceite;
  }

  if (updates.naoObjetivos !== undefined) {
    body.naoObjetivos = updates.naoObjetivos;
  }

  if (updates.riscos !== undefined) {
    body.riscos = updates.riscos;
  }

  if (updates.apetiteDias !== undefined) {
    body.storyPoints = updates.apetiteDias;
  }

  if (updates.hillPosition !== undefined) {
    body.hillPosition = Math.max(
      0,
      Math.min(100, Math.round(updates.hillPosition)),
    );
  }

  return body;
}

// ============================================================
// Status transition: IntentionStatus -> DTabela chave
// ============================================================

export function mapStatusToId(status: string): string {
  const id =
    STATUS_TO_ID[status as keyof typeof STATUS_TO_ID] ?? STATUS_TO_ID.inbox;
  return id;
}

// ============================================================
// Canal to ID (for future use when backend supports canal)
// ============================================================

export function mapCanalToId(canal: string): string {
  return CANAL_TO_ID[canal as keyof typeof CANAL_TO_ID] ?? CANAL_TO_ID.web;
}

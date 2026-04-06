/**
 * Adapter: Backend Task response -> Frontend Task type
 *
 * Maps the backend DTask response (English field names: id, name, description,
 * status.id, status.code, priority.id, etc.) to the frontend Task type
 * (Portuguese: chave, titulo, descricao, status.chave, status.codigo, etc.).
 *
 * Accepts BOTH formats gracefully -- if data already comes in Portuguese
 * (from cache or mock), it passes through correctly.
 */

import type { Task, TaskTag } from "@/types/task";
import type { Lookup } from "@/types/common";

// ============================================================
// Helpers
// ============================================================

/**
 * Safely converts a Lookup-like object from backend (id/name/code)
 * to frontend format (chave/nome/codigo).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLookup(raw: any): Lookup | null {
  if (!raw) return null;
  return {
    chave: String(raw.chave ?? raw.id ?? ""),
    nome: String(raw.nome ?? raw.name ?? ""),
    codigo: raw.codigo ?? raw.code ?? undefined,
  };
}

/**
 * Maps assignee object from backend to frontend format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAssignee(raw: any): {
  chave: string;
  nome: string;
  isAIAgent?: boolean;
} | null {
  if (!raw) return null;
  return {
    chave: String(raw.chave ?? raw.id ?? ""),
    nome: String(raw.nome ?? raw.name ?? ""),
    isAIAgent: raw.isAIAgent ?? undefined,
  };
}

/**
 * Maps tags array from backend to frontend TaskTag format.
 * Backend may return tags as array of objects with id/name/color or chave/nome/cor.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTags(raw: any): TaskTag[] {
  if (!raw || !Array.isArray(raw)) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return raw.map((t: any) => ({
    chave: String(t.chave ?? t.id ?? ""),
    nome: String(t.nome ?? t.name ?? ""),
    cor: t.cor ?? t.color ?? null,
  }));
}

/**
 * Safely coerce a value to string or null.
 */
function toStringOrNull(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  return String(val);
}

/**
 * Safely coerce a value to number or null.
 */
function toNumberOrNull(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

// ============================================================
// Main mapper: Backend Task response -> Frontend Task
// ============================================================

/**
 * Maps a single backend task response to the frontend Task type.
 * Handles both English (backend) and Portuguese (frontend/cache) field names.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapApiTask(raw: any): Task {
  if (!raw) {
    throw new Error("mapApiTask: received null/undefined input");
  }

  const createdAt = String(
    raw.criadoEm ?? raw.createdAt ?? new Date().toISOString(),
  );

  // Status is required -- ensure a safe fallback
  const statusRaw = raw.status ?? {};
  const status: Lookup = {
    chave: String(statusRaw.chave ?? statusRaw.id ?? ""),
    nome: String(statusRaw.nome ?? statusRaw.name ?? ""),
    codigo: statusRaw.codigo ?? statusRaw.code ?? undefined,
  };

  return {
    chave: String(raw.chave ?? raw.id ?? ""),
    titulo: String(raw.titulo ?? raw.name ?? raw.nome ?? ""),
    descricao: toStringOrNull(raw.descricao ?? raw.description),
    idProject: String(raw.idProject ?? raw.projectId ?? ""),
    assignee: mapAssignee(raw.assignee),
    status,
    prioridade: mapLookup(raw.prioridade ?? raw.priority),
    tipoTask: mapLookup(raw.tipoTask ?? raw.taskType),
    sprint: mapLookup(raw.sprint),
    ordem: Number(raw.ordem ?? raw.order ?? 0),
    estimativaHoras: toNumberOrNull(raw.estimativaHoras ?? raw.storyPoints),
    estimativaIA: toNumberOrNull(raw.estimativaIA ?? raw.aiEstimation),
    apetiteDias: toNumberOrNull(raw.apetiteDias),
    apetiteInicio: toStringOrNull(raw.apetiteInicio),
    idParentTask: toStringOrNull(raw.idParentTask ?? raw.parentTaskId),
    tagIds: toStringOrNull(raw.tagIds),
    tags: mapTags(raw.tags),
    problema: toStringOrNull(raw.problema),
    contexto: toStringOrNull(raw.contexto),
    solucaoProposta: toStringOrNull(raw.solucaoProposta),
    criteriosAceite: toStringOrNull(raw.criteriosAceite),
    naoObjetivos: toStringOrNull(raw.naoObjetivos),
    riscos: toStringOrNull(raw.riscos),
    criadoEm: createdAt,
    atualizadoEm: String(raw.atualizadoEm ?? raw.updatedAt ?? createdAt),
  };
}

/**
 * Batch mapper with null safety.
 * Filters out any null/undefined items from the input array.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapApiTasks(raw: any[]): Task[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter(Boolean).map(mapApiTask);
}

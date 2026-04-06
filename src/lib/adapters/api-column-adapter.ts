/**
 * Adapter: Backend Column/WorkflowStatus response -> Frontend Column type
 *
 * Maps the backend column response (English field names: id, name, code,
 * order, color) to the frontend Column type (Portuguese: chave, nome,
 * codigo, ordem, cor).
 *
 * Accepts BOTH formats gracefully -- if data already comes in Portuguese
 * (from cache or mock), it passes through correctly.
 */

import type { Column } from "@/types/column";

// ============================================================
// Main mapper: Backend Column response -> Frontend Column
// ============================================================

/**
 * Maps a single backend column response to the frontend Column type.
 * Handles both English (backend) and Portuguese (frontend/cache) field names.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapApiColumn(raw: any): Column {
  if (!raw) {
    throw new Error("mapApiColumn: received null/undefined input");
  }

  return {
    chave: String(raw.chave ?? raw.id ?? ""),
    nome: String(raw.nome ?? raw.name ?? ""),
    codigo: String(raw.codigo ?? raw.code ?? ""),
    wipLimit:
      raw.wipLimit !== undefined && raw.wipLimit !== null
        ? Number(raw.wipLimit)
        : null,
    wipBlocking: Boolean(raw.wipBlocking ?? false),
    ordem: Number(raw.ordem ?? raw.order ?? 0),
    cor: raw.cor ?? raw.color ?? raw.dotColor ?? null,
    projectId: String(raw.projectId ?? raw.idProject ?? ""),
    criadoEm: String(raw.criadoEm ?? raw.createdAt ?? new Date().toISOString()),
  };
}

/**
 * Batch mapper with null safety.
 * Filters out any null/undefined items from the input array.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapApiColumns(raw: any[]): Column[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter(Boolean).map(mapApiColumn);
}

/**
 * Folder (Pasta) — agrupa projetos de uma organização.
 *
 * Backend V2 modela como DEntidade idClasse=-155 (FOLDER) com vínculo
 * Project↔Folder via DVincula idClasse=-183 (FOLDER_PROJECT_LINK).
 * Cardinalidade: 1 projeto pertence a 0 ou 1 folder.
 *
 * MVP (CEO 2026-05-18, ADR-V2-FOLDERS-001):
 * - Folders flat (sem aninhamento).
 * - Cor derivada do nome no frontend via hash (não persistida).
 * - Ordenação alfabética (sem ordem manual).
 * - Delete move projects para limbo (não cascateia).
 */
export interface Folder {
  /** Chave da DEntidade. */
  id: string;
  /** Nome da pasta (max 100 chars). */
  nome: string;
  /** ID da organização dona. */
  organizationId: string;
  /** Contagem de projects vinculados (calculada em batch no backend). */
  projectCount: number;
  /** ISO 8601 timestamp. */
  criadoEm: string;
  /** ISO 8601 timestamp. */
  atualizadoEm: string;
}

/** DTO para criar pasta (POST /entidades/folders). */
export interface CreateFolderDto {
  nome: string;
  organizationId: string;
}

/** DTO para renomear pasta (PATCH /entidades/folders/:id). */
export interface UpdateFolderDto {
  nome?: string;
}

/**
 * Identificador especial usado pelo frontend para representar a "pasta
 * virtual" de projects sem folder (limbo). Não é uma folder real — o
 * backend serve esses projects via `GET /entidades/folders/unassigned`.
 */
export const UNASSIGNED_FOLDER_ID = "__unassigned__" as const;

export type FolderViewId = string | typeof UNASSIGNED_FOLDER_ID;

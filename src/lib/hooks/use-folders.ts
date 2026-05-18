"use client";

import { useQuery } from "@tanstack/react-query";
import { foldersApi } from "@/lib/api/folders";
import { useAuthStore } from "@/lib/stores/auth-store";
import { QUERY_KEYS } from "@/lib/constants";

/**
 * Lista pastas (folders) da organização atual do usuário.
 *
 * Backend V2: `GET /entidades/folders?organizationId=X` (Pilar 2 + ADR-V2-FOLDERS-001).
 * Pasta = DEntidade idClasse=-155, ordenadas alfabeticamente.
 * Retorna `projectCount` calculado em batch (zero N+1 no backend).
 *
 * Habilitado somente quando `orgId` está disponível em `useAuthStore`.
 */
export function useFolders() {
  const orgId = useAuthStore((s) => s.user?.orgId);
  return useQuery({
    queryKey: QUERY_KEYS.folders.list(orgId ?? ""),
    queryFn: () => foldersApi.list(orgId!),
    enabled: !!orgId,
  });
}

/**
 * Lista projects pertencentes a uma pasta específica.
 *
 * Backend V2: `GET /entidades/folders/:folderId/projects`.
 * Usa JOIN DVincula(-183) → DEntidade(-153) — uma query no backend.
 *
 * Passa `null`/`undefined` para desabilitar (não dispara request).
 */
export function useFolderProjects(folderId: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.folders.projects(folderId ?? ""),
    queryFn: () => foldersApi.listProjects(folderId!),
    enabled: !!folderId,
  });
}

/**
 * Lista projects sem pasta ("limbo") da organização atual.
 *
 * Backend V2: `GET /entidades/folders/unassigned?organizationId=X`.
 * Usa NOT EXISTS em DVincula -183 — índice cobre.
 */
export function useUnassignedProjects() {
  const orgId = useAuthStore((s) => s.user?.orgId);
  return useQuery({
    queryKey: QUERY_KEYS.folders.unassigned(orgId ?? ""),
    queryFn: () => foldersApi.listUnassigned(orgId!),
    enabled: !!orgId,
  });
}

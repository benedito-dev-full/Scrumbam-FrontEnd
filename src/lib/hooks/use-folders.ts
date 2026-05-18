"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { foldersApi } from "@/lib/api/folders";
import { useAuthStore } from "@/lib/stores/auth-store";
import { QUERY_KEYS } from "@/lib/constants";
import type { CreateFolderDto, UpdateFolderDto } from "@/types";

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

// =========================================================
// Mutations (Etapa 2 — CRUD)
// =========================================================

/**
 * Helper interno: invalida todas as queries de folders após mutation.
 *
 * Como folders aparecem em múltiplos queryKeys (list, projects, unassigned,
 * detail), invalidamos o prefixo "folders" e "folder" de uma vez. TanStack
 * Query faz refetch das queries ativas; as inativas marcam stale.
 */
function invalidateFolderQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: ["folders"] });
  queryClient.invalidateQueries({ queryKey: ["folder"] });
  // Projects também tem `folderId` no response — refetch para refletir
  // mudança de vínculo nos cards de project.
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
}

/**
 * Cria uma nova pasta.
 *
 * Backend V2: `POST /entidades/folders` body `{nome, organizationId}`.
 * Em sucesso, invalida queries de folders/projects e emite toast.
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.user?.orgId);
  return useMutation({
    mutationFn: (dto: Omit<CreateFolderDto, "organizationId">) => {
      if (!orgId) {
        throw new Error("Organização não definida — refaça o login.");
      }
      return foldersApi.create({ ...dto, organizationId: orgId });
    },
    onSuccess: (folder) => {
      invalidateFolderQueries(queryClient);
      toast.success(`Pasta "${folder.nome}" criada`);
    },
    onError: (error: unknown) => {
      const err = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      const status = err.response?.status;
      if (status === 409) {
        toast.error(
          err.response?.data?.message || "Já existe uma pasta com esse nome.",
        );
      } else if (status === 403) {
        toast.error("Sem permissão para criar pastas.");
      } else if (status === 400) {
        toast.error(err.response?.data?.message || "Nome de pasta inválido.");
      } else {
        toast.error(err.message || "Falha ao criar pasta.");
      }
    },
  });
}

/**
 * Renomeia uma pasta existente.
 *
 * Backend V2: `PATCH /entidades/folders/:id` body `{nome}`.
 */
export function useUpdateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      folderId,
      dto,
    }: {
      folderId: string;
      dto: UpdateFolderDto;
    }) => foldersApi.update(folderId, dto),
    onSuccess: (folder) => {
      invalidateFolderQueries(queryClient);
      toast.success(`Pasta renomeada para "${folder.nome}"`);
    },
    onError: (error: unknown) => {
      const err = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      const status = err.response?.status;
      if (status === 404) {
        toast.error("Pasta não encontrada.");
      } else if (status === 403) {
        toast.error("Sem permissão para editar pastas.");
      } else if (status === 409) {
        toast.error(
          err.response?.data?.message || "Já existe uma pasta com esse nome.",
        );
      } else {
        toast.error(err.response?.data?.message || "Falha ao renomear pasta.");
      }
    },
  });
}

/**
 * Deleta uma pasta (soft-delete).
 *
 * Backend V2: `DELETE /entidades/folders/:id`. Os projects vinculados
 * permanecem intactos — vão para o "limbo" (sem pasta) conforme CEO Q4 /
 * ADR-V2-FOLDERS-001.
 */
export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (folderId: string) => foldersApi.remove(folderId),
    onSuccess: () => {
      invalidateFolderQueries(queryClient);
      toast.success("Pasta excluída. Projetos movidos para 'Sem pasta'.");
    },
    onError: (error: unknown) => {
      const err = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      const status = err.response?.status;
      if (status === 404) {
        toast.error("Pasta não encontrada.");
      } else if (status === 403) {
        toast.error("Sem permissão para excluir pastas.");
      } else {
        toast.error(err.response?.data?.message || "Falha ao excluir pasta.");
      }
    },
  });
}

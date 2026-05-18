import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type {
  Folder,
  CreateFolderDto,
  UpdateFolderDto,
  Project,
} from "@/types";

/**
 * Mapeia FolderResponseDto do backend V2 para tipo Folder do frontend.
 *
 * Backend retorna `{id, nome, organizationId, projectCount, createdAt, updatedAt}`.
 * Tolera variações de naming (camelCase vs snake_case, id vs chave).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFolder(raw: any): Folder {
  return {
    id: String(raw.id ?? raw.chave),
    nome: String(raw.nome ?? raw.name ?? ""),
    organizationId: String(raw.organizationId ?? raw.orgId ?? ""),
    projectCount: Number(raw.projectCount ?? raw.project_count ?? 0),
    criadoEm: String(raw.criadoEm ?? raw.createdAt ?? ""),
    atualizadoEm: String(raw.atualizadoEm ?? raw.updatedAt ?? ""),
  };
}

/**
 * Mapeia ProjectResponseDto para Project mínimo usado pelas listagens de
 * folder. Mantém compatibilidade com o `mapProject` do projects.ts.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFolderProject(raw: any): Project {
  return {
    chave: String(raw.id ?? raw.chave),
    nome: String(raw.nome ?? raw.name ?? ""),
    descricao: raw.description ?? raw.descricao ?? null,
    dataInicio: raw.startDate ?? raw.dataInicio ?? null,
    dataFim: raw.endDate ?? raw.dataFim ?? null,
    criadoEm: String(raw.criadoEm ?? raw.createdAt ?? ""),
    taskCount: Number(raw.taskCount ?? raw.memberCount ?? 0),
    teamId: raw.teamId ?? null,
    folderId: raw.folderId ?? null,
    responsavel: raw.owner
      ? {
          chave: String(raw.owner.id ?? raw.owner.chave),
          nome: String(raw.owner.nome ?? raw.owner.name ?? ""),
        }
      : (raw.responsavel ?? null),
  };
}

export const foldersApi = {
  /**
   * Lista pastas de uma organização.
   *
   * Backend: `GET /entidades/folders?organizationId=X`.
   * Retorna pastas ordenadas alfabeticamente por nome.
   */
  list: async (organizationId: string): Promise<Folder[]> => {
    const { data } = await api.get(ENDPOINTS.FOLDERS, {
      params: { organizationId },
    });
    const items = Array.isArray(data) ? data : (data?.items ?? []);
    return items.map(mapFolder);
  },

  /** Busca pasta por ID. */
  getById: async (folderId: string): Promise<Folder> => {
    const { data } = await api.get(ENDPOINTS.FOLDER(folderId));
    return mapFolder(data);
  },

  /**
   * Lista projects pertencentes a uma pasta.
   *
   * Backend: `GET /entidades/folders/:folderId/projects`.
   * JOIN DVincula -183 → DEntidade -153 (projects).
   */
  listProjects: async (folderId: string): Promise<Project[]> => {
    const { data } = await api.get(ENDPOINTS.FOLDER_PROJECTS(folderId));
    const items = Array.isArray(data) ? data : (data?.items ?? []);
    return items.map(mapFolderProject);
  },

  /**
   * Lista projects sem pasta (limbo) numa organização.
   *
   * Backend: `GET /entidades/folders/unassigned?organizationId=X`.
   * Usa NOT EXISTS em DVincula -183.
   */
  listUnassigned: async (organizationId: string): Promise<Project[]> => {
    const { data } = await api.get(ENDPOINTS.FOLDERS_UNASSIGNED, {
      params: { organizationId },
    });
    const items = Array.isArray(data) ? data : (data?.items ?? []);
    return items.map(mapFolderProject);
  },

  /**
   * Cria pasta. Reservado para Etapa 2 (CRUD).
   *
   * Backend: `POST /entidades/folders` body `{nome, organizationId}`.
   */
  create: async (dto: CreateFolderDto): Promise<Folder> => {
    const { data } = await api.post(ENDPOINTS.FOLDERS, dto);
    return mapFolder(data);
  },

  /** Renomeia pasta. Reservado para Etapa 2. */
  update: async (folderId: string, dto: UpdateFolderDto): Promise<Folder> => {
    const { data } = await api.patch(ENDPOINTS.FOLDER(folderId), dto);
    return mapFolder(data);
  },

  /**
   * Deleta pasta (soft-delete). Projects vão pro limbo.
   * Reservado para Etapa 2.
   */
  remove: async (folderId: string): Promise<void> => {
    await api.delete(ENDPOINTS.FOLDER(folderId));
  },

  /** Move project para pasta. Reservado para Etapa 3. */
  moveProject: async (folderId: string, projectId: string): Promise<void> => {
    await api.post(ENDPOINTS.FOLDER_PROJECT_LINK(folderId, projectId));
  },

  /** Tira project da pasta (vai pro limbo). Reservado para Etapa 3. */
  unmoveProject: async (folderId: string, projectId: string): Promise<void> => {
    await api.delete(ENDPOINTS.FOLDER_PROJECT_LINK(folderId, projectId));
  },
};

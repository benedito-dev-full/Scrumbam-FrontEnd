import api from "./client";

// === Tipos do backend (V2 — /projects/:id/members) ===

export type ProjectRole = "MANAGER" | "MEMBER" | "VIEWER";

export interface ProjectMember {
  userId: string;
  nome: string;
  email: string | null;
  role: ProjectRole;
  cargo: string | null;
}

export interface AddProjectMemberRequest {
  userId: string;
  role: ProjectRole;
  cargo?: string;
}

export interface UpdateProjectMemberRequest {
  role: ProjectRole;
  cargo?: string;
}

/**
 * Cliente HTTP para membros do projeto.
 *
 * Backend (ADR-V2-003): membership via DVincula com idClasse:
 *   -171 MANAGER, -172 MEMBER, -173 VIEWER
 *
 * 4 endpoints sob `/projects/:id/members`:
 *  - GET — lista (qualquer autenticado)
 *  - POST — adiciona (requer MANAGER no projeto)
 *  - PATCH /:userId — altera role/cargo (requer MANAGER)
 *  - DELETE /:userId — remove (requer MANAGER; nao pode remover ultimo MANAGER)
 */
export const projectMembersApi = {
  list: async (projectId: string): Promise<ProjectMember[]> => {
    const { data } = await api.get<{ members: ProjectMember[] }>(
      `/projects/${projectId}/members`,
    );
    return data.members ?? [];
  },

  add: async (
    projectId: string,
    payload: AddProjectMemberRequest,
  ): Promise<void> => {
    await api.post(`/projects/${projectId}/members`, payload);
  },

  update: async (
    projectId: string,
    userId: string,
    payload: UpdateProjectMemberRequest,
  ): Promise<void> => {
    await api.patch(`/projects/${projectId}/members/${userId}`, payload);
  },

  remove: async (projectId: string, userId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/members/${userId}`);
  },
};

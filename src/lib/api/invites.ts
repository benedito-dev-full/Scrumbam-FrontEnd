import api from "./client";
import type { AuthResponse } from "@/types/auth";

// === Shapes do backend (ADR-V2-028) ===

export interface InviteInfo {
  orgName: string;
  inviterName: string;
  email: string;
  role: "MEMBER" | "VIEWER";
  expiresAt: string;
  /**
   * Fluxo do aceite (ADR-V2-030 — Multi-tenant identity):
   *  - `new_user`: email sem conta → form de nome + senha + termos.
   *  - `existing_user`: email já tem DEntidade -150 noutra org → confirmar
   *    merge (apenas cria DVincula, sem DUserGroup/DEntidade duplicada).
   *
   * Backends antigos (pré-ADR-V2-030) podem não retornar este campo —
   * front trata `undefined` como `new_user` (back-compat).
   */
  flow?: "new_user" | "existing_user";
}

export interface CreateInviteRequest {
  email: string;
  role: "MEMBER" | "VIEWER";
}

export interface CreateInviteResponse {
  id: string;
  email: string;
  role: "MEMBER" | "VIEWER";
  expiresAt: string;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: "MEMBER" | "VIEWER";
  createdAt: string;
  expiresAt: string;
}

export interface AcceptInviteRequest {
  name: string;
  password: string;
}

export interface AcceptInviteResponse extends AuthResponse {
  redirectTo: string;
}

/**
 * Cliente HTTP para o fluxo de convite por email (ADR-V2-028).
 *
 * 3 endpoints:
 *  - POST /organizations/:orgId/invites — admin
 *  - GET  /invites/:token — publico
 *  - POST /invites/:token/accept — publico
 *
 * Anti-enumeracao: o backend retorna 404 identico para token
 * invalido/expirado/usado. Componentes que chamam estes metodos devem
 * tratar 404 como "convite invalido ou expirado" sem distinguir.
 */
export const invitesApi = {
  /**
   * Cria convite (admin). Backend dispara email assincrono.
   */
  createInvite: async (
    orgId: string,
    payload: CreateInviteRequest,
  ): Promise<CreateInviteResponse> => {
    const { data } = await api.post<CreateInviteResponse>(
      `/organizations/${orgId}/invites`,
      payload,
    );
    return data;
  },

  /**
   * Lista convites pendentes da organizacao (ADMIN).
   * Backend retorna `{ invites: [...] }`.
   */
  listPending: async (orgId: string): Promise<PendingInvite[]> => {
    const { data } = await api.get<{ invites: PendingInvite[] } | PendingInvite[]>(
      `/organizations/${orgId}/invites`,
    );
    if (Array.isArray(data)) return data;
    return data?.invites ?? [];
  },

  /**
   * Busca info publica do convite por token (publico, sem auth).
   */
  getInfo: async (token: string): Promise<InviteInfo> => {
    const { data } = await api.get<InviteInfo>(
      `/invites/${encodeURIComponent(token)}`,
    );
    return data;
  },

  /**
   * Aceita convite — cria conta + auto-login (retorna tokens).
   */
  accept: async (
    token: string,
    payload: AcceptInviteRequest,
  ): Promise<AcceptInviteResponse> => {
    const { data } = await api.post<AcceptInviteResponse>(
      `/invites/${encodeURIComponent(token)}/accept`,
      payload,
    );
    return data;
  },
};

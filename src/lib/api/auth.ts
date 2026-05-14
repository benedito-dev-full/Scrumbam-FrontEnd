import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type {
  AuthResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  SwitchOrgResponse,
} from "@/types/auth";
import type { MeResponse, UpdateMeDto } from "@/types";

/**
 * Convite pendente exposto via `GET /auth/pending-invites` (ADR-V2-038).
 *
 * Diferente do tipo `PendingInvite` em `./invites.ts` — aquele é o que
 * o ADMIN vê dentro de uma org; este é o que o USUÁRIO ÓRFÃO vê de
 * convites endereçados ao seu email em qualquer org.
 *
 * IMPORTANTE: o `inviteId` aqui é APENAS para exibição. Para aceitar
 * o convite o usuário precisa clicar no link recebido por email
 * (que contém o `token` raw, não exposto neste DTO por segurança).
 */
export interface OrphanPendingInvite {
  inviteId: string;
  orgId: string;
  orgName: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
  expiresAt: string;
}

export interface OrphanPendingInvitesResponse {
  invites: OrphanPendingInvite[];
}

export const authApi = {
  login: async (dto: LoginRequest): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>(ENDPOINTS.AUTH_LOGIN, dto);
    return data;
  },

  register: async (dto: RegisterRequest): Promise<RegisterResponse> => {
    const { data } = await api.post<RegisterResponse>(
      ENDPOINTS.AUTH_REGISTER,
      dto,
    );
    return data;
  },

  getMe: async (): Promise<MeResponse> => {
    const { data } = await api.get<MeResponse>(ENDPOINTS.AUTH_ME);
    return data;
  },

  updateMe: async (
    dto: UpdateMeDto,
  ): Promise<{
    id: string;
    name: string;
    email: string;
    updatedAt: string;
  }> => {
    const { data } = await api.patch(ENDPOINTS.AUTH_ME, dto);
    return data;
  },

  deleteAccount: async (password: string) => {
    const { data } = await api.delete(ENDPOINTS.AUTH_DELETE_ACCOUNT, {
      data: { password },
    });
    return data;
  },

  deleteOrganization: async (orgId: string, password: string) => {
    const { data } = await api.delete(ENDPOINTS.AUTH_DELETE_ORG(orgId), {
      data: { password },
    });
    return data;
  },

  logout: async (): Promise<{ success: boolean }> => {
    const { data } = await api.post<{ success: boolean }>(
      ENDPOINTS.AUTH_LOGOUT,
    );
    return data;
  },

  /**
   * Troca a organização ativa da sessão (ADR-V2-030 — Multi-tenant identity).
   *
   * Backend valida que o usuário tem DVincula ativa na org alvo, emite novo
   * par de tokens (refresh rotacionado) com `organizationId` apontando para
   * a org de destino. Tokens antigos ficam INVÁLIDOS imediatamente.
   *
   * O caller DEVE:
   *  - Salvar AMBOS os novos tokens via `useAuthStore.setTokens(...)`.
   *  - Atualizar `user.organizationId/organizationName/orgRole` no store.
   *  - Limpar cache de queries (`queryClient.clear()`) para evitar leak.
   *  - Persistir `localStorage['scrumban-last-org']` = orgId.
   */
  switchOrg: async (organizationId: string): Promise<SwitchOrgResponse> => {
    const { data } = await api.post<SwitchOrgResponse>(
      ENDPOINTS.AUTH_SWITCH_ORG,
      { organizationId },
    );
    return data;
  },

  /**
   * Lista convites pendentes para o email do usuário autenticado
   * (ADR-V2-038 — Estado Órfão). Usado na tela `/orphan` para mostrar
   * convites que aguardam aceite.
   *
   * O backend retorna `{ invites: [...] }` com `inviteId` (sanitizado,
   * para exibição) mas NÃO retorna o `token` raw — o aceite continua
   * sendo via link do email (ver `invitesApi.accept`).
   */
  getPendingInvites: async (): Promise<OrphanPendingInvitesResponse> => {
    const { data } = await api.get<OrphanPendingInvitesResponse>(
      ENDPOINTS.AUTH_PENDING_INVITES,
    );
    return data;
  },

  /**
   * Aceita um convite por token raw (ADR-V2-038). Backend devolve novo
   * JWT já com `organizationId` populado, derrubando o estado órfão.
   *
   * Note que este método é destinado ao fluxo "usuário autenticado órfão
   * clica em CTA que carrega o token via querystring". Para o fluxo
   * tradicional (não autenticado, vindo do email com form de nome+senha),
   * usar `invitesApi.accept` que envia `{ name, password }`.
   */
  acceptInvite: async (token: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>(
      `/invites/${encodeURIComponent(token)}/accept`,
      {},
    );
    return data;
  },
};

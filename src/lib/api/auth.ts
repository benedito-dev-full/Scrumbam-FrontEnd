import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  SwitchOrgResponse,
} from "@/types/auth";
import type { MeResponse, UpdateMeDto } from "@/types";

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
};

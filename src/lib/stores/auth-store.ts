import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AvailableOrg, User } from "@/types/auth";

/**
 * Chave em localStorage para lembrar a última org visitada (ADR-V2-030).
 *
 * Após login, se houver mais de 1 org disponível, o frontend tenta
 * auto-entrar na última usada (se ainda válida no `availableOrgs`).
 */
export const LAST_ORG_LS_KEY = "scrumban-last-org";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  lastValidatedAt: number | null;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  /**
   * Atualiza apenas a lista de orgs disponíveis no perfil cacheado.
   * Usado pelo AuthProvider quando `/auth/me` retorna `availableOrgs`.
   */
  setAvailableOrgs: (orgs: AvailableOrg[]) => void;
  /**
   * Atualiza a org ativa no perfil cacheado (chamado após
   * `POST /auth/switch-org`).
   */
  setCurrentOrg: (params: {
    orgId: string;
    orgNome: string;
    role: string;
  }) => void;
  login: (user: User, accessToken?: string, refreshToken?: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  markValidated: () => void;
  needsRevalidation: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      lastValidatedAt: null,

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setAvailableOrgs: (orgs) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, availableOrgs: orgs } });
      },

      setCurrentOrg: ({ orgId, orgNome, role }) => {
        const current = get().user;
        if (!current) return;
        set({
          user: {
            ...current,
            orgId,
            orgNome,
            role: role.toLowerCase(),
          },
          // Marca como validado: troca de org acabou de roundtripear no backend.
          lastValidatedAt: Date.now(),
        });
      },

      login: (user, accessToken, refreshToken) =>
        set({
          user,
          ...(accessToken ? { accessToken } : {}),
          ...(refreshToken ? { refreshToken } : {}),
          lastValidatedAt: Date.now(),
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          lastValidatedAt: null,
        }),

      isAuthenticated: () => !!get().user && !!get().accessToken,

      markValidated: () => set({ lastValidatedAt: Date.now() }),

      needsRevalidation: () => {
        const last = get().lastValidatedAt;
        if (!last) return true;
        return Date.now() - last > 5 * 60 * 1000; // 5 minutos
      },
    }),
    {
      name: "scrumban-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        lastValidatedAt: state.lastValidatedAt,
      }),
    },
  ),
);

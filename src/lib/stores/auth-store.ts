import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  lastValidatedAt: number | null;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
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

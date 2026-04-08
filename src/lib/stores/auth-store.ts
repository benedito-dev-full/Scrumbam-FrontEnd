import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  lastValidatedAt: number | null;
  setUser: (user: User) => void;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  markValidated: () => void;
  needsRevalidation: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      lastValidatedAt: null,

      setUser: (user) => set({ user }),

      login: (user) => set({ user, lastValidatedAt: Date.now() }),

      logout: () => set({ user: null, lastValidatedAt: null }),

      isAuthenticated: () => !!get().user,

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
        lastValidatedAt: state.lastValidatedAt,
      }),
    },
  ),
);

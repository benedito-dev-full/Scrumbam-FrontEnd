import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      setUser: (user) => set({ user }),

      login: (user) => set({ user }),

      logout: () => set({ user: null }),

      isAuthenticated: () => !!get().user,
    }),
    {
      name: "scrumban-auth",
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
);

"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    user,
    login: storeLogin,
    logout: storeLogout,
    isAuthenticated,
  } = useAuthStore();

  const logout = useCallback(async () => {
    try {
      await authApi.logout(); // Limpa cookie httpOnly no backend
    } catch {
      // Mesmo se falhar (ex: rede), limpa state local
    }
    storeLogout();
    // Limpa cache do React Query — evita que queries da conta anterior
    // (projetos, membros, intentions, etc.) vazem para o proximo login
    // antes do staleTime expirar.
    queryClient.clear();
    router.replace("/login");
  }, [storeLogout, queryClient, router]);

  return {
    user,
    isAuthenticated: isAuthenticated(),
    login: storeLogin,
    logout,
  };
}

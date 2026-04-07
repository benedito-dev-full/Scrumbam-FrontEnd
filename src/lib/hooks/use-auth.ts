"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useAuth() {
  const router = useRouter();
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
    router.replace("/login");
  }, [storeLogout, router]);

  return {
    user,
    isAuthenticated: isAuthenticated(),
    login: storeLogin,
    logout,
  };
}

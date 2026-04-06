"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useAuth() {
  const router = useRouter();
  const {
    user,
    accessToken,
    login: storeLogin,
    logout: storeLogout,
    isAuthenticated,
  } = useAuthStore();

  const logout = useCallback(() => {
    storeLogout();
    router.replace("/login");
  }, [storeLogout, router]);

  return {
    user,
    accessToken,
    isAuthenticated: isAuthenticated(),
    login: storeLogin,
    logout,
  };
}

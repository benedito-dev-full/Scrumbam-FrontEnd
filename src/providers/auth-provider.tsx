"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { authApi } from "@/lib/api/auth";

const PUBLIC_PATHS = ["/login", "/register"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const markValidated = useAuthStore((s) => s.markValidated);
  const needsRevalidation = useAuthStore((s) => s.needsRevalidation);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Aguardar hydration do Zustand persist (localStorage -> state)
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Validar sessao via /auth/me (cookie httpOnly) ao montar
  useEffect(() => {
    if (!isHydrated || isValidating) return;

    const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    // Se tem user no store, validar que o cookie ainda e valido
    // Cache: so revalida se passaram mais de 5 minutos desde a ultima validacao
    if (user && !isPublicPath) {
      if (!needsRevalidation()) return; // cache valido, skip request

      setIsValidating(true);
      authApi
        .getMe()
        .then((me) => {
          // Atualizar user com dados frescos do backend
          setUser({
            id: user.id, // manter id do UserGroup (nao vem no /me)
            entidadeId: me.id,
            nome: me.name,
            email: me.email ?? user.email,
            role: me.role,
            orgId: me.organizationId,
            orgNome: me.organizationName,
          });
          markValidated();
        })
        .catch((err) => {
          // 429 = rate limit, nao e erro de auth — ignorar
          if (err?.response?.status === 429) return;
          // Cookie expirado ou invalido — limpar state e redirect
          logout();
          router.replace("/login");
        })
        .finally(() => setIsValidating(false));
    }

    // Se nao tem user e nao e rota publica, redirect para login
    if (!user && !isPublicPath) {
      router.replace("/login");
    }

    // Se tem user e esta em rota publica, redirect para app
    if (user && isPublicPath) {
      router.replace("/intentions");
    }
  }, [user, pathname, router, isHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enquanto nao hydratou, nao renderiza nada (evita flash de redirect)
  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}

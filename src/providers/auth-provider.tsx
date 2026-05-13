"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { authApi } from "@/lib/api/auth";

const PUBLIC_PATHS = ["/login", "/register", "/invite"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
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
            role: me.orgRole?.toLowerCase() || me.role || "member",
            orgId: me.organizationId,
            orgNome: me.organizationName,
            // ADR-V2-030: re-popular availableOrgs do backend a cada
            // revalidacao (5min). Se admin adicionou/removeu user de outra
            // org, o switcher reflete na proxima janela de revalidacao.
            availableOrgs: me.availableOrgs ?? [],
          });
          markValidated();
        })
        .catch((err) => {
          // 429 = rate limit, nao e erro de auth — ignorar
          if (err?.response?.status === 429) return;
          // Cookie expirado ou invalido — limpar state + cache e redirect.
          // queryClient.clear() evita que dados da conta anterior (projetos,
          // membros, intentions, etc.) vazem para o proximo login.
          logout();
          queryClient.clear();
          router.replace("/login");
        })
        .finally(() => setIsValidating(false));
    }

    // Se nao tem user e nao e rota publica, redirect para login
    if (!user && !isPublicPath) {
      router.replace("/login");
    }

    // Se tem user e esta em rota publica, redirect para app.
    // Excecao: /invite — usuario logado pode chegar aqui via flow=existing_user
    // (ja tem conta noutra org, esta sendo adicionado a esta). Deixa renderizar
    // a tela de merge em vez de expulsar para /intentions.
    if (user && isPublicPath && !pathname.startsWith("/invite")) {
      router.replace("/intentions");
    }
  }, [user, pathname, router, isHydrated]);

  // Enquanto nao hydratou, nao renderiza nada (evita flash de redirect)
  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}

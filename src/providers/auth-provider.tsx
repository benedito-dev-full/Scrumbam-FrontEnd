"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { getEntidadeIdFromToken } from "@/lib/auth/decode-jwt";

const PUBLIC_PATHS = ["/login", "/register", "/invite"];
const ORPHAN_PATH = "/orphan";

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
    const isOrphanPath = pathname.startsWith(ORPHAN_PATH);

    // Se tem user no store, validar que o cookie ainda e valido
    // Cache: so revalida se passaram mais de 5 minutos desde a ultima validacao
    if (user && !isPublicPath) {
      if (!needsRevalidation()) return; // cache valido, skip request

      setIsValidating(true);
      // entidadeId autoritativo vem do JWT (claim 'entidadeId'). me.id pode
      // ser DUserGroup.chave, sobrescrever quebraria o filtro de assignee.
      const accessToken = useAuthStore.getState().accessToken;
      const entidadeIdFromToken =
        getEntidadeIdFromToken(accessToken) || user.entidadeId;
      authApi
        .getMe()
        .then((me) => {
          // ADR-V2-038: estado órfão — JWT válido sem organizationId.
          // Hidrata user com flag isOrphan e redireciona para /orphan.
          if (me.isOrphan) {
            setUser({
              id: user.id,
              entidadeId: entidadeIdFromToken,
              nome: me.name,
              email: me.email ?? user.email,
              role: "",
              orgId: "",
              orgNome: "",
              availableOrgs: [],
              isOrphan: true,
            });
            markValidated();
            if (!isOrphanPath) {
              router.replace(ORPHAN_PATH);
            }
            return;
          }
          // Atualizar user com dados frescos do backend
          setUser({
            id: user.id, // manter id do UserGroup (nao vem no /me)
            entidadeId: entidadeIdFromToken,
            nome: me.name,
            email: me.email ?? user.email,
            role: me.orgRole?.toLowerCase() || me.role || "member",
            orgId: me.organizationId,
            orgNome: me.organizationName,
            // ADR-V2-030: re-popular availableOrgs do backend a cada
            // revalidacao (5min). Se admin adicionou/removeu user de outra
            // org, o switcher reflete na proxima janela de revalidacao.
            availableOrgs: me.availableOrgs ?? [],
            isOrphan: false,
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

    // ADR-V2-038: user órfão tentando acessar rota tenant-scoped → /orphan.
    // O interceptor 403 NO_WORKSPACE em client.ts também faz isso, mas
    // pegamos antes para evitar 1 round-trip desnecessário.
    if (user?.isOrphan && !isPublicPath && !isOrphanPath) {
      router.replace(ORPHAN_PATH);
    }

    // Se tem user e esta em rota publica, redirect para app.
    // Excecao: /invite — usuario logado pode chegar aqui via flow=existing_user
    // (ja tem conta noutra org, esta sendo adicionado a esta). Deixa renderizar
    // a tela de merge em vez de expulsar para /intentions.
    if (user && isPublicPath && !pathname.startsWith("/invite")) {
      router.replace(user.isOrphan ? ORPHAN_PATH : "/intentions");
    }
  }, [user, pathname, router, isHydrated]);

  // Enquanto nao hydratou, nao renderiza nada (evita flash de redirect)
  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  Loader2,
  LogOut,
  Settings,
  User as UserIcon,
  UserPlus,
} from "lucide-react";

import { useAuth } from "@/lib/hooks/use-auth";
import { LAST_ORG_LS_KEY, useAuthStore } from "@/lib/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Workspace switcher para a sidebar (ADR-V2-030 — Multi-tenant identity).
 *
 * Renderiza um dropdown com:
 *  - Header com nome/email do user e atalhos de perfil/configurações/sair.
 *  - Lista de orgs disponíveis (`user.availableOrgs`). A org atual é marcada.
 *  - Cliques disparam `POST /auth/switch-org`, atualizam tokens + store,
 *    limpam cache do Tanstack (queries da org antiga ficariam stale) e
 *    fazem `router.refresh()` para re-render server components.
 *
 * UX:
 *  - Quando `availableOrgs.length <= 1`, omite a seção de orgs (fica só
 *    o menu de perfil — mantém parity visual com o header antigo).
 *  - Spinner inline durante a troca (200-500ms típico). Botão fica
 *    `disabled` para evitar duplo-clique.
 *
 * Não-objetivos:
 *  - Criar nova org via dropdown (separado em /organizations/new — fora do escopo).
 *  - Favoritos / recentes / atalhos de teclado (COULD HAVE).
 */
export function WorkspaceSwitcher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setCurrentOrg = useAuthStore((s) => s.setCurrentOrg);
  const setAvailableOrgs = useAuthStore((s) => s.setAvailableOrgs);

  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orgs = user?.availableOrgs ?? [];
  const hasMultiple = orgs.length > 1;

  // ADR-V2-038: usuário órfão (sem workspace) — não renderizar o switcher.
  // A própria sidebar redireciona para /orphan; este componente ficaria
  // sem dados (sem orgNome, sem orgId) e quebraria visualmente.
  if (user?.isOrphan) {
    return null;
  }

  const orgInitials = (user?.orgNome || "DT")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const orgShort =
    user?.orgNome && user.orgNome.length > 16
      ? user.orgNome.slice(0, 14) + ".."
      : user?.orgNome || "Workspace";

  async function handleSwitch(targetId: string) {
    if (!user || targetId === user.orgId || switching) return;
    setSwitching(targetId);
    setError(null);
    try {
      const data = await authApi.switchOrg(targetId);
      setTokens(data.accessToken, data.refreshToken);
      setCurrentOrg({
        orgId: data.user.organizationId || targetId,
        orgNome: data.user.organizationName || "",
        role: data.user.orgRole || "MEMBER",
      });
      // Re-popular availableOrgs também — server pode ter atualizado lista.
      if (data.user.availableOrgs) {
        setAvailableOrgs(data.user.availableOrgs);
      }
      // CRITICAL: queries em cache podem conter dados da org antiga
      // (projects, tasks, intentions, etc.). Limpar tudo evita leak entre
      // tenants. Componentes que estavam no DOM serao re-fetchados.
      queryClient.clear();
      // Persistir last-org para o proximo login resolver direto.
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LAST_ORG_LS_KEY, targetId);
      }
      // router.refresh() re-executa server components com o novo token.
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao trocar de organizacao";
      setError(message);
    } finally {
      setSwitching(null);
    }
  }

  return (
    <div className="group/ws flex flex-1 min-w-0 items-center rounded-md hover:bg-sidebar-accent transition-colors">
      {/* Clique no nome/avatar -> tela de visao geral do workspace. */}
      <Link
        href="/workspace"
        className="flex flex-1 min-w-0 items-center gap-2 rounded-l-md px-1.5 py-1"
        aria-label={`Abrir visao geral de ${orgShort}`}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gradient-to-br from-cyan-400 to-cyan-600 text-[10px] font-bold text-black">
          {orgInitials}
        </span>
        <span className="truncate text-[14px] font-medium">{orgShort}</span>
      </Link>
      {/* Chevron isolado -> abre dropdown (trocar org / perfil / sair). */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-7 shrink-0 items-center justify-center rounded-r-md px-1 text-muted-foreground/70 hover:text-foreground transition-colors"
            aria-label="Menu do workspace"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-medium">
                {user?.nome || "Usuario"}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                {user?.email || ""}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {hasMultiple && (
            <>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground/80 font-semibold">
                Workspaces
              </DropdownMenuLabel>
              {orgs.map((org) => {
                const isCurrent = org.id === user?.orgId;
                const isLoading = switching === org.id;
                return (
                  <DropdownMenuItem
                    key={org.id}
                    disabled={isCurrent || !!switching}
                    onSelect={(e) => {
                      e.preventDefault();
                      if (!isCurrent) void handleSwitch(org.id);
                    }}
                    className={cn(
                      "text-[13px] flex items-center gap-2",
                      isCurrent && "opacity-100",
                    )}
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded bg-muted text-[9px] font-bold uppercase">
                      {org.nome.slice(0, 2)}
                    </span>
                    <span
                      className="flex-1 truncate"
                      title={`${org.nome} (${org.role})`}
                    >
                      {org.nome}
                    </span>
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    ) : isCurrent ? (
                      <Check className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : null}
                  </DropdownMenuItem>
                );
              })}
              {error && (
                <div className="px-2 py-1 text-[11px] text-destructive">
                  {error}
                </div>
              )}
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem asChild className="text-[13px]">
            <Link href="/settings/account/profile">
              <UserIcon className="mr-2 h-3.5 w-3.5" />
              Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="text-[13px]">
            <Link href="/settings">
              <Settings className="mr-2 h-3.5 w-3.5" />
              Configuracoes
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="text-[13px]">
            <Link href="/settings/workspace/members">
              <UserPlus className="mr-2 h-3.5 w-3.5" />
              Convidar e gerenciar membros
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className="text-[13px] text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

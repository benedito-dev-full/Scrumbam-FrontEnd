"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Plus, LogOut } from "lucide-react";

import { authApi } from "@/lib/api/auth";
import type {
  OrphanPendingInvite,
  OrphanPendingInvitesResponse,
} from "@/lib/api/auth";
import { organizationsApi } from "@/lib/api/organizations";
import { LAST_ORG_LS_KEY, useAuthStore } from "@/lib/stores/auth-store";
import type { AuthResponse, User } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageTitle } from "@/lib/hooks/use-page-title";

/**
 * Tela de estado órfão (ADR-V2-038).
 *
 * Renderizada quando o usuário autenticado NÃO está em nenhuma workspace
 * (JWT válido mas sem `organizationId`). O AuthProvider redireciona aqui
 * tanto via `me.isOrphan` quanto via interceptor 403 NO_WORKSPACE.
 *
 * CTAs:
 *  - Listar convites pendentes (apenas display — aceite via link do email).
 *  - Criar nova workspace → switchOrg → /intentions.
 *  - Sair.
 *
 * Nota sobre aceite de convite (Opção A — recomendada pelo backend):
 *  O endpoint `GET /auth/pending-invites` retorna `inviteId` sanitizado
 *  (sem o `token` raw, por segurança — anti-enumeração). Para aceitar
 *  o convite, o usuário precisa clicar no link recebido por email, que
 *  contém o token raw em `?token=XXX`.
 *
 *  Follow-up possível (Opção B, fora do escopo): backend expõe rota
 *  autenticada `POST /auth/accept-invite/:inviteId` que aceita pelo
 *  ID sem precisar do token raw. Permitiria aceite com 1 clique aqui.
 */
function buildUser(data: AuthResponse): User {
  return {
    id: data.user.id,
    entidadeId: data.user.entidadeId ?? "",
    nome: data.user.name,
    email: data.user.email,
    role: data.user.orgRole?.toLowerCase() || data.user.role || "member",
    orgId: data.user.organizationId || "",
    orgNome: data.user.organizationName || "",
    availableOrgs: data.user.availableOrgs ?? [],
    isOrphan: data.user.isOrphan ?? !data.user.organizationId,
  };
}

export default function OrphanPage() {
  usePageTitle("Criar workspace");
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const storeLogout = useAuthStore((s) => s.logout);

  const [newOrgName, setNewOrgName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<OrphanPendingInvitesResponse>({
    queryKey: ["auth", "pending-invites"],
    queryFn: () => authApi.getPendingInvites(),
    // 403 NO_WORKSPACE não se aplica aqui — `/auth/pending-invites` é
    // user-scoped (não tenant-scoped), retorna 200 para órfão.
    retry: false,
  });

  const invites: OrphanPendingInvite[] = data?.invites ?? [];

  const createMutation = useMutation({
    mutationFn: async (nome: string) => {
      const org = await organizationsApi.create({ nome });
      // Após criar, switch-org emite novo JWT com organizationId populado,
      // derrubando o estado órfão.
      const resp = await authApi.switchOrg(org.id);
      return resp;
    },
    onSuccess: (resp) => {
      const newUser = buildUser(resp);
      login(newUser, resp.accessToken, resp.refreshToken);
      if (typeof window !== "undefined" && newUser.orgId) {
        window.localStorage.setItem(LAST_ORG_LS_KEY, newUser.orgId);
      }
      // Limpa cache: queries antigas podem ter retornado 403 e poluído
      // o cache durante o estado órfão.
      queryClient.clear();
      router.replace("/intentions");
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        const msg =
          (err.response?.data as { message?: string } | undefined)?.message ||
          "Erro ao criar workspace.";
        setCreateError(msg);
      } else {
        setCreateError("Erro ao criar workspace.");
      }
    },
  });

  function handleLogout() {
    storeLogout();
    queryClient.clear();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="w-full max-w-md space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-[26px] font-semibold tracking-tight">
            Você ainda não está em nenhuma workspace
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Crie uma nova workspace ou aguarde um convite para começar
            {user?.email ? ` (${user.email})` : ""}.
          </p>
        </header>

        {/* Convites pendentes */}
        <section className="space-y-3">
          <h2 className="text-[12px] uppercase tracking-wide font-semibold text-muted-foreground">
            Convites pendentes
          </h2>

          {isLoading && (
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Carregando convites...
            </div>
          )}

          {!isLoading && invites.length === 0 && (
            <p className="text-[13px] text-muted-foreground">
              Nenhum convite no momento.
            </p>
          )}

          {invites.map((inv) => (
            <div
              key={inv.inviteId}
              className="flex items-start justify-between rounded-md border border-border bg-card p-3"
            >
              <div className="flex items-start gap-2 min-w-0">
                <Mail className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium truncate">
                    {inv.orgName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Convite como {inv.role}
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                Abra o link do email
              </span>
            </div>
          ))}

          {!isLoading && invites.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Para aceitar, clique no link recebido por email. O token de
              segurança não é exposto aqui.
            </p>
          )}
        </section>

        {/* Criar workspace */}
        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="text-[12px] uppercase tracking-wide font-semibold text-muted-foreground">
            Criar nova workspace
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCreateError(null);
              const trimmed = newOrgName.trim();
              if (!trimmed) {
                setCreateError("Informe o nome da workspace.");
                return;
              }
              createMutation.mutate(trimmed);
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="org-name" className="text-[12px]">
                Nome da workspace
              </Label>
              <Input
                id="org-name"
                type="text"
                placeholder="Ex: Acme Corp"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                disabled={createMutation.isPending}
                autoFocus
                className="h-10 text-[14px]"
              />
            </div>

            {createError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                <p className="text-[12px] text-destructive">{createError}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={!newOrgName.trim() || createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Criar workspace
                </>
              )}
            </Button>
          </form>
        </section>

        {/* Logout */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-3 w-3" />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}

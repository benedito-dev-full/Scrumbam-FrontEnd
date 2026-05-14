"use client";

import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, LogOut } from "lucide-react";

import { authApi } from "@/lib/api/auth";
import type {
  OrphanPendingInvite,
  OrphanPendingInvitesResponse,
} from "@/lib/api/auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { CreateWorkspaceForm } from "@/components/common/create-workspace-form";
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
 *  - Criar nova workspace via `CreateWorkspaceForm` → redireciona /intentions.
 *  - Sair.
 *
 * O form de criação é o mesmo componente reaproveitado pelo
 * `WorkspaceSwitcher` (dropdown da sidebar). A única diferença é o
 * comportamento pós-sucesso: aqui redireciona; lá apenas `router.refresh()`.
 *
 * Nota sobre aceite de convite (Opção A — recomendada pelo backend):
 *  O endpoint `GET /auth/pending-invites` retorna `inviteId` sanitizado
 *  (sem o `token` raw, por segurança — anti-enumeração). Para aceitar
 *  o convite, o usuário precisa clicar no link recebido por email, que
 *  contém o token raw em `?token=XXX`.
 */
export default function OrphanPage() {
  usePageTitle("Criar workspace");
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const storeLogout = useAuthStore((s) => s.logout);

  const { data, isLoading } = useQuery<OrphanPendingInvitesResponse>({
    queryKey: ["auth", "pending-invites"],
    queryFn: () => authApi.getPendingInvites(),
    // 403 NO_WORKSPACE não se aplica aqui — `/auth/pending-invites` é
    // user-scoped (não tenant-scoped), retorna 200 para órfão.
    retry: false,
  });

  const invites: OrphanPendingInvite[] = data?.invites ?? [];

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

          <CreateWorkspaceForm
            autoFocus
            onSuccess={() => {
              router.replace("/intentions");
            }}
          />
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

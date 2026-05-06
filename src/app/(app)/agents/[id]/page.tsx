"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
  Server,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAgent,
  useDeleteAgent,
  useRegenerateInstallToken,
} from "@/lib/hooks/use-agents";
import { AgentStatusBadge } from "../components/agent-status-badge";
import { InstallSnippet } from "../components/install-snippet";
import { cn } from "@/lib/utils";
import type { RegenerateInstallTokenResponse } from "@/lib/api/agents";

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: agent, isLoading } = useAgent(id);
  const regenMutation = useRegenerateInstallToken();
  const deleteMutation = useDeleteAgent();

  usePageTitle(agent?.nome ?? "Agente");

  const [regenerated, setRegenerated] =
    useState<RegenerateInstallTokenResponse | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleRegenerate = () => {
    regenMutation.mutate(id, {
      onSuccess: (data) => setRegenerated(data),
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => router.push("/agents"),
    });
  };

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        {/* Top breadcrumb */}
        <header className="flex h-11 shrink-0 items-center px-8 border-b border-border">
          <nav className="flex items-center gap-1.5 text-[13px] min-w-0">
            <Link
              href="/agents"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Agentes
            </Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <Server className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium truncate">{agent?.nome ?? "..."}</span>
          </nav>
        </header>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Main */}
          <div className="flex-1 overflow-auto">
            <div className="px-8 py-6">
              <div className="mx-auto max-w-3xl space-y-6">
                {isLoading ? (
                  <SkeletonBody />
                ) : !agent ? (
                  <p className="text-[13px] text-muted-foreground">
                    Agente nao encontrado.
                  </p>
                ) : (
                  <>
                    {/* Header */}
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Server className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-semibold tracking-tight">
                          {agent.nome}
                        </h1>
                        {agent.hostname && (
                          <p className="text-[13px] text-muted-foreground font-mono mt-1">
                            {agent.hostname}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Pending install banner */}
                    {agent.status === "pending_install" && (
                      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-[13px] font-medium text-amber-200">
                              Aguardando instalacao na VPS
                            </p>
                            <p className="text-[12px] text-amber-200/80">
                              Se voce fechou a janela sem copiar o comando ou o
                              token expirou (TTL 10 min), regenere para receber
                              um novo one-liner.
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleRegenerate}
                          disabled={regenMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="text-[12px] h-8"
                        >
                          {regenMutation.isPending ? (
                            <>
                              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-1.5 h-3 w-3" />
                              Regenerar token
                            </>
                          )}
                        </Button>

                        {regenerated && (
                          <div className="mt-2 space-y-1.5">
                            <p className="text-[12px] font-medium">
                              Novo comando (valido por 10 minutos):
                            </p>
                            <InstallSnippet
                              command={regenerated.oneLineInstall}
                              expiresAt={regenerated.installTokenExp}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Info card */}
                    <section className="rounded-md border border-border bg-card overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/40">
                        <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                          Informacoes
                        </h2>
                      </div>
                      <dl className="text-[13px]">
                        <InfoRow
                          label="Versao do daemon"
                          value={
                            agent.agentVersion ? (
                              <span className="font-mono">
                                {agent.agentVersion}
                              </span>
                            ) : (
                              "—"
                            )
                          }
                        />
                        <InfoRow
                          label="Porta do tunel"
                          value={
                            agent.tunnelPort ? (
                              <span className="font-mono">
                                {agent.tunnelPort}
                              </span>
                            ) : (
                              "—"
                            )
                          }
                        />
                        <InfoRow
                          label="Ultimo heartbeat"
                          value={
                            agent.lastHeartbeat
                              ? new Date(agent.lastHeartbeat).toLocaleString(
                                  "pt-BR",
                                )
                              : "Sem heartbeat ainda"
                          }
                        />
                        <InfoRow
                          label="Criado em"
                          value={new Date(agent.createdAt).toLocaleString(
                            "pt-BR",
                          )}
                        />
                        {agent.installedAt && (
                          <InfoRow
                            label="Instalado em"
                            value={new Date(agent.installedAt).toLocaleString(
                              "pt-BR",
                            )}
                          />
                        )}
                      </dl>
                    </section>

                    {/* Danger zone */}
                    <section className="space-y-2">
                      <h2 className="text-[13px] font-medium text-destructive">
                        Zona de perigo
                      </h2>
                      <div className="rounded-md border border-destructive/30 bg-card overflow-hidden">
                        <div className="flex items-center justify-between gap-6 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium">
                              Remover agente
                            </p>
                            <p className="text-[12px] text-muted-foreground mt-0.5">
                              Fecha o tunel SSH no Argus e libera a porta. Nao
                              para o daemon na VPS.
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDelete(true)}
                            className="text-[12px] text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    </section>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right side panel */}
          <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-l border-border overflow-auto">
            <section className="border-b border-border px-4 py-4">
              <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground mb-3">
                Propriedades
              </h3>
              <dl className="space-y-2 text-[12px]">
                <PropRow
                  label="Status"
                  value={agent ? <AgentStatusBadge status={agent.status} /> : "—"}
                />
                <PropRow
                  label="Hostname"
                  value={
                    <span className="truncate font-mono text-[11px]">
                      {agent?.hostname ?? "—"}
                    </span>
                  }
                />
                <PropRow
                  label="Porta"
                  value={
                    <span className="tabular-nums">
                      {agent?.tunnelPort ?? "—"}
                    </span>
                  }
                />
              </dl>
            </section>

            <section className="px-4 py-4">
              <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Como funciona
              </h3>
              <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                Cada agente abre um tunel SSH reverso para o Argus. O backend
                envia comandos via canal e recebe heartbeats a cada 30s. Apos
                90s sem heartbeat, o agente fica marcado como{" "}
                <code className="text-[10px] bg-muted px-1 rounded">offline</code>.
              </p>
            </section>
          </aside>
        </div>
      </div>

      {/* Confirm delete */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover agente {agent?.nome}?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>Esta acao:</p>
                <ul className="list-disc ml-5 space-y-1 text-[12px]">
                  <li>Marca o agente como excluido (soft delete).</li>
                  <li>Libera a porta {agent?.tunnelPort ?? "alocada"}.</li>
                  <li>Fecha o tunel SSH no Argus.</li>
                  <li>
                    <strong>Nao para</strong> o daemon na VPS — rode{" "}
                    <code className="text-[11px]">uninstall.sh</code>{" "}
                    remotamente.
                  </li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(false)}
              disabled={deleteMutation.isPending}
              className="text-[12px]"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-[12px]"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Removendo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-3 w-3" />
                  Remover
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

// ============================================================
// Sub-components
// ============================================================

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[140px_1fr] gap-3 items-center px-4 py-2.5 border-b border-border last:border-b-0",
      )}
    >
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="truncate">{value}</dd>
    </div>
  );
}

function PropRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <dt className="w-16 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex-1 truncate">{value}</dd>
    </div>
  );
}

function SkeletonBody() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-4">
        <div className="h-12 w-12 bg-muted rounded-md" />
        <div className="flex-1 space-y-2">
          <div className="h-7 w-2/3 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
        </div>
      </div>
      <div className="h-40 w-full bg-muted/40 rounded-md" />
    </div>
  );
}

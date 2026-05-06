"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Server,
  Trash2,
  MoreHorizontal,
  Loader2,
} from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useAgents, useDeleteAgent } from "@/lib/hooks/use-agents";
import { AgentStatusBadge } from "./components/agent-status-badge";
import { AddAgentDialog } from "./components/add-agent-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Pagina /agents — lista de agentes remotos da organizacao (Linear-style).
 * Refresh automatico a cada 15s.
 * Visivel apenas para ADMIN.
 */
export default function AgentsPage() {
  usePageTitle("Agentes");
  const { data: agents, isLoading } = useAgents();
  const deleteMutation = useDeleteAgent();
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex h-11 shrink-0 items-center justify-between px-8 border-b border-border">
          <h1 className="text-[13px] font-medium">Agentes</h1>
          <AddAgentDialog />
        </header>

        {/* Sub-header com info */}
        <div className="flex h-10 shrink-0 items-center px-8 border-b border-border">
          <p className="text-[12px] text-muted-foreground">
            Daemons remotos conectados via tunel SSH reverso. Heartbeat a cada
            30s; offline apos 90s sem ping.
          </p>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {/* Column headers */}
          <div className="grid grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)_100px_140px_28px] items-center gap-3 border-b border-border px-8 py-2 text-[11px] font-medium text-muted-foreground">
            <div>Nome</div>
            <div>Status</div>
            <div>Hostname</div>
            <div>Porta</div>
            <div>Ultimo heartbeat</div>
            <div></div>
          </div>

          {isLoading ? (
            <SkeletonRows />
          ) : !agents?.length ? (
            <EmptyState />
          ) : (
            agents.map((a) => (
              <AgentRow
                key={a.id}
                agent={a}
                onDelete={() =>
                  setConfirmDelete({ id: a.id, name: a.nome })
                }
              />
            ))
          )}
        </div>
      </div>

      {/* Confirm delete dialog */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover agente?</DialogTitle>
            <DialogDescription>
              <strong>{confirmDelete?.name}</strong> sera desconectado e
              removido da organizacao. Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(null)}
              className="text-[12px]"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirmDelete) {
                  deleteMutation.mutate(confirmDelete.id, {
                    onSuccess: () => setConfirmDelete(null),
                  });
                }
              }}
              disabled={deleteMutation.isPending}
              className="text-[12px]"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Sim, remover"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

// ============================================================
// Row
// ============================================================

interface AgentRowProps {
  agent: {
    id: string;
    nome: string;
    status: "pending_install" | "never_connected" | "online" | "offline";
    hostname: string | null;
    tunnelPort: number | null;
    lastHeartbeat: string | null;
  };
  onDelete: () => void;
}

function AgentRow({ agent: a, onDelete }: AgentRowProps) {
  return (
    <Link
      href={`/agents/${a.id}`}
      className="grid grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)_100px_140px_28px] items-center gap-3 border-b border-border/40 px-8 py-2 text-[13px] hover:bg-accent/30 transition-colors"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Server className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium">{a.nome}</span>
      </div>

      <AgentStatusBadge status={a.status} />

      <span className="truncate text-[12px] text-muted-foreground font-mono">
        {a.hostname ?? "—"}
      </span>

      <span className="text-[12px] text-muted-foreground tabular-nums">
        {a.tunnelPort ?? "—"}
      </span>

      <span className="text-[12px] text-muted-foreground">
        {a.lastHeartbeat ? formatRelative(a.lastHeartbeat) : "—"}
      </span>

      <div onClick={(e) => e.preventDefault()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Mais"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              className="text-[12px] text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Link>
  );
}

// ============================================================
// Empty / Skeleton
// ============================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <Server
        className="h-10 w-10 text-muted-foreground/30"
        strokeWidth={1.25}
      />
      <h3 className="mt-3 text-sm font-medium">Nenhum agente ainda</h3>
      <p className="mt-1 max-w-md text-[12px] text-muted-foreground">
        Adicione um agente remoto para conectar uma VPS ao Scrumban via tunel
        SSH reverso.
      </p>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="grid grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)_100px_140px_28px] items-center gap-3 border-b border-border/40 px-8 py-2 animate-pulse"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-muted rounded" />
            <div className="h-3 w-32 bg-muted rounded" />
          </div>
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-3 w-32 bg-muted rounded" />
          <div className="h-3 w-12 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
          <div></div>
        </div>
      ))}
    </>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "agora";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m atras`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h atras`;
  const d = Math.floor(hr / 24);
  return `${d}d atras`;
}

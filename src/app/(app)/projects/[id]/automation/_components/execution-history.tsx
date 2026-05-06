"use client";

import { useState } from "react";
import { History, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useExecutionHistory } from "@/lib/hooks/use-automation";
import type { Execution, ExecutionStatus } from "@/lib/api/automation";

interface ExecutionHistoryProps {
  projectId: string;
}

const STATUS_VARIANT: Record<
  ExecutionStatus,
  { label: string; className: string }
> = {
  queued: {
    label: "Em fila",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
  running: {
    label: "Rodando",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  },
  awaiting_approval: {
    label: "Aguard. aprovacao",
    className: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  },
  success: {
    label: "Sucesso",
    className: "bg-green-500/10 text-green-600 border-green-500/30",
  },
  failed: {
    label: "Falhou",
    className: "bg-red-500/10 text-red-600 border-red-500/30",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-muted text-muted-foreground border-border",
  },
  rolled_back: {
    label: "Rollback",
    className: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  },
  timeout: {
    label: "Timeout",
    className: "bg-red-500/10 text-red-700 border-red-500/30",
  },
};

const PAGE_SIZE = 20;

/**
 * Lista de DExecution do projeto, com cursor pagination.
 *
 * Cada linha mostra:
 * - intent (nome curto: "git-creds-generate", "git-config-apply", etc.)
 * - status (badge colorido)
 * - startedAt
 * - duration (ms -> humanizado)
 * - riskLevel (apenas se setado em Fase 3)
 *
 * Empty state amigavel para projetos sem historico.
 */
export function ExecutionHistory({ projectId }: ExecutionHistoryProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([]);

  const { data, isLoading } = useExecutionHistory(projectId, {
    cursor,
    limit: PAGE_SIZE,
  });

  const items = data?.items ?? [];
  const hasMore = data?.hasMore ?? false;
  const canGoBack = cursorStack.length > 0;

  const goNext = () => {
    if (data?.nextCursor) {
      setCursorStack((s) => [...s, cursor]);
      setCursor(data.nextCursor);
    }
  };

  const goBack = () => {
    if (cursorStack.length === 0) return;
    const prev = cursorStack[cursorStack.length - 1];
    setCursorStack((s) => s.slice(0, -1));
    setCursor(prev);
  };

  return (
    <section className="rounded-md border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-card/40">
        <div className="flex items-center gap-2 min-w-0">
          <History className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Historico de execucoes
          </h2>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {items.length > 0 && `${items.length} registros nesta pagina`}
        </div>
      </header>

      {isLoading ? (
        <SkeletonRows />
      ) : !items.length ? (
        <EmptyState />
      ) : (
        <>
          {/* Header (desktop) */}
          <div className="hidden sm:grid grid-cols-[80px_minmax(0,1fr)_120px_140px_90px] items-center gap-3 border-b border-border px-4 py-2 text-[11px] font-medium text-muted-foreground">
            <div>ID</div>
            <div>Intent</div>
            <div>Status</div>
            <div>Iniciado</div>
            <div>Duracao</div>
          </div>

          {items.map((exec) => (
            <ExecutionRow key={exec.id} execution={exec} />
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-card/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goBack}
              disabled={!canGoBack}
              className="text-[12px] h-7"
            >
              <ChevronLeft className="mr-1 h-3 w-3" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goNext}
              disabled={!hasMore}
              className="text-[12px] h-7"
            >
              Proxima
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

function ExecutionRow({ execution }: { execution: Execution }) {
  const status = STATUS_VARIANT[execution.status] ?? {
    label: execution.status,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[80px_minmax(0,1fr)_120px_140px_90px] items-center gap-2 sm:gap-3 border-b border-border/40 px-4 py-2 text-[13px] last:border-b-0">
      <div className="text-[12px] text-muted-foreground font-mono tabular-nums">
        #{execution.id}
      </div>

      <div className="min-w-0">
        <p className="truncate font-medium text-[13px]">
          {execution.intent ?? <span className="italic">Sem intent</span>}
        </p>
        {execution.exitCode !== null && execution.exitCode !== 0 && (
          <p className="text-[11px] text-destructive">
            exit code: {execution.exitCode}
          </p>
        )}
      </div>

      <div>
        <Badge variant="outline" className={status.className}>
          {status.label}
        </Badge>
      </div>

      <div className="text-[12px] text-muted-foreground">
        {execution.startedAt ? formatRelative(execution.startedAt) : "—"}
      </div>

      <div className="text-[12px] text-muted-foreground tabular-nums">
        {execution.durationMs != null
          ? formatDuration(execution.durationMs)
          : "—"}
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="grid grid-cols-[80px_minmax(0,1fr)_120px_140px_90px] gap-3 border-b border-border/40 px-4 py-2 animate-pulse"
        >
          <div className="h-4 w-12 bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
      <History
        className="h-8 w-8 text-muted-foreground/30"
        strokeWidth={1.25}
      />
      <h3 className="mt-2 text-[13px] font-medium">Sem execucoes ainda</h3>
      <p className="mt-1 max-w-md text-[11px] text-muted-foreground">
        Quando comandos forem disparados (ex: gerar deploy key, aplicar config),
        aparecerao aqui.
      </p>
    </div>
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

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const min = Math.floor(ms / 60_000);
  const sec = Math.floor((ms % 60_000) / 1000);
  return `${min}m${sec}s`;
}

"use client";

import { useState } from "react";
import { History, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "./risk-badge";
import { ExecutionDetailModal } from "./execution-detail-modal";
import { useExecutionHistory } from "@/lib/hooks/use-automation";
import { EXECUTION_STATUS_CONFIG } from "@/lib/constants";
import type { Execution, ExecutionStatus, RiskLevel } from "@/types/execution";
import type { ListExecutionsQuery } from "@/lib/api/automation";

interface ExecutionHistoryProps {
  projectId: string;
}

const PAGE_SIZE = 20;

/**
 * Lista de DExecution do projeto — Fase 3.
 *
 * Colunas: ID | Intencao | Risco | Status | PR | Iniciado | Duracao | Acoes
 * Clicar na row abre ExecutionDetailModal com detalhe completo.
 * Cursor pagination preservado da Fase 2.
 */
export function ExecutionHistory({ projectId }: ExecutionHistoryProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([]);
  const [selectedExecId, setSelectedExecId] = useState<string | null>(null);

  const { data, isLoading } = useExecutionHistory(projectId, {
    cursor,
    limit: PAGE_SIZE,
  });

  // Compatibilidade: itens podem vir em formatos distintos entre Fase 2 e 3
  const rawData = data as unknown as {
    items?: Execution[];
    data?: { items?: Execution[] };
    nextCursor?: string | null;
    hasMore?: boolean;
  };
  const items: Execution[] = rawData?.data?.items ?? rawData?.items ?? [];
  const hasMore = rawData?.hasMore ?? !!rawData?.nextCursor;
  const nextCursor = rawData?.nextCursor;
  const canGoBack = cursorStack.length > 0;

  const goNext = () => {
    if (nextCursor) {
      setCursorStack((s) => [...s, cursor]);
      setCursor(nextCursor ?? undefined);
    }
  };

  const goBack = () => {
    if (cursorStack.length === 0) return;
    const prev = cursorStack[cursorStack.length - 1];
    setCursorStack((s) => s.slice(0, -1));
    setCursor(prev);
  };

  return (
    <>
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
            <div className="hidden md:grid grid-cols-[60px_minmax(0,1fr)_90px_120px_50px_130px_80px_60px] items-center gap-2 border-b border-border px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              <div>ID</div>
              <div>Intencao</div>
              <div>Risco</div>
              <div>Status</div>
              <div>PR</div>
              <div>Iniciado</div>
              <div>Duracao</div>
              <div></div>
            </div>

            {items.map((exec) => (
              <ExecutionRow
                key={exec.id}
                execution={exec}
                onClick={() => setSelectedExecId(exec.id)}
              />
            ))}

            {/* Paginacao */}
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

      <ExecutionDetailModal
        executionId={selectedExecId}
        projectId={projectId}
        open={!!selectedExecId}
        onOpenChange={(o) => { if (!o) setSelectedExecId(null) }}
      />
    </>
  );
}

function ExecutionRow({
  execution,
  onClick,
}: {
  execution: Execution;
  onClick: () => void;
}) {
  const statusConfig = EXECUTION_STATUS_CONFIG[execution.status as ExecutionStatus] ?? {
    label: execution.status,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[60px_minmax(0,1fr)_90px_120px_50px_130px_80px_60px] items-center gap-2 border-b border-border/40 px-4 py-2.5 text-[13px] last:border-b-0 hover:bg-accent/40 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* ID */}
      <div className="text-[11px] text-muted-foreground font-mono tabular-nums">
        #{execution.id.slice(-6)}
      </div>

      {/* Intencao */}
      <div className="min-w-0">
        <p className="truncate font-medium text-[13px]">
          {execution.intent || <span className="italic text-muted-foreground">Sem descricao</span>}
        </p>
      </div>

      {/* Risco */}
      <div>
        {execution.riskLevel ? (
          <RiskBadge level={execution.riskLevel as RiskLevel} size="sm" />
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        )}
      </div>

      {/* Status */}
      <div>
        <Badge variant="outline" className={statusConfig.className}>
          {statusConfig.label}
        </Badge>
      </div>

      {/* PR */}
      <div>
        {execution.pullRequestUrl ? (
          <a
            href={execution.pullRequestUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        )}
      </div>

      {/* Iniciado */}
      <div className="text-[12px] text-muted-foreground">
        {execution.createdAt ? formatRelative(execution.createdAt) : "—"}
      </div>

      {/* Duracao */}
      <div className="text-[12px] text-muted-foreground tabular-nums">
        {execution.durationMs != null ? formatDuration(execution.durationMs) : "—"}
      </div>

      {/* Acao rapida */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 text-[11px] text-muted-foreground px-2"
          onClick={(e) => { e.stopPropagation(); onClick() }}
        >
          Ver
        </Button>
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
          className="grid grid-cols-[60px_minmax(0,1fr)_90px_120px_50px_130px_80px_60px] gap-2 border-b border-border/40 px-4 py-2.5 animate-pulse"
        >
          <div className="h-4 w-10 bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
          <div className="h-4 w-14 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-6 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-12 bg-muted rounded" />
          <div className="h-4 w-8 bg-muted rounded" />
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
        Quando execucoes forem disparadas, aparecerao aqui com detalhe de risco,
        status, PR e output do Claude Code.
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

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Cpu,
  ExternalLink,
  GitCommit,
  Loader2,
  PlayCircle,
  RotateCcw,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useProjects } from "@/lib/hooks/use-projects";
import {
  useGlobalExecutions,
  useApproveExecutionGlobal,
  useRejectExecutionGlobal,
} from "@/lib/hooks/use-automation";
import { RiskBadge } from "@/app/(app)/projects/[id]/automation/_components/risk-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Execution, ExecutionStatus } from "@/types/execution";

/**
 * Painel global de automacao (cross-projeto).
 *
 * Agrega execucoes Claude de todos os projetos do workspace:
 *  - Filtros por status (queued/running/success/failed/awaiting_approval/etc.)
 *  - Fila de aprovacao com aprovar/rejeitar inline (acoes mantidas em modal
 *    quando precisam de contexto, ex.: reject reason).
 *  - Polling 15s na fila de aprovacao, 60s nas demais.
 *
 * Reusa componentes da pagina por-projeto (RiskBadge, etc.) quando faz sentido.
 */
type FilterKey =
  | "all"
  | "awaiting_approval"
  | "running"
  | "queued"
  | "success"
  | "failed";

interface FilterTab {
  key: FilterKey;
  label: string;
  apiStatus?: string;
}

const FILTERS: FilterTab[] = [
  { key: "all", label: "Todas" },
  {
    key: "awaiting_approval",
    label: "Aprovacao",
    apiStatus: "awaiting_approval",
  },
  { key: "running", label: "Executando", apiStatus: "running" },
  { key: "queued", label: "Na fila", apiStatus: "queued" },
  { key: "success", label: "Sucesso", apiStatus: "success" },
  { key: "failed", label: "Falhas", apiStatus: "failed" },
];

const STATUS_PILL: Record<
  ExecutionStatus | "awaiting_approval",
  { label: string; bg: string; text: string; icon: typeof Clock }
> = {
  queued: {
    label: "Na fila",
    bg: "bg-zinc-700/60",
    text: "text-zinc-100",
    icon: Clock,
  },
  awaiting_approval: {
    label: "Aguarda aprovacao",
    bg: "bg-amber-600",
    text: "text-white",
    icon: ShieldAlert,
  },
  running: {
    label: "Executando",
    bg: "bg-blue-600",
    text: "text-white",
    icon: PlayCircle,
  },
  success: {
    label: "Sucesso",
    bg: "bg-emerald-600",
    text: "text-white",
    icon: CheckCircle2,
  },
  failed: {
    label: "Falhou",
    bg: "bg-rose-600",
    text: "text-white",
    icon: XCircle,
  },
  timeout: {
    label: "Timeout",
    bg: "bg-orange-600",
    text: "text-white",
    icon: AlertCircle,
  },
  rolled_back: {
    label: "Rollback",
    bg: "bg-violet-600",
    text: "text-white",
    icon: RotateCcw,
  },
};

export default function AutomationPanelPage() {
  usePageTitle("Automacao");

  const [filter, setFilter] = useState<FilterKey>("awaiting_approval");
  const activeTab = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const { data, isLoading } = useGlobalExecutions({
    status: activeTab.apiStatus,
    limit: 50,
  });
  const { data: projects } = useProjects();
  const approveMutation = useApproveExecutionGlobal();
  const rejectMutation = useRejectExecutionGlobal();

  const [rejectTarget, setRejectTarget] = useState<Execution | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Map de projeto-id -> nome para enriquecer linhas.
  const projectsById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects ?? []) map.set(p.chave, p.nome);
    return map;
  }, [projects]);

  // Contagens por status (do fetch sem filtro, se fizer sense — aqui usamos só count do filtro ativo).
  const items = data?.items ?? [];

  const handleConfirmReject = () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    rejectMutation.mutate(
      { executionId: rejectTarget.id, reason: rejectReason.trim() },
      {
        onSuccess: () => {
          setRejectTarget(null);
          setRejectReason("");
        },
      },
    );
  };

  return (
    <PageTransition>
      <div className="px-6 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <header>
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <Cpu className="h-3.5 w-3.5" />
              Automacao Claude
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Painel de execucoes
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Execucoes Claude em todos os projetos do workspace. Aprove ou
              rejeite tarefas em fila de aprovacao, monitore execucoes ativas e
              revise historico.
            </p>
          </header>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-1 border-b border-border/70">
            {FILTERS.map((f) => {
              const isActive = f.key === filter;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "border-b-2 px-3 py-2 text-[13px] font-medium transition-colors -mb-px",
                    isActive
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Lista */}
          {isLoading ? (
            <ExecutionSkeletons />
          ) : items.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <ul className="space-y-2">
              {items.map((exec) => (
                <ExecutionRow
                  key={exec.id}
                  execution={exec}
                  projectName={
                    projectsById.get(
                      (exec as Execution & { projectId?: string }).projectId ??
                        "",
                    ) ?? "Projeto"
                  }
                  projectId={
                    (exec as Execution & { projectId?: string }).projectId
                  }
                  approving={approveMutation.isPending}
                  onApprove={() => approveMutation.mutate(exec.id)}
                  onRejectClick={() => {
                    setRejectTarget(exec);
                    setRejectReason("");
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal de rejeicao */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar execucao</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeicao. Ele e visivel para quem criou a
              execucao e fica registrado no audit log.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ex.: comando muda arquivos fora do escopo do PR."
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectTarget(null)}
              disabled={rejectMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              Rejeitar
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

function ExecutionRow({
  execution,
  projectName,
  projectId,
  onApprove,
  onRejectClick,
  approving,
}: {
  execution: Execution;
  projectName: string;
  projectId?: string;
  onApprove: () => void;
  onRejectClick: () => void;
  approving: boolean;
}) {
  const statusKey =
    execution.approvalFlow === "awaiting_approval"
      ? "awaiting_approval"
      : execution.status;
  const pill = STATUS_PILL[statusKey];
  const Icon = pill?.icon ?? Clock;
  const isApproval = execution.approvalFlow === "awaiting_approval";

  return (
    <li className="rounded-lg border border-border bg-card/40 px-4 py-3 transition-colors hover:bg-card/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium">{execution.intent}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {projectId ? (
              <Link
                href={`/projects/${projectId}/automation`}
                className="hover:text-foreground transition-colors"
              >
                {projectName}
              </Link>
            ) : (
              <span>{projectName}</span>
            )}
            <span>·</span>
            <span>{formatRelative(execution.createdAt)}</span>
            {execution.durationMs != null && (
              <>
                <span>·</span>
                <span>{formatDuration(execution.durationMs)}</span>
              </>
            )}
            {execution.commitHash && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 font-mono">
                  <GitCommit className="h-3 w-3" />
                  {execution.commitHash.slice(0, 7)}
                </span>
              </>
            )}
            {execution.pullRequestUrl && (
              <>
                <span>·</span>
                <a
                  href={execution.pullRequestUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  PR
                </a>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <RiskBadge
            level={execution.riskLevel}
            explanation={execution.riskExplanation}
            size="sm"
          />
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold",
              pill?.bg,
              pill?.text,
            )}
          >
            <Icon className="h-3 w-3" />
            {pill?.label}
          </span>
        </div>
      </div>

      {execution.rejectedReason && (
        <p className="mt-2 rounded-md border border-rose-500/30 bg-rose-500/5 px-2 py-1 text-[11px] text-rose-300">
          <span className="font-medium">Rejeitada:</span>{" "}
          {execution.rejectedReason}
        </p>
      )}

      {isApproval && (
        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            onClick={onApprove}
            disabled={approving}
            className="h-7 text-[12px]"
          >
            {approving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Aprovar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRejectClick}
            disabled={approving}
            className="h-7 text-[12px]"
          >
            Rejeitar
          </Button>
        </div>
      )}
    </li>
  );
}

// ============================================================
// Helpers
// ============================================================

function ExecutionSkeletons() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-border/70 bg-card/30 px-4 py-3"
        >
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filter }: { filter: FilterKey }) {
  const texts: Record<FilterKey, string> = {
    all: "Nenhuma execucao registrada ainda.",
    awaiting_approval: "Nenhuma execucao aguardando aprovacao.",
    running: "Nenhuma execucao em andamento.",
    queued: "Nenhuma execucao na fila.",
    success: "Nenhuma execucao concluida com sucesso.",
    failed: "Nenhuma execucao com falha.",
  };
  return (
    <p className="rounded-md border border-dashed border-border/70 bg-muted/20 px-4 py-12 text-center text-[13px] text-muted-foreground">
      {texts[filter]}
    </p>
  );
}

function formatRelative(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return "—";
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "agora";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `ha ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `ha ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `ha ${diffD} d`;
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  return `${min}m ${remSec}s`;
}

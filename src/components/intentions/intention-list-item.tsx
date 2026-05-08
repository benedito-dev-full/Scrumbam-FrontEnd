"use client";

import Link from "next/link";
import type {
  IntentionDocument,
  IntentionCanal,
  IntentionType,
} from "@/types/intention";
import { IntentionPriorityBadge } from "./intention-status-badge";
import {
  Inbox,
  CheckCircle,
  Zap,
  CheckCheck,
  XCircle,
  Ban,
  Globe,
  MessageCircle,
  Mail,
  Hash,
  Code,
  GitPullRequest,
  Sparkles,
  Bug,
  TrendingUp,
  Eye,
  HelpCircle,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ============================================================
// Canal config
// ============================================================

const CANAL_CONFIG: Record<
  IntentionCanal,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  web: { label: "Web", icon: Globe, className: "text-blue-500" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, className: "text-green-500" },
  email: { label: "Email", icon: Mail, className: "text-amber-500" },
  slack: { label: "Slack", icon: Hash, className: "text-purple-500" },
  api: { label: "API", icon: Code, className: "text-cyan-500" },
};

const TYPE_CONFIG: Record<
  IntentionType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  feature:       { label: "Feature",       icon: Sparkles,    className: "text-blue-500" },
  bug:           { label: "Bug",           icon: Bug,         className: "text-red-500" },
  improvement:   { label: "Melhoria",      icon: TrendingUp,  className: "text-violet-500" },
  review:        { label: "Review",        icon: Eye,         className: "text-amber-500" },
  refactor:      { label: "Refactor",      icon: Code,        className: "text-cyan-500" },
  code:          { label: "Código",        icon: Code,        className: "text-slate-500" },
  analysis:      { label: "Análise",       icon: HelpCircle,  className: "text-orange-500" },
  documentation: { label: "Docs",          icon: HelpCircle,  className: "text-teal-500" },
  test:          { label: "Teste",         icon: CheckCheck,  className: "text-emerald-500" },
};

// ============================================================
// Time helpers
// ============================================================

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `ha ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `${days}d atras`;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function elapsedSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "< 1min";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// ============================================================
// Status icon mapping
// ============================================================

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "inbox":
      return <Inbox className="h-4 w-4 text-muted-foreground" />;
    case "ready":
      return <CheckCircle className="h-4 w-4 text-[var(--status-todo)]" />;
    case "executing":
      return <Zap className="h-4 w-4 text-[var(--ai-accent)] animate-pulse" />;
    case "done":
      return <CheckCheck className="h-4 w-4 text-[var(--status-done)]" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "cancelled":
    case "discarded":
      return <Ban className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Inbox className="h-4 w-4 text-muted-foreground" />;
  }
}

// ============================================================
// IntentionListItem V3
// ============================================================

interface Props {
  intention: IntentionDocument;
}

export function IntentionListItem({ intention }: Props) {
  const isExecuting = intention.status === "executing";
  const isDone = intention.status === "done";
  const isFailed = intention.status === "failed";
  const isTerminal =
    intention.status === "failed" ||
    intention.status === "cancelled" ||
    intention.status === "discarded";

  return (
    <Link
      href={`/projects/${intention.projectSlug}/issues/${intention.id}`}
      className={cn(
        "group flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-all hover:shadow-sm",
        isExecuting &&
          "border-l-2 border-l-[var(--ai-accent)] hover:bg-[var(--ai-accent-muted)]",
        isFailed && "border-l-2 border-l-destructive opacity-70",
        isTerminal && !isFailed && "opacity-60",
        !isExecuting && !isTerminal && "hover:bg-accent/50",
      )}
    >
      {/* Status icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <StatusIcon status={intention.status} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        {/* Título */}
        <span className="text-sm font-medium truncate leading-snug">
          {intention.title}
        </span>

        {/* Linha de badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Tipo — sempre visível */}
          <TypeBadge type={intention.type} />

          {/* 5. Canal — sempre visível */}
          <CanalBadge canal={intention.canal} />

          {/* Projeto (fora do inbox) */}
          {intention.projectSlug && intention.status !== "inbox" && (
            <Badge
              variant="outline"
              className="text-[10px] font-mono px-1.5 py-0 h-4"
            >
              {intention.projectSlug}
            </Badge>
          )}

          {/* READY: prioridade + apetite */}
          {intention.status === "ready" && (
            <>
              <IntentionPriorityBadge priority={intention.priority} />
              {intention.apetiteDias > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  ~{intention.apetiteDias}d
                </span>
              )}
            </>
          )}

          {/* DONE: PR info */}
          {isDone && intention.deliverables?.prNumber && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <GitPullRequest className="h-3 w-3" />
              PR #{intention.deliverables.prNumber}
            </span>
          )}

          {/* FAILED: motivo resumido */}
          {isFailed && intention.failureReason && (
            <span className="text-[11px] text-destructive truncate max-w-[200px]">
              {intention.failureReason}
            </span>
          )}
        </div>
      </div>

      {/* Direita — tempo */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {/* 6. EXECUTING: tempo decorrido em destaque */}
        {isExecuting && intention.executingAt && (
          <span className="flex items-center gap-1 text-[11px] font-mono text-[var(--ai-accent)] tabular-nums">
            <Zap className="h-3 w-3" />
            {elapsedSince(intention.executingAt)}
          </span>
        )}

        {/* Tempo desde última atualização */}
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {isExecuting && intention.executingAt
            ? `atualizado ${timeAgo(intention.updatedAt)}`
            : timeAgo(intention.updatedAt)}
        </span>
      </div>
    </Link>
  );
}

// ============================================================
// Canal Badge
// ============================================================

function CanalBadge({ canal }: { canal: IntentionCanal }) {
  const config = CANAL_CONFIG[canal];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-[10px] font-medium",
        config.className,
      )}
      title={`Via ${config.label}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

// ============================================================
// Type Badge
// ============================================================

function TypeBadge({ type }: { type: IntentionType }) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.feature;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-[10px] font-semibold",
        config.className,
      )}
      title={config.label}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

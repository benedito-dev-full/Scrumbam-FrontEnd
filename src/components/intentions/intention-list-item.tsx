"use client";

import Link from "next/link";
import type { IntentionDocument, IntentionCanal } from "@/types/intention";
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
  whatsapp: {
    label: "WhatsApp",
    icon: MessageCircle,
    className: "text-green-500",
  },
  email: { label: "Email", icon: Mail, className: "text-amber-500" },
  slack: { label: "Slack", icon: Hash, className: "text-purple-500" },
  api: { label: "API", icon: Code, className: "text-cyan-500" },
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
  if (mins < 1) return "agora";
  if (mins < 60) return `ha ${mins}min`;
  const hours = Math.floor(mins / 60);
  return `ha ${hours}h`;
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
      href={`/intentions/${intention.projectSlug}/${intention.id}`}
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
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {intention.title}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* INBOX: canal badge */}
          {intention.status === "inbox" && (
            <CanalBadge canal={intention.canal} />
          )}

          {/* READY/EXECUTING/DONE: projeto badge */}
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
                  {intention.apetiteDias}d
                </span>
              )}
            </>
          )}

          {/* DONE: deliverable info */}
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

          {/* Mobile: inline time info */}
          <span className="md:hidden text-[11px] text-muted-foreground tabular-nums">
            {isExecuting && intention.executingAt
              ? elapsedSince(intention.executingAt)
              : timeAgo(intention.updatedAt)}
          </span>
        </div>
      </div>

      {/* Right side -- context info (desktop: separate column, mobile: inline) */}
      <div className="hidden md:flex items-center gap-3 shrink-0">
        {/* EXECUTING: elapsed time */}
        {isExecuting && intention.executingAt && (
          <span className="text-xs text-[var(--ai-accent)] font-mono tabular-nums">
            {elapsedSince(intention.executingAt)}
          </span>
        )}

        {/* Time ago (universal) */}
        <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
          {timeAgo(intention.updatedAt)}
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
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-medium gap-1 px-1.5 py-0 h-4",
        config.className,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </Badge>
  );
}

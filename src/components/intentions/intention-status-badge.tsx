"use client";

import { Badge } from "@/components/ui/badge";
import type {
  IntentionStatus,
  IntentionType,
  IntentionPriority,
} from "@/types/intention";
import { cn } from "@/lib/utils";

// ============================================================
// Status badge V3
// ============================================================

const STATUS_CONFIG: Record<
  IntentionStatus,
  { label: string; className: string }
> = {
  inbox: {
    label: "Inbox",
    className: "bg-muted text-muted-foreground",
  },
  ready: {
    label: "Pronta",
    className: "bg-[var(--status-todo-bg)] text-[var(--status-todo)]",
  },
  executing: {
    label: "Executando",
    className:
      "bg-[var(--ai-accent-muted)] text-[var(--ai-accent)] border-[var(--ai-accent)]/20",
  },
  done: {
    label: "Concluida",
    className: "bg-[var(--status-done-bg)] text-[var(--status-done)]",
  },
  failed: {
    label: "Falhou",
    className: "bg-destructive/10 text-destructive",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-muted text-muted-foreground",
  },
  discarded: {
    label: "Descartada",
    className: "bg-muted text-muted-foreground",
  },
  validating: {
    label: "Validando",
    className: "bg-[var(--status-review-bg)] text-[var(--status-review)]",
  },
  validated: {
    label: "Validada",
    className: "bg-[var(--status-done-bg)] text-[var(--status-done)]",
  },
};

export function IntentionStatusBadge({ status }: { status: IntentionStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn("text-[11px] font-medium", config.className)}
    >
      {config.label}
    </Badge>
  );
}

// ============================================================
// Type badge
// ============================================================

const TYPE_CONFIG: Record<IntentionType, { label: string; className: string }> =
  {
    feature: {
      label: "Feature",
      className: "bg-[var(--type-feature)]/10 text-[var(--type-feature)]",
    },
    bug: {
      label: "Bug",
      className: "bg-destructive/10 text-destructive",
    },
    improvement: {
      label: "Melhoria",
      className:
        "bg-[var(--type-improvement)]/10 text-[var(--type-improvement)]",
    },
    code: {
      label: "Feature",
      className: "bg-[var(--type-feature)]/10 text-[var(--type-feature)]",
    },
    analysis: {
      label: "Analise",
      className:
        "bg-[var(--type-improvement)]/10 text-[var(--type-improvement)]",
    },
    documentation: {
      label: "Docs",
      className: "bg-[var(--status-review-bg)] text-[var(--status-review)]",
    },
    test: {
      label: "Teste",
      className: "bg-[var(--status-done-bg)] text-[var(--status-done)]",
    },
    review: {
      label: "Review",
      className: "bg-[var(--status-review-bg)] text-[var(--status-review)]",
    },
    refactor: {
      label: "Melhoria",
      className: "bg-[var(--type-tech-debt)]/10 text-[var(--type-tech-debt)]",
    },
  };

export function IntentionTypeBadge({ type }: { type: IntentionType }) {
  const config = TYPE_CONFIG[type];
  return (
    <Badge
      variant="outline"
      className={cn("text-[11px] font-medium", config.className)}
    >
      {config.label}
    </Badge>
  );
}

// ============================================================
// Priority badge
// ============================================================

const PRIORITY_CONFIG: Record<
  IntentionPriority,
  { label: string; className: string }
> = {
  urgent: {
    label: "Urgente",
    className: "bg-[var(--priority-urgent)]/10 text-[var(--priority-urgent)]",
  },
  high: {
    label: "Alta",
    className: "bg-[var(--priority-high)]/10 text-[var(--priority-high)]",
  },
  medium: {
    label: "Media",
    className: "bg-[var(--priority-medium)]/10 text-[var(--priority-medium)]",
  },
  low: {
    label: "Baixa",
    className: "bg-[var(--priority-low)]/10 text-[var(--priority-low)]",
  },
};

export function IntentionPriorityBadge({
  priority,
}: {
  priority: IntentionPriority;
}) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <Badge
      variant="outline"
      className={cn("text-[11px] font-medium", config.className)}
    >
      {config.label}
    </Badge>
  );
}

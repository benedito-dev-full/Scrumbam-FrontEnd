"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Sparkles,
  FileText,
  Inbox,
  CheckCircle,
  Zap,
  CheckCheck,
  Eye,
  ShieldCheck,
  XCircle,
  Ban,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useIntentions } from "@/lib/hooks/use-intentions";
import { IntentionFiltersBar } from "./intention-filters";
import { IntentionListItem } from "./intention-list-item";
import type { IntentionFilters } from "@/types/intention";

// V3 main sections (always visible)
const SECTIONS = [
  {
    key: "inbox",
    label: "Inbox",
    icon: Inbox,
    color: "text-muted-foreground",
  },
  {
    key: "ready",
    label: "Ready",
    icon: CheckCircle,
    color: "text-[var(--status-todo)]",
  },
  {
    key: "executing",
    label: "Executing",
    icon: Zap,
    color: "text-[var(--ai-accent)]",
  },
  {
    key: "done",
    label: "Done",
    icon: CheckCheck,
    color: "text-[var(--status-done)]",
  },
  {
    key: "validating",
    label: "Validating",
    icon: Eye,
    color: "text-amber-500",
  },
  {
    key: "validated",
    label: "Validated",
    icon: ShieldCheck,
    color: "text-green-600",
  },
] as const;

// Terminal sections (collapsible)
const TERMINAL_SECTIONS = [
  {
    key: "failed",
    label: "Failed",
    icon: XCircle,
    color: "text-destructive",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    icon: Ban,
    color: "text-muted-foreground",
  },
  {
    key: "discarded",
    label: "Discarded",
    icon: Trash2,
    color: "text-muted-foreground",
  },
] as const;

// Planning trigger threshold
const READY_THRESHOLD = 3;

interface IntentionListProps {
  projectId?: string;
}

export function IntentionList({ projectId }: IntentionListProps) {
  usePageTitle("Intencoes");
  const [filters, setFilters] = useState<IntentionFilters>(
    projectId ? { projectSlug: projectId } : {},
  );
  const [showTerminals, setShowTerminals] = useState(false);
  const { grouped, isLoading } = useIntentions(filters);

  // If filtering by a specific status, show only that section
  const isFilteringStatus = filters.status && filters.status !== "all";

  const sectionsToShow = isFilteringStatus
    ? [...SECTIONS, ...TERMINAL_SECTIONS].filter(
        (s) => s.key === filters.status,
      )
    : SECTIONS;

  const terminalSectionsToShow = isFilteringStatus ? [] : TERMINAL_SECTIONS;

  const hasAnyItems = Object.values(grouped).some((arr) => arr.length > 0);

  const terminalCount =
    (grouped["failed"]?.length ?? 0) +
    (grouped["cancelled"]?.length ?? 0) +
    (grouped["discarded"]?.length ?? 0);

  const readyCount = grouped["ready"]?.length ?? 0;

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[var(--ai-accent)]" />
            Intencoes
          </h1>
          <p className="text-sm text-muted-foreground">
            Documente suas intencoes e deixe projetos executarem
          </p>
        </div>
        <Link href="/intentions/new">
          <Button className="gap-2 bg-[var(--scrumban-brand)] hover:bg-[var(--scrumban-brand)]/90 text-white">
            <Plus className="h-4 w-4" /> Nova Intencao
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <IntentionFiltersBar filters={filters} onChange={setFilters} />

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !hasAnyItems && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <div className="rounded-full bg-[var(--ai-accent-muted)] p-4">
            <FileText className="h-10 w-10 text-[var(--ai-accent)]" />
          </div>
          <h3 className="mt-4 text-lg font-bold">
            Nenhuma intencao encontrada
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Crie sua primeira intencao para comecar a trabalhar com projetos.
          </p>
          <Link href="/intentions/new">
            <Button className="mt-6 gap-2">
              <Sparkles className="h-4 w-4" /> Criar Primeira Intencao
            </Button>
          </Link>
        </div>
      )}

      {/* Grouped sections V3 */}
      {!isLoading &&
        hasAnyItems &&
        sectionsToShow.map((section) => {
          const items = grouped[section.key] ?? [];
          if (items.length === 0 && !isFilteringStatus) return null;

          const SectionIcon = section.icon;

          return (
            <div key={section.key} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <SectionIcon className={`h-4 w-4 ${section.color}`} />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </h2>
                <span className="text-xs text-muted-foreground/60">
                  ({items.length})
                </span>

                {/* Planning Trigger inline in READY section */}
                {section.key === "ready" && (
                  <PlanningTrigger
                    readyCount={readyCount}
                    threshold={READY_THRESHOLD}
                  />
                )}
              </div>

              {items.length === 0 && isFilteringStatus && (
                <p className="text-sm text-muted-foreground px-1 py-4">
                  Nenhuma intencao com status &quot;{section.label}&quot;.
                </p>
              )}

              <div className="space-y-1.5">
                {items.map((intention) => (
                  <IntentionListItem key={intention.id} intention={intention} />
                ))}
              </div>
            </div>
          );
        })}

      {/* Terminal sections (collapsible) */}
      {!isLoading && hasAnyItems && !isFilteringStatus && terminalCount > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowTerminals(!showTerminals)}
            className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            {showTerminals ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Terminais ({terminalCount})
          </button>

          {showTerminals &&
            terminalSectionsToShow.map((section) => {
              const items = grouped[section.key] ?? [];
              if (items.length === 0) return null;

              const SectionIcon = section.icon;

              return (
                <div key={section.key} className="space-y-2 ml-4">
                  <div className="flex items-center gap-2 px-1">
                    <SectionIcon className={`h-3.5 w-3.5 ${section.color}`} />
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.label}
                    </h2>
                    <span className="text-xs text-muted-foreground/60">
                      ({items.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map((intention) => (
                      <IntentionListItem
                        key={intention.id}
                        intention={intention}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </PageTransition>
  );
}

// ============================================================
// Planning Trigger
// ============================================================

function PlanningTrigger({
  readyCount,
  threshold,
}: {
  readyCount: number;
  threshold: number;
}) {
  if (readyCount < threshold) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] font-medium gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20"
      >
        <AlertTriangle className="h-2.5 w-2.5" />
        Fila baixa!
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-[10px] font-medium bg-[var(--status-done-bg)] text-[var(--status-done)] border-[var(--status-done)]/20"
    >
      OK
    </Badge>
  );
}

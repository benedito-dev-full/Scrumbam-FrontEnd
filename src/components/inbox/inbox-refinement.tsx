"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Inbox,
  ArrowRight,
  Trash2,
  Globe,
  MessageCircle,
  Mail,
  Hash,
  Code,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import {
  useIntentions,
  useMoveToReady,
  useDiscardIntention,
} from "@/lib/hooks/use-intentions";
import { useProjects } from "@/lib/hooks/use-projects";
import type { IntentionDocument, IntentionCanal } from "@/types/intention";

// ============================================================
// Canal display config
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
// Type display config (replicado do intention-detail.tsx)
// ============================================================

const TYPE_DISPLAY: Record<string, { label: string; className: string }> = {
  feature: {
    label: "Feature",
    className:
      "bg-[var(--type-feature)]/10 text-[var(--type-feature)] border-[var(--type-feature)]/20",
  },
  bug: {
    label: "Bug",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  improvement: {
    label: "Melhoria",
    className:
      "bg-[var(--type-improvement)]/10 text-[var(--type-improvement)] border-[var(--type-improvement)]/20",
  },
  code: {
    label: "Feature",
    className:
      "bg-[var(--type-feature)]/10 text-[var(--type-feature)] border-[var(--type-feature)]/20",
  },
  analysis: {
    label: "Analise",
    className:
      "bg-[var(--ai-accent-muted)] text-[var(--ai-accent)] border-[var(--ai-accent)]/20",
  },
  documentation: {
    label: "Docs",
    className:
      "bg-[var(--status-todo-bg)] text-[var(--status-todo)] border-[var(--status-todo)]/20",
  },
  test: {
    label: "Teste",
    className:
      "bg-[var(--status-todo-bg)] text-[var(--status-todo)] border-[var(--status-todo)]/20",
  },
  review: {
    label: "Review",
    className:
      "bg-[var(--ai-accent-muted)] text-[var(--ai-accent)] border-[var(--ai-accent)]/20",
  },
  refactor: {
    label: "Refactor",
    className:
      "bg-[var(--type-improvement)]/10 text-[var(--type-improvement)] border-[var(--type-improvement)]/20",
  },
};

// ============================================================
// Relative time formatter
// ============================================================

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `ha ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `ha ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `ha ${days} dias`;
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

// ============================================================
// InboxRefinement -- lista de triagem rapida
// ============================================================

export function InboxRefinement() {
  usePageTitle("Inbox");
  const { data: inboxItems, isLoading } = useIntentions({ status: "inbox" });
  const { data: projects } = useProjects();

  // Mapa de projectId -> nome para lookup O(1)
  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    if (projects) {
      for (const p of projects) {
        map.set(p.chave, p.nome);
      }
    }
    return map;
  }, [projects]);

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Inbox className="h-6 w-6 text-muted-foreground" />
            Inbox
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revise novas intencoes e decida: promover ou descartar
          </p>
        </div>
        {inboxItems.length > 0 && (
          <Badge variant="secondary" className="text-xs shrink-0">
            {inboxItems.length}{" "}
            {inboxItems.length === 1 ? "intencao" : "intencoes"}
          </Badge>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card px-4 py-4"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex gap-2 ml-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && inboxItems.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <Inbox className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-bold">Inbox vazio</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Nenhuma intencao aguardando triagem. Novas intencoes capturadas
            aparecerao aqui automaticamente.
          </p>
        </div>
      )}

      {/* Items */}
      {!isLoading && inboxItems.length > 0 && (
        <div className="space-y-2">
          {inboxItems.map((intention) => (
            <InboxItem
              key={intention.id}
              intention={intention}
              projectName={
                intention.projectSlug
                  ? (projectMap.get(intention.projectSlug) ?? null)
                  : null
              }
            />
          ))}
        </div>
      )}
    </PageTransition>
  );
}

// ============================================================
// InboxItem -- item de triagem rapida
// ============================================================

function InboxItem({
  intention,
  projectName,
}: {
  intention: IntentionDocument;
  projectName: string | null;
}) {
  const { move } = useMoveToReady();
  const { discard } = useDiscardIntention();
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [discardReason, setDiscardReason] = useState("");
  const [isMoving, setIsMoving] = useState(false);

  const canalConfig = CANAL_CONFIG[intention.canal] ?? CANAL_CONFIG.web;
  const CanalIcon = canalConfig.icon;
  const typeConfig = TYPE_DISPLAY[intention.type] ?? TYPE_DISPLAY.feature;

  const handleMoveToReady = async () => {
    setIsMoving(true);
    move(intention.id);
    // Hook already handles toast + invalidation
    // Reset after a brief delay for UX
    setTimeout(() => setIsMoving(false), 1000);
  };

  const handleDiscard = () => {
    if (!discardReason.trim()) return;
    discard(intention.id, discardReason.trim());
    setDiscardDialogOpen(false);
    setDiscardReason("");
  };

  // Truncated description: use problema field, fallback to empty
  const description = intention.problema?.trim() || null;

  return (
    <div className="group rounded-lg border border-border bg-card transition-all hover:shadow-sm hover:border-border/80">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
        {/* Left: Info */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Title row */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/intentions/${intention.projectSlug}/${intention.id}`}
              className="text-sm font-medium truncate hover:underline hover:text-[var(--scrumban-brand)] transition-colors"
            >
              {intention.title}
            </Link>
          </div>

          {/* Description */}
          {description ? (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {description}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic">
              Sem descricao
            </p>
          )}

          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Type badge */}
            <Badge
              variant="outline"
              className={`text-[10px] font-medium px-1.5 py-0 h-4 ${typeConfig.className}`}
            >
              {typeConfig.label}
            </Badge>

            {/* Project badge */}
            {projectName && (
              <Badge
                variant="outline"
                className="text-[10px] font-mono px-1.5 py-0 h-4 text-muted-foreground"
              >
                {projectName}
              </Badge>
            )}

            {/* Canal badge */}
            <Badge
              variant="outline"
              className={`text-[10px] font-medium gap-1 px-1.5 py-0 h-4 ${canalConfig.className}`}
            >
              <CanalIcon className="h-2.5 w-2.5" />
              {canalConfig.label}
            </Badge>

            {/* Time */}
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {formatRelativeTime(intention.createdAt)}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
          {/* Ready button */}
          <Button
            size="sm"
            className="gap-1.5 bg-[var(--scrumban-brand)] hover:bg-[var(--scrumban-brand)]/90 text-white h-9 sm:h-8 text-xs min-w-[44px]"
            onClick={handleMoveToReady}
            disabled={isMoving}
          >
            <ArrowRight className="h-3.5 w-3.5" />
            {isMoving ? "Movendo..." : "Ready"}
          </Button>

          {/* Discard button */}
          <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/30 h-9 sm:h-8 text-xs min-w-[44px]"
              onClick={() => setDiscardDialogOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Descartar
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Descartar intencao</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Descartar &quot;{intention.title}&quot;? Informe o motivo:
                </p>
                <Textarea
                  value={discardReason}
                  onChange={(e) => setDiscardReason(e.target.value)}
                  placeholder="Ex: Duplicada da intencao X, fora do escopo..."
                  className="min-h-[80px]"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDiscardDialogOpen(false);
                      setDiscardReason("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDiscard}
                    disabled={!discardReason.trim()}
                  >
                    Confirmar Descarte
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

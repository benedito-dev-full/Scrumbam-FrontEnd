"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Inbox as InboxIcon,
  SlidersHorizontal,
  Settings2,
  CheckCheck,
  ExternalLink,
  Circle,
} from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import {
  useInAppNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/lib/hooks/use-in-app-notifications";
import { cn } from "@/lib/utils";
import type { InAppNotification } from "@/types";

export default function InboxPage() {
  usePageTitle("Inbox");
  // (Inbox e mantido em ingles — jargao consolidado)
  const { data: notifications, isLoading } = useInAppNotifications(50);
  const markRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = useMemo(() => notifications ?? [], [notifications]);
  const selected = useMemo(
    () => list.find((n) => n.id === selectedId) ?? null,
    [list, selectedId],
  );

  const hasUnread = list.some((n) => !n.isRead);

  const handleSelect = (n: InAppNotification) => {
    setSelectedId(n.id);
    if (!n.isRead) {
      markRead.mutate([n.id]);
    }
  };

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col md:flex-row">
        {/* Left pane — list */}
        <aside className="flex flex-col md:w-[360px] md:border-r border-border md:shrink-0 h-full">
          <header className="flex h-11 shrink-0 items-center justify-between px-6 border-b border-border">
            <h1 className="text-[13px] font-medium">Inbox</h1>
            <div className="flex items-center gap-1">
              {hasUnread && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex h-6 items-center gap-1 rounded px-1.5 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Filtros"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Opcoes de exibicao"
              >
                <Settings2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <ListSkeleton />
            ) : list.length === 0 ? (
              <ListEmpty />
            ) : (
              list.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  active={n.id === selectedId}
                  onClick={() => handleSelect(n)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Right pane — detail / empty state (desktop only) */}
        <section className="hidden md:flex flex-1 flex-col h-full">
          {selected ? (
            <NotificationDetail notification={selected} />
          ) : (
            <EmptyDetail />
          )}
        </section>
      </div>
    </PageTransition>
  );
}

// ============================================================
// Notification list item
// ============================================================

function NotificationItem({
  notification: n,
  active,
  onClick,
}: {
  notification: InAppNotification;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-2 px-6 py-3 border-b border-border/40 text-left transition-colors",
        active
          ? "bg-accent"
          : !n.isRead
            ? "bg-accent/30 hover:bg-accent/50"
            : "hover:bg-accent/40",
      )}
    >
      <Circle
        className={cn(
          "h-2 w-2 mt-1.5 shrink-0",
          n.isRead
            ? "fill-transparent text-transparent"
            : "fill-blue-500 text-blue-500",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={cn(
              "text-[13px] truncate",
              n.isRead ? "font-normal text-foreground/80" : "font-medium",
            )}
          >
            {n.title}
          </h3>
          <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
            {formatRelative(n.criadoEm)}
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5">
          {n.message}
        </p>
      </div>
    </button>
  );
}

// ============================================================
// Notification detail panel
// ============================================================

function NotificationDetail({
  notification: n,
}: {
  notification: InAppNotification;
}) {
  const linkHref = buildEntityHref(n);

  return (
    <div className="flex flex-1 flex-col h-full">
      <header className="flex h-11 shrink-0 items-center justify-between px-6 border-b border-border">
        <span className="text-[12px] text-muted-foreground tabular-nums">
          {formatFullDate(n.criadoEm)}
        </span>
        {linkHref && (
          <Link
            href={linkHref}
            className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[12px] text-foreground hover:bg-accent transition-colors"
          >
            Abrir
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </header>

      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-3xl space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">{n.title}</h2>
          <p className="text-[13px] text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {n.message}
          </p>

          {n.dados && Object.keys(n.dados).length > 0 && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-border text-[12px]">
              {n.dados.fromStatus && (
                <Pair label="De" value={n.dados.fromStatus} />
              )}
              {n.dados.toStatus && (
                <Pair label="Para" value={n.dados.toStatus} />
              )}
              {n.type && <Pair label="Tipo" value={n.type} />}
              {n.dados.intentionId && (
                <Pair label="Issue" value={`#${n.dados.intentionId}`} />
              )}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

// ============================================================
// Empty states
// ============================================================

function EmptyDetail() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <InboxIcon
        className="h-20 w-20 text-muted-foreground/30"
        strokeWidth={1.25}
      />
      <p className="mt-4 text-[13px] text-muted-foreground">Sem notificacoes</p>
      <p className="mt-1 text-[12px] text-muted-foreground/70">Hora de uma pausa?</p>
    </div>
  );
}

function ListEmpty() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 md:hidden">
      <InboxIcon
        className="h-12 w-12 text-muted-foreground/30"
        strokeWidth={1.25}
      />
      <p className="mt-3 text-[13px] text-muted-foreground">Sem notificacoes</p>
      <p className="mt-1 text-[12px] text-muted-foreground/70">Hora de uma pausa?</p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-start gap-2 px-6 py-3 border-b border-border/40 animate-pulse"
        >
          <div className="h-2 w-2 mt-1.5 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 bg-muted rounded" />
            <div className="h-3 w-full bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "agora";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w}sem`;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildEntityHref(n: InAppNotification): string | null {
  if (n.dados?.projectId && n.dados?.intentionId) {
    return `/intentions/${n.dados.projectId}/${n.dados.intentionId}`;
  }
  if (n.projectId && n.taskId) {
    return `/intentions/${n.projectId}/${n.taskId}`;
  }
  if (n.projectId) {
    return `/intentions/${n.projectId}`;
  }
  return null;
}

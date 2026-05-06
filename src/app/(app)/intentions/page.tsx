"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Settings2,
  PanelRight,
  Box,
  CircleDashed,
  CircleDotDashed,
  Circle,
  CheckCircle2,
  XCircle,
  Ban,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useIntentions } from "@/lib/hooks/use-intentions";
import { useAuth } from "@/lib/hooks/use-auth";
import { useProjects } from "@/lib/hooks/use-projects";
import { cn } from "@/lib/utils";
import type {
  IntentionDocument,
  IntentionStatus,
  IntentionPriority,
  IntentionType,
} from "@/types/intention";

// ============================================================
// Tab definitions
// ============================================================

type TabKey = "assigned" | "created" | "subscribed" | "activity";

const TABS: { key: TabKey; label: string; stub?: boolean }[] = [
  { key: "assigned", label: "Assigned" },
  { key: "created", label: "Created" },
  { key: "subscribed", label: "Subscribed", stub: true },
  { key: "activity", label: "Activity" },
];

export default function MyIssuesPage() {
  usePageTitle("My issues");
  const { user } = useAuth();
  const { data: projects } = useProjects();
  const { data: intentions, isLoading } = useIntentions({ projectSlug: "all" });
  const [activeTab, setActiveTab] = useState<TabKey>("activity");

  const userId = user?.id?.toString();

  const filtered = useMemo(() => {
    if (!intentions) return [];

    if (activeTab === "subscribed") return [];

    const list = intentions as (IntentionDocument & {
      assignee?: { chave: string; nome: string } | null;
    })[];

    let result = list;
    if (activeTab === "assigned" && userId) {
      result = list.filter((i) => i.assignee?.chave === userId);
    } else if (activeTab === "created" && userId) {
      result = list.filter((i) => i.createdBy === userId);
    }
    // activity: all (sorted below)

    return [...result].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [intentions, activeTab, userId]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const projectMap = useMemo(
    () => new Map((projects ?? []).map((p) => [p.chave, p.nome])),
    [projects],
  );

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex h-11 shrink-0 items-center px-8 border-b border-border">
          <h1 className="text-[13px] font-medium">My issues</h1>
        </header>

        {/* Tabs + filter row */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-8">
          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => !tab.stub && setActiveTab(tab.key)}
                className={cn(
                  "rounded-md px-2 py-1 text-[12px] font-medium transition-colors",
                  activeTab === tab.key
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  tab.stub && "opacity-50 cursor-not-allowed",
                )}
                disabled={tab.stub}
                title={tab.stub ? "Em breve (gap de schema)" : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Filter"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Display options"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Toggle panel"
            >
              <PanelRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === "subscribed" ? (
            <SubscribedStub />
          ) : isLoading ? (
            <SkeletonRows />
          ) : !filtered.length ? (
            <EmptyState tab={activeTab} />
          ) : (
            grouped.map((group) => (
              <DateGroup
                key={group.label}
                label={group.label}
                count={group.items.length}
                items={group.items}
                projectMap={projectMap}
              />
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
}

// ============================================================
// Date grouping
// ============================================================

interface DateGroupData {
  label: string;
  items: (IntentionDocument & {
    assignee?: { chave: string; nome: string } | null;
  })[];
}

function groupByDate(
  items: (IntentionDocument & {
    assignee?: { chave: string; nome: string } | null;
  })[],
): DateGroupData[] {
  const today = startOfDay(new Date());
  const yesterday = startOfDay(addDays(today, -1));
  const weekAgo = startOfDay(addDays(today, -7));
  const monthAgo = startOfDay(addDays(today, -30));

  const buckets: Record<string, DateGroupData["items"]> = {
    Today: [],
    Yesterday: [],
    "This week": [],
    "Last 30 days": [],
    Older: [],
  };

  for (const item of items) {
    const d = new Date(item.updatedAt);
    if (d >= today) buckets.Today.push(item);
    else if (d >= yesterday) buckets.Yesterday.push(item);
    else if (d >= weekAgo) buckets["This week"].push(item);
    else if (d >= monthAgo) buckets["Last 30 days"].push(item);
    else buckets.Older.push(item);
  }

  const order = ["Today", "Yesterday", "This week", "Last 30 days", "Older"];
  return order
    .filter((label) => buckets[label].length > 0)
    .map((label) => ({ label, items: buckets[label] }));
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

// ============================================================
// Date group component
// ============================================================

function DateGroup({
  label,
  count,
  items,
  projectMap,
}: {
  label: string;
  count: number;
  items: DateGroupData["items"];
  projectMap: Map<string, string>;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-8 py-2 text-[12px] text-muted-foreground hover:bg-accent/30 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums">{count}</span>
      </button>

      {open && items.map((item) => (
        <IssueRow
          key={item.id}
          item={item}
          projectName={projectMap.get(item.projectSlug || "") || null}
        />
      ))}
    </div>
  );
}

// ============================================================
// Issue row (Linear-style line item)
// ============================================================

function IssueRow({
  item,
  projectName,
}: {
  item: IntentionDocument & {
    assignee?: { chave: string; nome: string } | null;
  };
  projectName: string | null;
}) {
  const code = `INT-${item.id}`; // Gap #9: sem identifier sequencial real (registrado em LINEAR_PIVOT_GAPS.md)
  const createdLabel = `Created on ${formatShortDate(item.createdAt)}`;

  const assigneeInitials = item.assignee?.nome
    ? item.assignee.nome
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : null;

  const href = item.projectSlug
    ? `/intentions/${item.projectSlug}/${item.id}`
    : `/intentions`;

  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-8 py-2 hover:bg-accent/30 transition-colors text-[13px] border-b border-border/40"
    >
      <PriorityIcon priority={item.priority} />
      <span className="text-[12px] text-muted-foreground tabular-nums w-14 shrink-0">
        {code}
      </span>
      <StatusIcon status={item.status} />
      <span className="flex-1 truncate">{item.title}</span>

      <div className="flex items-center gap-2 shrink-0">
        <TypeBadge type={item.type} />
        {projectName && <ProjectBadge name={projectName} />}
        {assigneeInitials ? (
          <div
            className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white"
            title={item.assignee?.nome}
          >
            {assigneeInitials}
          </div>
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/40" />
        )}
        <span className="text-[12px] text-muted-foreground whitespace-nowrap">
          {createdLabel}
        </span>
      </div>
    </Link>
  );
}

// ============================================================
// Visual primitives
// ============================================================

function PriorityIcon({ priority }: { priority: IntentionPriority }) {
  const config: Record<
    IntentionPriority,
    { bg: string; symbol: string; title: string }
  > = {
    urgent: { bg: "bg-red-500", symbol: "!", title: "Urgent" },
    high: { bg: "bg-orange-500", symbol: "▲", title: "High" },
    medium: { bg: "bg-amber-500", symbol: "=", title: "Medium" },
    low: { bg: "bg-zinc-500", symbol: "▽", title: "Low" },
  };
  const c = config[priority] ?? config.medium;

  return (
    <div
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white",
        c.bg,
      )}
      title={c.title}
    >
      {c.symbol}
    </div>
  );
}

function StatusIcon({ status }: { status: IntentionStatus }) {
  const map: Record<
    IntentionStatus,
    { Icon: React.ComponentType<{ className?: string }>; color: string; title: string }
  > = {
    inbox: { Icon: CircleDashed, color: "text-muted-foreground", title: "Inbox" },
    ready: { Icon: Circle, color: "text-blue-400", title: "Ready" },
    validating: { Icon: CircleDotDashed, color: "text-amber-400", title: "Validating" },
    validated: { Icon: Circle, color: "text-emerald-400", title: "Validated" },
    executing: { Icon: CircleDotDashed, color: "text-amber-400", title: "Executing" },
    done: { Icon: CheckCircle2, color: "text-emerald-500", title: "Done" },
    failed: { Icon: XCircle, color: "text-red-500", title: "Failed" },
    cancelled: { Icon: Ban, color: "text-muted-foreground", title: "Cancelled" },
    discarded: { Icon: Trash2, color: "text-muted-foreground", title: "Discarded" },
  };
  const c = map[status] ?? map.inbox;
  return <c.Icon className={cn("h-3.5 w-3.5 shrink-0", c.color)} />;
}

function TypeBadge({ type }: { type: IntentionType }) {
  const colorMap: Record<IntentionType, string> = {
    feature: "bg-blue-500",
    bug: "bg-red-500",
    improvement: "bg-purple-500",
    code: "bg-cyan-500",
    analysis: "bg-amber-500",
    documentation: "bg-zinc-500",
    test: "bg-emerald-500",
    review: "bg-violet-500",
    refactor: "bg-sky-500",
  };
  const dotColor = colorMap[type] ?? "bg-zinc-500";
  const label = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-0.5 text-[11px]">
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
      <span>{label}</span>
    </div>
  );
}

function ProjectBadge({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-0.5 text-[11px]">
      <Box className="h-3 w-3 text-muted-foreground" />
      <span className="truncate max-w-[100px]">{name}</span>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ============================================================
// Stub / empty / loading states
// ============================================================

function SubscribedStub() {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <CircleDashed className="h-8 w-8 text-muted-foreground/40" />
      <h3 className="mt-3 text-sm font-medium">Subscriptions coming soon</h3>
      <p className="mt-1 text-[12px] text-muted-foreground max-w-sm">
        Você poderá se inscrever em issues para receber notificações sem ser o
        responsável. Funcionalidade em backlog (gap de schema registrado).
      </p>
    </div>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  const messages: Record<TabKey, string> = {
    assigned: "No issues assigned to you yet.",
    created: "You haven't created any issues yet.",
    subscribed: "",
    activity: "No recent activity.",
  };
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <CircleDashed className="h-8 w-8 text-muted-foreground/40" />
      <h3 className="mt-3 text-sm font-medium">Nothing here</h3>
      <p className="mt-1 text-[12px] text-muted-foreground">{messages[tab]}</p>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div>
      <div className="px-8 py-2">
        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-8 py-2 border-b border-border/40 animate-pulse"
        >
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-3 w-12 bg-muted rounded" />
          <div className="h-3.5 w-3.5 bg-muted rounded-full" />
          <div className="h-3 flex-1 bg-muted rounded" />
          <div className="h-4 w-12 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-5 w-5 bg-muted rounded-full" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Star,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Settings2,
  PanelRight,
  Lock,
  Box,
  CircleDashed,
  Circle,
  CircleDotDashed,
  CheckCircle2,
  XCircle,
  Ban,
  Trash2,
} from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useAuth } from "@/lib/hooks/use-auth";
import { useIntentions } from "@/lib/hooks/use-intentions";
import { useProjects } from "@/lib/hooks/use-projects";
import { cn } from "@/lib/utils";
import type {
  IntentionDocument,
  IntentionStatus,
  IntentionPriority,
} from "@/types/intention";

interface ViewPageProps {
  params: Promise<{ viewId: string }>;
}

type SidePanelTab = "assignees" | "labels" | "projects";

export default function ViewDetailPage({ params }: ViewPageProps) {
  const { viewId } = use(params);
  const { user } = useAuth();
  const { data: intentions, isLoading } = useIntentions({
    projectSlug: "all",
  });
  const { data: projects } = useProjects();

  // View name derivada do viewId — gap #2 (sem modelo DView)
  const viewName = useMemo(() => {
    const slugPart = viewId.split("-")[0] ?? "Visualizacao";
    return slugPart.charAt(0).toUpperCase() + slugPart.slice(1);
  }, [viewId]);

  usePageTitle(viewName);

  const [activeTab, setActiveTab] = useState<SidePanelTab>("assignees");
  const [favorited, setFavorited] = useState(false);

  const issues = (intentions ?? []) as (IntentionDocument & {
    assignee?: { chave: string; nome: string } | null;
  })[];

  const projectMap = useMemo(
    () => new Map((projects ?? []).map((p) => [p.chave, p.nome])),
    [projects],
  );

  // Group issues by status
  const grouped = useMemo(() => groupByStatus(issues), [issues]);

  // Side panel breakdowns
  const assigneeBreakdown = useMemo(
    () => breakdownByAssignee(issues),
    [issues],
  );
  const projectBreakdown = useMemo(
    () => breakdownByProject(issues, projectMap),
    [issues, projectMap],
  );

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        {/* Top bar */}
        <header className="flex h-11 shrink-0 items-center justify-between px-8 border-b border-border">
          <nav className="flex items-center gap-2 text-[13px] min-w-0">
            <Layers className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="font-medium truncate">{viewName}</span>
            <button
              type="button"
              onClick={() => setFavorited((v) => !v)}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
              title="Favoritar (gap #15)"
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  favorited && "fill-amber-400 text-amber-400",
                )}
              />
            </button>
            <button
              type="button"
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Mais"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </nav>
        </header>

        {/* Sub-header (issue count + filter icons) */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-8">
          <span className="text-[12px] text-muted-foreground">
            {issues.length} {issues.length === 1 ? "issue" : "issues"}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Filtrar"
              title="Gap #2 — filtros estruturados"
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
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Alternar painel"
            >
              <PanelRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Issues list */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <SkeletonList />
            ) : grouped.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <p className="text-[13px] text-muted-foreground">
                  Nenhuma issue corresponde a esta visualizacao.
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">
                  Filtros estruturados pendentes (gap #2) — esta visualizacao
                  lista todas as issues sem aplicar criterios.
                </p>
              </div>
            ) : (
              grouped.map((g) => (
                <StatusGroup
                  key={g.status}
                  status={g.status}
                  items={g.items}
                  projectMap={projectMap}
                />
              ))
            )}
          </div>

          {/* Side panel */}
          <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-l border-border overflow-auto">
            <ViewMetaPanel
              viewName={viewName}
              ownerName={user?.nome ?? "—"}
              favorited={favorited}
            />
            <div className="border-b border-border px-2 py-2">
              <div className="flex gap-1">
                <TabButton
                  active={activeTab === "assignees"}
                  onClick={() => setActiveTab("assignees")}
                  count={assigneeBreakdown.length}
                >
                  Responsaveis
                </TabButton>
                <TabButton
                  active={activeTab === "labels"}
                  onClick={() => setActiveTab("labels")}
                  count={0}
                  stub
                  title="Gap #14 — Etiquetas"
                >
                  Etiquetas
                </TabButton>
                <TabButton
                  active={activeTab === "projects"}
                  onClick={() => setActiveTab("projects")}
                  count={projectBreakdown.length}
                >
                  Projetos
                </TabButton>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {activeTab === "assignees" && (
                <BreakdownList
                  rows={assigneeBreakdown}
                  emptyLabel="Sem responsaveis"
                />
              )}
              {activeTab === "labels" && (
                <p className="px-4 py-6 text-center text-[12px] text-muted-foreground/70">
                  Sem etiquetas (gap #14).
                </p>
              )}
              {activeTab === "projects" && (
                <BreakdownList
                  rows={projectBreakdown}
                  emptyLabel="Sem projetos"
                />
              )}
            </div>
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}

// ============================================================
// Status grouping
// ============================================================

const STATUS_ORDER: IntentionStatus[] = [
  "executing",
  "ready",
  "validating",
  "validated",
  "inbox",
  "done",
  "failed",
  "cancelled",
  "discarded",
];

const STATUS_LABEL: Record<IntentionStatus, string> = {
  inbox: "Backlog",
  ready: "Pronta",
  validating: "Validando",
  validated: "Validada",
  executing: "Em andamento",
  done: "Concluida",
  failed: "Falhou",
  cancelled: "Cancelada",
  discarded: "Descartada",
};

function groupByStatus(
  items: (IntentionDocument & {
    assignee?: { chave: string; nome: string } | null;
  })[],
) {
  const buckets: Record<string, typeof items> = {};
  items.forEach((it) => {
    if (!buckets[it.status]) buckets[it.status] = [];
    buckets[it.status].push(it);
  });
  return STATUS_ORDER.filter((s) => buckets[s]?.length).map((s) => ({
    status: s,
    items: buckets[s],
  }));
}

function StatusGroup({
  status,
  items,
  projectMap,
}: {
  status: IntentionStatus;
  items: (IntentionDocument & {
    assignee?: { chave: string; nome: string } | null;
  })[];
  projectMap: Map<string, string>;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-8 py-2 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-2 text-[12px]">
          {open ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <StatusIcon status={status} />
          <span className="font-medium">{STATUS_LABEL[status]}</span>
          <span className="tabular-nums text-muted-foreground">
            {items.length}
          </span>
        </div>
      </button>
      {open &&
        items.map((it) => (
          <IssueRow key={it.id} item={it} projectMap={projectMap} />
        ))}
    </div>
  );
}

function IssueRow({
  item: it,
  projectMap,
}: {
  item: IntentionDocument & {
    assignee?: { chave: string; nome: string } | null;
  };
  projectMap: Map<string, string>;
}) {
  const code = `INT-${it.id}`;
  const projectName = it.projectSlug
    ? (projectMap.get(it.projectSlug) ?? null)
    : null;

  const assigneeInitials = it.assignee?.nome
    ? it.assignee.nome
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : null;

  const date = new Date(it.updatedAt).toLocaleDateString("pt-BR", {
    month: "short",
    day: "numeric",
  });

  const href = it.projectSlug
    ? `/projects/${it.projectSlug}/issues/${it.id}`
    : "#";

  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-8 py-2 text-[13px] hover:bg-accent/30 transition-colors border-b border-border/40"
    >
      <PriorityIcon priority={it.priority} />
      <span className="text-[12px] text-muted-foreground tabular-nums w-14 shrink-0">
        {code}
      </span>
      <StatusIcon status={it.status} />
      <span className="flex-1 truncate">{it.title}</span>
      <div className="flex items-center gap-2 shrink-0">
        <TypeBadge type={it.type} />
        {projectName && <ProjectBadge name={projectName} />}
        {assigneeInitials ? (
          <div
            className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-medium text-white"
            title={it.assignee?.nome}
          >
            {assigneeInitials}
          </div>
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/40" />
        )}
        <span className="text-[12px] text-muted-foreground whitespace-nowrap">
          {date}
        </span>
      </div>
    </Link>
  );
}

// ============================================================
// Side panel
// ============================================================

function ViewMetaPanel({
  viewName,
  ownerName,
  favorited,
}: {
  viewName: string;
  ownerName: string;
  favorited: boolean;
}) {
  const ownerInitials = ownerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="border-b border-border px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
          <span className="text-[13px] font-medium truncate">{viewName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            aria-label="Favoritar"
            title="Gap #15"
          >
            <Star
              className={cn(
                "h-3 w-3",
                favorited && "fill-amber-400 text-amber-400",
              )}
            />
          </button>
          <button
            type="button"
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            aria-label="Mais"
          >
            <MoreHorizontal className="h-3 w-3" />
          </button>
        </div>
      </div>
      <dl className="space-y-2 text-[12px]">
        <div
          className="flex items-center gap-2"
          title="Gap #2 — visibility no schema"
        >
          <dt className="w-16 shrink-0 text-muted-foreground">Visibilidade</dt>
          <dd className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-muted-foreground" />
            Pessoal
          </dd>
        </div>
        <div
          className="flex items-center gap-2"
          title="Gap #2 — owner no schema"
        >
          <dt className="w-16 shrink-0 text-muted-foreground">Dono</dt>
          <dd className="flex items-center gap-1.5 truncate">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-medium text-white">
              {ownerInitials}
            </div>
            <span className="truncate">{ownerName}</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}

function TabButton({
  children,
  active,
  count,
  onClick,
  stub,
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  count: number;
  onClick: () => void;
  stub?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={stub}
      title={title}
      className={cn(
        "flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent/50",
        stub && "opacity-50 cursor-not-allowed",
      )}
    >
      {children}
      {count > 0 && (
        <span className="ml-1 tabular-nums text-muted-foreground">{count}</span>
      )}
    </button>
  );
}

interface BreakdownRow {
  key: string;
  name: string;
  count: number;
  initials?: string;
  Icon?: React.ComponentType<{ className?: string }>;
}

function BreakdownList({
  rows,
  emptyLabel,
}: {
  rows: BreakdownRow[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-[12px] text-muted-foreground/70">
        {emptyLabel}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border/40">
      {rows.map((row) => (
        <li
          key={row.key}
          className="flex items-center gap-2 px-4 py-2 hover:bg-accent/30 transition-colors"
        >
          {row.Icon ? (
            <row.Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : row.initials ? (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-medium text-white">
              {row.initials}
            </div>
          ) : (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/40" />
          )}
          <span className="flex-1 truncate text-[12px]">{row.name}</span>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {row.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

function breakdownByAssignee(
  items: (IntentionDocument & {
    assignee?: { chave: string; nome: string } | null;
  })[],
): BreakdownRow[] {
  const map = new Map<string, BreakdownRow>();
  items.forEach((it) => {
    const key = it.assignee?.chave ?? "no-assignee";
    const name = it.assignee?.nome ?? "Sem responsavel";
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        key,
        name,
        count: 1,
        initials: it.assignee?.nome
          ? it.assignee.nome
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
          : undefined,
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function breakdownByProject(
  items: IntentionDocument[],
  projectMap: Map<string, string>,
): BreakdownRow[] {
  const map = new Map<string, BreakdownRow>();
  items.forEach((it) => {
    const key = it.projectSlug ?? "no-project";
    const name = it.projectSlug
      ? (projectMap.get(it.projectSlug) ?? `Projeto ${it.projectSlug}`)
      : "Sem projeto";
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { key, name, count: 1, Icon: Box });
    }
  });
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

// ============================================================
// Visual primitives (duplicated from /intentions for now)
// ============================================================

function StatusIcon({ status }: { status: IntentionStatus }) {
  const map: Record<
    IntentionStatus,
    { Icon: React.ComponentType<{ className?: string }>; color: string }
  > = {
    inbox: { Icon: CircleDashed, color: "text-muted-foreground" },
    ready: { Icon: Circle, color: "text-blue-400" },
    validating: { Icon: CircleDotDashed, color: "text-amber-400" },
    validated: { Icon: Circle, color: "text-emerald-400" },
    executing: { Icon: CircleDotDashed, color: "text-amber-400" },
    done: { Icon: CheckCircle2, color: "text-emerald-500" },
    failed: { Icon: XCircle, color: "text-red-500" },
    cancelled: { Icon: Ban, color: "text-muted-foreground" },
    discarded: { Icon: Trash2, color: "text-muted-foreground" },
  };
  const c = map[status] ?? map.inbox;
  return <c.Icon className={cn("h-3.5 w-3.5 shrink-0", c.color)} />;
}

function PriorityIcon({ priority }: { priority: IntentionPriority }) {
  const config: Record<IntentionPriority, { bg: string; symbol: string }> = {
    urgent: { bg: "bg-red-500", symbol: "!" },
    high: { bg: "bg-orange-500", symbol: "▲" },
    medium: { bg: "bg-amber-500", symbol: "=" },
    low: { bg: "bg-zinc-500", symbol: "▽" },
  };
  const c = config[priority] ?? config.medium;
  return (
    <div
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white",
        c.bg,
      )}
    >
      {c.symbol}
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
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

function SkeletonList() {
  return (
    <div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-8 py-2 border-b border-border/40 animate-pulse"
        >
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-3 w-12 bg-muted rounded" />
          <div className="h-3.5 w-3.5 bg-muted rounded-full" />
          <div className="h-3 flex-1 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

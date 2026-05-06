"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus,
  SlidersHorizontal,
  Layers,
  Info,
  ChevronDown,
  Trash2,
} from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useLocalViews,
  type LocalView,
  type LocalViewScope,
} from "@/lib/hooks/use-local-views";
import { cn } from "@/lib/utils";

type ViewType = "issues" | "projects";

const TABS: { key: ViewType; label: string; href: string }[] = [
  { key: "issues", label: "Issues", href: "/views/issues" },
  { key: "projects", label: "Projetos", href: "/views/projects" },
];

interface ViewsListProps {
  type: ViewType;
}

export function ViewsList({ type }: ViewsListProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { views, removeView } = useLocalViews(type);

  const ownerInitials = (user?.nome ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const personalViews = views.filter((v) => v.scope === "personal");
  const workspaceViews = views.filter((v) => v.scope === "workspace");

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex h-11 shrink-0 items-center justify-between px-8 border-b border-border">
          <h1 className="text-[13px] font-medium">Visualizacoes</h1>
          <Link
            href={`/views/${type}/new`}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Nova visualizacao"
            title="Nova visualizacao"
          >
            <Plus className="h-3.5 w-3.5" />
          </Link>
        </header>

        {/* Tabs row */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-8">
          <div className="flex items-center gap-1">
            {TABS.map((tab) => {
              const active = pathname === tab.href || tab.key === type;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={cn(
                    "rounded-md px-2 py-1 text-[12px] font-medium transition-colors",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Opcoes de exibicao"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {/* Gap notice */}
          <div className="px-8 pt-4">
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200 dark:text-amber-300">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <p>
                Gap #2 — visualizacoes salvas em <code>localStorage</code> ate
                backend ter <code>DView</code>. Compartilhamento entre devices
                e usuarios ainda nao funciona.
              </p>
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[minmax(0,1fr)_180px_28px] items-center gap-3 border-b border-border px-8 py-2 mt-4 text-[11px] font-medium text-muted-foreground">
            <div className="flex items-center gap-1">
              Nome
              <ChevronDown className="h-3 w-3" />
            </div>
            <div>Responsavel</div>
            <div></div>
          </div>

          {/* Personal views group */}
          <PersonalGroup
            ownerInitials={ownerInitials}
            ownerName={user?.nome}
            views={personalViews}
            type={type}
            onRemove={removeView}
          />

          {/* Workspace views group */}
          <WorkspaceGroup
            views={workspaceViews}
            type={type}
            onRemove={removeView}
          />
        </div>
      </div>
    </PageTransition>
  );
}

// ============================================================
// Group sections
// ============================================================

function PersonalGroup({
  ownerInitials,
  ownerName,
  views,
  type,
  onRemove,
}: {
  ownerInitials: string;
  ownerName: string | undefined;
  views: LocalView[];
  type: ViewType;
  onRemove: (id: string) => void;
}) {
  return (
    <>
      <GroupHeader
        title="Visualizacoes pessoais"
        subtitle={`Visivel apenas para ${ownerName ?? "voce"}`}
        icon={
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-medium text-white">
            {ownerInitials}
          </div>
        }
        addHref={`/views/${type}/new`}
      />
      {views.length === 0 ? (
        <EmptyRow message="Sem visualizacoes pessoais ainda" />
      ) : (
        views.map((v) => (
          <ViewRow
            key={v.id}
            view={v}
            type={type}
            scopeLabel="Pessoal"
            onRemove={onRemove}
          />
        ))
      )}
    </>
  );
}

function WorkspaceGroup({
  views,
  type,
  onRemove,
}: {
  views: LocalView[];
  type: ViewType;
  onRemove: (id: string) => void;
}) {
  return (
    <>
      <GroupHeader
        title="Visualizacoes do workspace"
        subtitle="Compartilhadas com a organizacao"
        icon={<Layers className="h-3.5 w-3.5 text-cyan-400" />}
        addHref={`/views/${type}/new`}
        addParams={{ scope: "workspace" } as Record<string, LocalViewScope>}
      />
      {views.length === 0 ? (
        <EmptyRow message="Sem visualizacoes do workspace ainda" />
      ) : (
        views.map((v) => (
          <ViewRow
            key={v.id}
            view={v}
            type={type}
            scopeLabel="Workspace"
            onRemove={onRemove}
          />
        ))
      )}
    </>
  );
}

// ============================================================
// Sub-components
// ============================================================

function GroupHeader({
  title,
  subtitle,
  icon,
  addHref,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  addHref: string;
  addParams?: Record<string, LocalViewScope>;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-8 py-2 bg-card/40 border-b border-border/40 mt-2 first:mt-0">
      <div className="flex items-center gap-2 text-[12px]">
        {icon}
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground">· {subtitle}</span>
      </div>
      <Link
        href={addHref}
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <Plus className="h-3 w-3" />
      </Link>
    </div>
  );
}

function ViewRow({
  view,
  type,
  scopeLabel,
  onRemove,
}: {
  view: LocalView;
  type: ViewType;
  scopeLabel: string;
  onRemove: (id: string) => void;
}) {
  const ownerInitials = view.ownerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_180px_28px] items-center gap-3 border-b border-border/40 px-8 py-2 text-[13px] hover:bg-accent/30 transition-colors group">
      <Link
        href={`/views/${view.id}`}
        className="flex items-center gap-2 min-w-0"
      >
        <Layers className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
        <span className="truncate font-medium">{view.name}</span>
        {view.description && (
          <span className="truncate text-[11px] text-muted-foreground">
            — {view.description}
          </span>
        )}
      </Link>
      <div className="flex items-center gap-1.5 text-[12px]">
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-medium text-white">
          {ownerInitials}
        </div>
        <span className="truncate">{view.ownerName}</span>
        <span className="text-[10px] text-muted-foreground/70">·</span>
        <span className="text-[10px] text-muted-foreground/70 truncate">
          {scopeLabel}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onRemove(view.id)}
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
        aria-label="Remover visualizacao"
        title="Remover (apenas local)"
      >
        <Trash2 className="h-3 w-3" />
      </button>
      {/* Suppress unused warning when type prop has same shape across rows */}
      <span className="hidden">{type}</span>
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_180px_28px] items-center gap-3 border-b border-border/40 px-8 py-4 text-[12px]">
      <div className="text-muted-foreground/70">{message}</div>
      <div></div>
      <div></div>
    </div>
  );
}

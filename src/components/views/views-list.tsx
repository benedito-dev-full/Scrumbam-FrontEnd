"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus,
  SlidersHorizontal,
  Layers,
  Info,
  ChevronDown,
} from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { useAuth } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";

type ViewType = "issues" | "projects";

const TABS: { key: ViewType; label: string; href: string }[] = [
  { key: "issues", label: "Issues", href: "/views/issues" },
  { key: "projects", label: "Projects", href: "/views/projects" },
];

interface ViewsListProps {
  /** Tipo de view exibido (define qual tab esta ativa) */
  type: ViewType;
}

export function ViewsList({ type }: ViewsListProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const ownerInitials = (user?.nome ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex h-11 shrink-0 items-center justify-between px-8 border-b border-border">
          <h1 className="text-[13px] font-medium">Views</h1>
          <button
            type="button"
            disabled
            title="Gap #2 — sem modelo DView"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 cursor-not-allowed"
            aria-label="Criar view"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
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
            aria-label="Display options"
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
                Gap #2 — sem modelo <code>DView</code>. Para criar views
                {type === "issues" ? " de issues" : " de projects"} salvas,
                precisamos adicionar tabela com filters estruturados, scope
                (Personal/Workspace/Team) e owner.
              </p>
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[minmax(0,1fr)_180px] items-center gap-3 border-b border-border px-8 py-2 mt-4 text-[11px] font-medium text-muted-foreground">
            <div className="flex items-center gap-1">
              Name
              <ChevronDown className="h-3 w-3" />
            </div>
            <div>Owner</div>
          </div>

          {/* Personal views group */}
          <PersonalGroup ownerInitials={ownerInitials} ownerName={user?.nome} />

          {/* Workspace views group */}
          <WorkspaceGroup />
        </div>
      </div>
    </PageTransition>
  );
}

// ============================================================
// Group sections (empty states explaining the gap)
// ============================================================

function PersonalGroup({
  ownerInitials,
  ownerName,
}: {
  ownerInitials: string;
  ownerName: string | undefined;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 px-8 py-2 bg-card/40 border-b border-border/40">
        <div className="flex items-center gap-2 text-[12px]">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-medium text-white">
            {ownerInitials}
          </div>
          <span className="font-medium">Personal views</span>
          <span className="text-muted-foreground">
            · Only visible to {ownerName ?? "you"}
          </span>
        </div>
        <button
          type="button"
          disabled
          title="Gap #2"
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 cursor-not-allowed"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <EmptyRow
        message="Sem personal views ainda"
        hint="Salve filtros recorrentes aqui"
      />
    </>
  );
}

function WorkspaceGroup() {
  return (
    <>
      <div className="flex items-center justify-between gap-2 px-8 py-2 bg-card/40 border-b border-border/40 mt-2">
        <div className="flex items-center gap-2 text-[12px]">
          <Layers className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-medium">Workspace views</span>
          <span className="text-muted-foreground">
            · Compartilhadas com a organizacao
          </span>
        </div>
        <button
          type="button"
          disabled
          title="Gap #2"
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 cursor-not-allowed"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <EmptyRow
        message="Sem workspace views ainda"
        hint="Compartilhe filtros padrao para o time inteiro"
      />
    </>
  );
}

function EmptyRow({
  message,
  hint,
}: {
  message: string;
  hint: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_180px] items-center gap-3 border-b border-border/40 px-8 py-6 text-[12px]">
      <div className="text-muted-foreground/70">
        <p>{message}</p>
        <p className="text-[11px] mt-0.5">{hint}</p>
      </div>
      <div></div>
    </div>
  );
}

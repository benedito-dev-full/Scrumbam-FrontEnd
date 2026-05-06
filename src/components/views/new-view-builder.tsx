"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Lock,
  Globe,
  ChevronRight,
  SlidersHorizontal,
  Settings2,
  Link2,
  CircleDashed,
  CheckCircle2,
  Circle,
  CircleDotDashed,
  XCircle,
  Ban,
  Trash2,
  Box,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useAuth } from "@/lib/hooks/use-auth";
import { useIntentions } from "@/lib/hooks/use-intentions";
import { useProjects } from "@/lib/hooks/use-projects";
import { useLocalViews, type LocalViewType, type LocalViewScope } from "@/lib/hooks/use-local-views";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IntentionDocument, IntentionStatus } from "@/types/intention";

interface NewViewBuilderProps {
  type: LocalViewType;
}

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

export function NewViewBuilder({ type }: NewViewBuilderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addView } = useLocalViews();

  usePageTitle(
    type === "issues"
      ? "Nova visualizacao de issues"
      : "Nova visualizacao de projetos",
  );

  const [name, setName] = useState(
    type === "issues" ? "Todas as issues" : "Todos os projetos",
  );
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<LocalViewScope>("personal");
  const [saving, setSaving] = useState(false);

  // Preview data (sem filtros aplicados ate gap #2 ser resolvido)
  const { data: intentions } = useIntentions(
    type === "issues" ? { projectSlug: "all" } : undefined,
  );
  const { data: projects } = useProjects();

  const issuesList = (intentions ?? []) as (IntentionDocument & {
    assignee?: { chave: string; nome: string } | null;
  })[];

  const grouped = useMemo(
    () => groupByStatus(issuesList),
    [issuesList],
  );

  const handleCancel = () => {
    router.push(`/views/${type}`);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Digite um nome para a visualizacao");
      return;
    }
    setSaving(true);
    try {
      addView({
        type,
        scope,
        name: name.trim(),
        description: description.trim(),
        ownerName: user?.nome ?? "Usuario",
        filters: {}, // futuro DView.filters
      });
      toast.success("Visualizacao criada (local)");
      router.push(`/views/${type}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        {/* Top breadcrumb bar */}
        <header className="flex h-11 shrink-0 items-center justify-between px-8 border-b border-border">
          <nav className="flex items-center gap-1.5 text-[13px]">
            <Link
              href={`/views/${type}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Visualizacoes
            </Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <span className="font-medium truncate max-w-[280px]">
              {name || "Sem titulo"}
            </span>
          </nav>
          <button
            type="button"
            disabled
            title="Copiar link (em breve)"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 cursor-not-allowed"
            aria-label="Copiar link"
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Composer card (Linear: tudo num bloco cinza unico) */}
        <div className="px-6 pt-5 pb-4">
          <div
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: "oklch(0.215 0 0)" }}
          >
            {/* Composer block — tudo num unico bg sem dividers internos */}
            <div className="grid grid-cols-[28px_1fr_auto] items-start gap-x-3 gap-y-1 px-4 py-3.5">
              {/* Icon (alinhado com o name) */}
              <div className="row-start-1 col-start-1 flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
              </div>

              {/* Name input — raw HTML pra evitar bg-input/30 do shadcn */}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da visualizacao"
                autoFocus
                className="row-start-1 col-start-2 h-7 w-full bg-transparent text-[15px] font-medium text-foreground outline-none border-0 placeholder:text-muted-foreground/50"
              />

              {/* Save controls (rowspan-1, col-3) */}
              <div className="row-start-1 col-start-3 flex items-center gap-2 shrink-0 h-7">
                <span className="text-[12px] text-muted-foreground">
                  Salvar em
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-md bg-background/60 px-2 py-1 text-[12px] hover:bg-background transition-colors"
                    >
                      {scope === "personal" ? (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Globe className="h-3 w-3 text-cyan-400" />
                      )}
                      {scope === "personal" ? "Pessoal" : "Workspace"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-44 p-1">
                    <button
                      type="button"
                      onClick={() => setScope("personal")}
                      className={cn(
                        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-accent transition-colors",
                        scope === "personal" && "bg-accent",
                      )}
                    >
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      Pessoal
                    </button>
                    <button
                      type="button"
                      onClick={() => setScope("workspace")}
                      className={cn(
                        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-accent transition-colors",
                        scope === "workspace" && "bg-accent",
                      )}
                    >
                      <Globe className="h-3.5 w-3.5 text-cyan-400" />
                      Workspace
                    </button>
                  </PopoverContent>
                </Popover>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                    saving || !name.trim()
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-foreground text-background hover:opacity-90",
                  )}
                >
                  Salvar
                </button>
              </div>

              {/* Description — raw HTML; col 2, abaixo do name, mesmo bg */}
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descricao (opcional)"
                className="row-start-2 col-start-2 col-span-2 h-6 w-full bg-transparent text-[12px] text-foreground outline-none border-0 placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Tabs row — UNICO divider no card todo, antes das tabs */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border/40">
              <div className="flex items-center gap-1">
                <Link
                  href="/views/issues/new"
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors",
                    type === "issues"
                      ? "bg-background text-foreground"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                  )}
                >
                  Issues
                </Link>
                <Link
                  href="/views/projects/new"
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors",
                    type === "projects"
                      ? "bg-background text-foreground"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                  )}
                >
                  Projects
                </Link>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled
                  title="Filtros estruturados — gap #2"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-background/40 text-muted-foreground/60 cursor-not-allowed"
                  aria-label="Filter"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled
                  title="Display options — em breve"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-background/40 text-muted-foreground/60 cursor-not-allowed"
                  aria-label="Display"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Gap notice (fora do card, discreto) */}
          <div className="mt-3 flex items-start gap-2 px-1 text-[11px] text-amber-200/70">
            <Info className="h-3 w-3 shrink-0 mt-0.5" />
            <p>
              Gap #2 — sem modelo <code>DView</code>. View sera salva em
              localStorage. Filtros estruturados ainda nao aplicados ao preview
              abaixo.
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto">
          {type === "issues" ? (
            grouped.length === 0 ? (
              <EmptyPreview type="issues" />
            ) : (
              grouped.map((g) => (
                <StatusGroup
                  key={g.status}
                  status={g.status}
                  items={g.items}
                />
              ))
            )
          ) : (projects ?? []).length === 0 ? (
            <EmptyPreview type="projects" />
          ) : (
            <div>
              <div className="grid grid-cols-[minmax(0,1fr)_120px_120px] items-center gap-3 border-b border-border px-8 py-2 text-[11px] font-medium text-muted-foreground">
                <div>Name</div>
                <div>Status</div>
                <div>Created</div>
              </div>
              {(projects ?? []).map((p) => (
                <div
                  key={p.chave}
                  className="grid grid-cols-[minmax(0,1fr)_120px_120px] items-center gap-3 border-b border-border/40 px-8 py-2 text-[13px]"
                >
                  <div className="flex items-center gap-2">
                    <Box className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{p.nome}</span>
                  </div>
                  <span className="text-[12px] text-muted-foreground">
                    {(p as { status?: string }).status ?? "active"}
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    {p.criadoEm
                      ? new Date(p.criadoEm).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

// ============================================================
// Status grouping for issues preview
// ============================================================

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
}: {
  status: IntentionStatus;
  items: (IntentionDocument & {
    assignee?: { chave: string; nome: string } | null;
  })[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 px-8 py-2 bg-card/40 border-b border-border/40 text-[12px]">
        <StatusIcon status={status} />
        <span className="font-medium">{STATUS_LABEL[status]}</span>
        <span className="tabular-nums text-muted-foreground">
          {items.length}
        </span>
      </div>
      {items.map((it) => (
        <div
          key={it.id}
          className="flex items-center gap-2 px-8 py-2 text-[13px] border-b border-border/40"
        >
          <span className="text-[12px] text-muted-foreground tabular-nums w-14 shrink-0">
            INT-{it.id}
          </span>
          <StatusIcon status={it.status} />
          <span className="flex-1 truncate">{it.title}</span>
        </div>
      ))}
    </div>
  );
}

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

function EmptyPreview({ type }: { type: LocalViewType }) {
  return (
    <div className="px-8 py-16 text-center">
      <p className="text-[13px] text-muted-foreground">
        Sem {type === "issues" ? "issues" : "projects"} para preview.
      </p>
    </div>
  );
}

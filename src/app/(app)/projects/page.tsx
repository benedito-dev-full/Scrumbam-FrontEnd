"use client";

import {
  Plus,
  MoreHorizontal,
  Cpu,
  Pencil,
  Trash2,
  CheckSquare,
  Calendar,
  FolderOpen,
  Search,
  LayoutGrid,
  Rows3,
  Activity,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useProjects, useProjectSummaries } from "@/lib/hooks/use-projects";
import { NewProjectModal } from "@/components/projects/new-project-modal";
import { EditProjectModal } from "@/components/projects/edit-project-modal";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";
import type { Project, ProjectSummary } from "@/types";

type SortKey = "name-asc" | "name-desc" | "recent" | "tasks-desc";
type ViewMode = "grid" | "list";

function formatRelative(timestamp?: string | null): string {
  if (!timestamp) return "—";
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return "—";
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 60) return "agora";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} d`;
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

// Paleta de cores para ícone do projeto (baseada na inicial)
const PROJECT_COLORS = [
  { bg: "bg-blue-500", text: "text-white" },
  { bg: "bg-violet-500", text: "text-white" },
  { bg: "bg-emerald-500", text: "text-white" },
  { bg: "bg-amber-500", text: "text-white" },
  { bg: "bg-rose-500", text: "text-white" },
  { bg: "bg-cyan-500", text: "text-white" },
];

// Hash simples (djb2 light) do nome completo para distribuir cores.
// Evita que projetos comecando com a mesma letra (ex: Scrumban-Backend,
// Scrumban-Frontend) recebam a mesma cor.
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return h >>> 0;
}

function getProjectColor(nome: string) {
  const idx = hashString(nome) % PROJECT_COLORS.length;
  return PROJECT_COLORS[idx];
}

// Paleta de cores para avatar de responsável
const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
];

function getAvatarColor(nome: string) {
  const idx = hashString(nome) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// Status badge
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: {
    label: "Ativo",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  archived: {
    label: "Arquivado",
    className: "bg-muted text-muted-foreground",
  },
  completed: {
    label: "Concluído",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
};

function formatTargetDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

export default function ProjectsPage() {
  usePageTitle("Projetos");
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const orgId = useAuthStore((s) => s.user?.orgId);
  const { data: summaries } = useProjectSummaries(orgId ?? undefined);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<{
    chave: string;
    nome: string;
  } | null>(null);
  const userRole = useAuthStore((s) => s.user?.role);
  const isAdmin = userRole?.toUpperCase() === "ADMIN";

  // Controles do header — busca, ordenacao, view.
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [view, setView] = useState<ViewMode>("grid");

  // Indexa summaries por projectId para enriquecer cards sem N+1.
  const summaryById = useMemo(() => {
    const m = new Map<string, ProjectSummary>();
    for (const s of summaries ?? []) m.set(s.projectId, s);
    return m;
  }, [summaries]);

  // Pipeline: filtra por busca, ordena.
  const visibleProjects = useMemo(() => {
    const list = [...(projects ?? [])];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? list.filter(
          (p) =>
            p.nome.toLowerCase().includes(q) ||
            (p.descricao ?? "").toLowerCase().includes(q),
        )
      : list;

    return filtered.sort((a, b) => {
      switch (sort) {
        case "name-asc":
          return a.nome.localeCompare(b.nome);
        case "name-desc":
          return b.nome.localeCompare(a.nome);
        case "tasks-desc":
          return (b.taskCount ?? 0) - (a.taskCount ?? 0);
        case "recent":
        default: {
          const ta = summaryById.get(a.chave)?.lastActivity?.timestamp ?? "";
          const tb = summaryById.get(b.chave)?.lastActivity?.timestamp ?? "";
          return tb.localeCompare(ta);
        }
      }
    });
  }, [projects, search, sort, summaryById]);

  const totalCount = projects?.length ?? 0;
  const visibleCount = visibleProjects.length;

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        {/* Page header */}
        <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border px-4 sm:px-8">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-[13px] font-medium">Projetos</h1>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {search ? `${visibleCount}/${totalCount}` : totalCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Busca */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1 focus-within:bg-muted/50 transition-colors">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar projetos..."
                className="bg-transparent text-[12px] outline-none w-36 lg:w-48 placeholder:text-muted-foreground"
                aria-label="Buscar projetos"
              />
            </div>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-[12px] text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                  aria-label="Ordenar"
                  title="Ordenar"
                >
                  <span>{sortLabel(sort)}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {(
                  [
                    ["recent", "Atividade recente"],
                    ["name-asc", "Nome (A → Z)"],
                    ["name-desc", "Nome (Z → A)"],
                    ["tasks-desc", "Mais tarefas"],
                  ] as Array<[SortKey, string]>
                ).map(([key, label]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setSort(key)}
                    className={cn("text-[12.5px]", sort === key && "bg-accent")}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View toggle */}
            <div className="flex items-center rounded-md border border-border bg-muted/30 p-0.5">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded transition-colors",
                  view === "grid"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Visualizacao em grade"
                title="Grade"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded transition-colors",
                  view === "list"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Visualizacao em lista"
                title="Lista"
              >
                <Rows3 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Novo Projeto */}
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setNewProjectOpen(true)}
                className="flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-[12px] font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Plus className="h-3 w-3" />
                Novo Projeto
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setNewProjectOpen(true)}
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Criar projeto"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <NewProjectModal
            open={newProjectOpen}
            onOpenChange={setNewProjectOpen}
          />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          {isLoading ? (
            <SkeletonCards />
          ) : !projects?.length ? (
            <EmptyState onCreate={() => setNewProjectOpen(true)} />
          ) : visibleProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-6 w-6 text-muted-foreground/60" />
              <p className="mt-3 text-[12.5px] text-muted-foreground">
                Nenhum projeto encontrado para &quot;{search}&quot;.
              </p>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-3 text-[11.5px] text-primary hover:underline"
              >
                Limpar busca
              </button>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProjects.map((p) => (
                <ProjectCard
                  key={p.chave}
                  project={p}
                  summary={summaryById.get(p.chave) ?? null}
                  onClick={() => router.push(`/projects/${p.chave}`)}
                  onAutomation={() =>
                    router.push(`/projects/${p.chave}/automation`)
                  }
                  onEdit={isAdmin ? () => setEditTarget(p) : undefined}
                  onDelete={
                    isAdmin
                      ? () =>
                          setProjectToDelete({ chave: p.chave, nome: p.nome })
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <ProjectsListTable
              projects={visibleProjects}
              summaryById={summaryById}
              onOpen={(id) => router.push(`/projects/${id}`)}
              onEdit={isAdmin ? (p) => setEditTarget(p) : undefined}
              onDelete={
                isAdmin
                  ? (p) => setProjectToDelete({ chave: p.chave, nome: p.nome })
                  : undefined
              }
            />
          )}
        </div>

        {/* Edit modal (ADMIN only) */}
        {editTarget && (
          <EditProjectModal
            project={editTarget}
            open={!!editTarget}
            onOpenChange={(o) => !o && setEditTarget(null)}
          />
        )}

        {/* Delete confirmation dialog */}
        {projectToDelete && (
          <DeleteProjectDialog
            project={projectToDelete}
            open={!!projectToDelete}
            onOpenChange={(o) => !o && setProjectToDelete(null)}
          />
        )}
      </div>
    </PageTransition>
  );
}

function sortLabel(k: SortKey): string {
  switch (k) {
    case "name-asc":
      return "A → Z";
    case "name-desc":
      return "Z → A";
    case "tasks-desc":
      return "Mais tarefas";
    case "recent":
    default:
      return "Recente";
  }
}

function ProjectCard({
  project,
  summary,
  onClick,
  onAutomation,
  onEdit,
  onDelete,
}: {
  project: {
    chave: string;
    nome: string;
    descricao?: string | null;
    status?: string;
    dataFim?: string | null;
    taskCount?: number;
    responsavel?: { chave: string; nome: string } | null;
  };
  summary?: ProjectSummary | null;
  onClick: () => void;
  onAutomation: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const color = getProjectColor(project.nome);
  const initial = project.nome.charAt(0).toUpperCase();

  const statusKey = project.status ?? "active";
  const statusConfig = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.active;

  const targetDate = project.dataFim ? formatTargetDate(project.dataFim) : null;
  const lastActivityTs = summary?.lastActivity?.timestamp ?? null;

  // Progresso "vibe-based": throughput semanal / total de tasks.
  const tasks = summary?.taskCount ?? project.taskCount ?? 0;
  const throughput = summary?.weeklyThroughput ?? 0;
  const progress =
    tasks > 0 ? Math.min(100, Math.round((throughput / tasks) * 100)) : 0;

  const leadInitials = project.responsavel?.nome
    ? project.responsavel.nome
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : null;

  const avatarColorClass = project.responsavel?.nome
    ? getAvatarColor(project.responsavel.nome)
    : "";

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card",
        "hover:border-primary/30 hover:shadow-md",
        "transition-all duration-200 cursor-pointer",
        "flex flex-col",
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={`Abrir projeto ${project.nome}`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Ícone colorido com inicial */}
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[14px] font-semibold",
              color.bg,
              color.text,
            )}
          >
            {initial}
          </div>
          {/* Nome */}
          <span className="truncate text-[13px] font-medium text-foreground leading-tight">
            {project.nome}
          </span>
        </div>

        {/* Menu de ações — aparece no hover */}
        <div
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Ações do projeto"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="flex items-center gap-2 text-[13px]"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  Editar projeto
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onAutomation();
                }}
                className="flex items-center gap-2 text-[13px]"
              >
                <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                Automação
              </DropdownMenuItem>
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="flex items-center gap-2 text-[13px] text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir projeto
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Descrição */}
      <div className="px-4 pb-3">
        {project.descricao ? (
          <p className="line-clamp-1 text-[12px] text-muted-foreground leading-relaxed">
            {project.descricao}
          </p>
        ) : (
          <p className="text-[12px] text-muted-foreground/40 italic">
            Sem descrição
          </p>
        )}
      </div>

      {/* Barra de progresso */}
      {tasks > 0 && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progress > 60
                  ? "bg-emerald-500"
                  : progress > 30
                    ? "bg-sky-500"
                    : "bg-slate-500",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10.5px] tabular-nums text-muted-foreground shrink-0">
            {progress}%
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="mx-4 border-t border-border/60" />

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 p-4 pt-3">
        {/* Esquerda: status + data + atividade */}
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          {/* Status badge */}
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
              statusConfig.className,
            )}
          >
            {statusConfig.label}
          </span>

          {/* Data alvo */}
          {targetDate && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>{targetDate}</span>
            </div>
          )}

          {/* Ultima atividade */}
          {lastActivityTs && (
            <div
              className="flex items-center gap-1 text-[11px] text-muted-foreground"
              title={
                summary?.lastActivity?.intentionTitle ?? "Ultima atividade"
              }
            >
              <Activity className="h-3 w-3 shrink-0" />
              <span>{formatRelative(lastActivityTs)}</span>
            </div>
          )}
        </div>

        {/* Direita: avatar + task count */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Task count */}
          {tasks > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CheckSquare className="h-3 w-3" />
              <span className="tabular-nums">{tasks}</span>
            </div>
          )}

          {/* Avatar do responsável */}
          {leadInitials && (
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                avatarColorClass,
              )}
              title={project.responsavel?.nome}
            >
              {leadInitials}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Tabela compacta — view alternativa "Lista"
// ============================================================

function ProjectsListTable({
  projects,
  summaryById,
  onOpen,
  onEdit,
  onDelete,
}: {
  projects: Project[];
  summaryById: Map<string, ProjectSummary>;
  onOpen: (id: string) => void;
  onEdit?: (p: Project) => void;
  onDelete?: (p: Project) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card/30">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2 font-medium">Nome</th>
            <th className="hidden md:table-cell px-3 py-2 font-medium">
              Progresso
            </th>
            <th className="hidden lg:table-cell px-3 py-2 font-medium">
              Última atividade
            </th>
            <th className="hidden sm:table-cell px-3 py-2 font-medium text-right">
              Tarefas
            </th>
            <th className="hidden md:table-cell px-3 py-2 font-medium">
              Responsável
            </th>
            <th className="w-12 px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const summary = summaryById.get(p.chave);
            const tasks = summary?.taskCount ?? p.taskCount ?? 0;
            const throughput = summary?.weeklyThroughput ?? 0;
            const progress =
              tasks > 0
                ? Math.min(100, Math.round((throughput / tasks) * 100))
                : 0;
            const lastTs = summary?.lastActivity?.timestamp;
            const color = getProjectColor(p.nome);
            const leadInitials = p.responsavel?.nome
              ? p.responsavel.nome
                  .split(" ")
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : null;
            const avatarColorClass = p.responsavel?.nome
              ? getAvatarColor(p.responsavel.nome)
              : "";

            return (
              <tr
                key={p.chave}
                className="group border-b border-border/30 last:border-b-0 hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => onOpen(p.chave)}
              >
                <td className="px-3 py-2 align-middle">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold",
                        color.bg,
                        color.text,
                      )}
                    >
                      {p.nome.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate font-medium">{p.nome}</span>
                  </div>
                </td>
                <td className="hidden md:table-cell px-3 py-2 align-middle">
                  {tasks > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            progress > 60
                              ? "bg-emerald-500"
                              : progress > 30
                                ? "bg-sky-500"
                                : "bg-slate-500",
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {progress}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/50">
                      —
                    </span>
                  )}
                </td>
                <td className="hidden lg:table-cell px-3 py-2 align-middle text-[12px] text-muted-foreground">
                  {formatRelative(lastTs)}
                </td>
                <td className="hidden sm:table-cell px-3 py-2 align-middle text-right tabular-nums text-muted-foreground">
                  {tasks || "—"}
                </td>
                <td className="hidden md:table-cell px-3 py-2 align-middle">
                  {leadInitials ? (
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold",
                        avatarColorClass,
                      )}
                      title={p.responsavel?.nome}
                    >
                      {leadInitials}
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/50">
                      —
                    </span>
                  )}
                </td>
                <td
                  className="px-3 py-2 align-middle text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Ações do projeto"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {onEdit && (
                        <DropdownMenuItem
                          onClick={() => onEdit(p)}
                          className="text-[13px]"
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                          Editar projeto
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(p)}
                            className="text-[13px] text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Excluir projeto
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card animate-pulse flex flex-col"
        >
          {/* Header skeleton */}
          <div className="flex items-center gap-3 p-4 pb-3">
            <div className="h-9 w-9 rounded-lg bg-muted shrink-0" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
          {/* Descrição skeleton */}
          <div className="px-4 pb-3">
            <div className="h-3 w-full rounded bg-muted" />
          </div>
          {/* Divider */}
          <div className="mx-4 border-t border-border/60" />
          {/* Footer skeleton */}
          <div className="flex items-center justify-between p-4 pt-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-12 rounded-full bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-8 rounded bg-muted" />
              <div className="h-6 w-6 rounded-full bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 sm:px-8 py-16 sm:py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <FolderOpen className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-medium">Nenhum projeto ainda</h3>
      <p className="mt-1 text-[12px] text-muted-foreground max-w-xs">
        Crie seu primeiro projeto para começar a organizar as intenções da sua
        equipe.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className={cn(
          "mt-5 inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[12px] font-medium",
          "text-background hover:opacity-90 transition-opacity",
        )}
      >
        <Plus className="h-3 w-3" />
        Novo projeto
      </button>
    </div>
  );
}

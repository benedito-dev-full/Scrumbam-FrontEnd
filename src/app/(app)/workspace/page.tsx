"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bookmark,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  CircleDot,
  Flag,
  Folder,
  FolderOpen,
  GripVertical,
  ListChecks,
  Maximize2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import type { Folder as FolderType, ProjectSummary } from "@/types";
import { UNASSIGNED_FOLDER_ID } from "@/types";
import type { IntentionDocument } from "@/types/intention";

import { PageTransition } from "@/components/common/page-transition";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateFolderModal } from "@/components/folders/create-folder-modal";
import { RenameFolderModal } from "@/components/folders/rename-folder-modal";
import { DeleteFolderDialog } from "@/components/folders/delete-folder-dialog";
import { MoveProjectSubmenu } from "@/components/folders/move-project-submenu";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useAuth } from "@/lib/hooks/use-auth";
import { useProjects, useProjectSummaries } from "@/lib/hooks/use-projects";
import {
  useFolders,
  useFolderProjects,
  useUnassignedProjects,
} from "@/lib/hooks/use-folders";
import { useIntentions } from "@/lib/hooks/use-intentions";
import { useMyTeams } from "@/lib/hooks/use-teams";
import { useOrgMembers } from "@/lib/hooks/use-organization";
import { useBookmarks } from "@/lib/hooks/use-task-bookmarks";
import { openNewIssueModal } from "@/components/intentions/new-issue-modal";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Tela de visao geral do workspace (estilo ClickUp "Espaco da equipe").
 *
 * Widgets:
 *  - Minhas tarefas: tasks atribuidas ao usuario logado, agrupadas por status.
 *  - Atividade recente: top projetos por lastActivity (de useProjectSummaries).
 *  - Bookmarks: favoritos persistidos em localStorage (useBookmarks).
 *  - Folders (projetos): lista de projetos do workspace com counts.
 *  - Times: times do workspace com contagem de projetos.
 *
 * Adaptada do ClickUp para o que o backend V2 ja expoe — zero campo novo.
 */
export default function WorkspaceOverviewPage() {
  const { user } = useAuth();
  usePageTitle(user?.orgNome ?? "Workspace");

  const orgId = useAuthStore((s) => s.user?.orgId);
  const myEntidadeId = useAuthStore((s) => s.user?.entidadeId);

  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: summaries } = useProjectSummaries(orgId ?? undefined);
  const { data: allIntentions, isLoading: intentionsLoading } = useIntentions();
  const { data: teams } = useMyTeams();
  const { data: orgMembers } = useOrgMembers(orgId ?? undefined);
  const { bookmarks, remove: removeBookmark } = useBookmarks();

  // Minhas tarefas — filtradas client-side (V2 nao expoe filtro por assigneeId).
  // Card mostra apenas tarefas A FAZER. Concluidas/canceladas/descartadas/
  // falhadas viram historico e nao poluem o widget (sao consultaveis em
  // /intentions). Mantemos a contagem total das do usuario para detectar o
  // estado "tudo em dia" (tem historico mas zero pendentes).
  const allMyTasks = useMemo(
    () => (allIntentions ?? []).filter((i) => i.assigneeId === myEntidadeId),
    [allIntentions, myEntidadeId],
  );
  const myActiveTasks = useMemo(
    () =>
      allMyTasks.filter(
        (t) =>
          t.status !== "done" &&
          t.status !== "failed" &&
          t.status !== "cancelled" &&
          t.status !== "discarded",
      ),
    [allMyTasks],
  );
  const myTasksByStatus = useMemo(() => {
    // Agrupa as tasks completas (nao so contagem) por categoria.
    // ready + validating + validated viram "ready" pois todos significam
    // "fora da inbox, ainda nao em execucao".
    const buckets: Record<
      "inbox" | "ready" | "executing",
      IntentionDocument[]
    > = {
      inbox: [],
      ready: [],
      executing: [],
    };
    for (const t of myActiveTasks) {
      if (t.status === "inbox") buckets.inbox.push(t);
      else if (
        t.status === "ready" ||
        t.status === "validating" ||
        t.status === "validated"
      )
        buckets.ready.push(t);
      else if (t.status === "executing") buckets.executing.push(t);
    }
    return buckets;
  }, [myActiveTasks]);

  // Atividade recente — top 5 projetos por lastActivity timestamp.
  const recentActivity = useMemo(() => {
    const list = (summaries ?? []).filter((s) => s.lastActivity != null);
    list.sort((a, b) => {
      const ta = a.lastActivity?.timestamp ?? "";
      const tb = b.lastActivity?.timestamp ?? "";
      return tb.localeCompare(ta);
    });
    return list.slice(0, 5);
  }, [summaries]);

  // Projetos agrupados por time (para widget Times).
  const projectsByTeam = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of projects ?? []) {
      if (!p.teamId) continue;
      map.set(p.teamId, (map.get(p.teamId) ?? 0) + 1);
    }
    return map;
  }, [projects]);

  // Progresso real por projeto: conta tasks com status=done sobre total.
  // Reusa allIntentions (ja buscadas pelo card 'Minhas tarefas'); sem
  // round-trip extra no backend.
  const progressByProjectId = useMemo(() => {
    const m = new Map<string, { done: number; total: number }>();
    for (const t of allIntentions ?? []) {
      if (!t.projectSlug) continue;
      const cur = m.get(t.projectSlug) ?? { done: 0, total: 0 };
      cur.total += 1;
      if (t.status === "done") cur.done += 1;
      m.set(t.projectSlug, cur);
    }
    return m;
  }, [allIntentions]);

  const totalTasks = (allIntentions ?? []).length;
  const totalProjects = (projects ?? []).length;
  const totalMembers = (orgMembers ?? []).length;

  return (
    <PageTransition>
      <div className="px-6 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {user?.orgNome ?? "Workspace"}
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {totalProjects} {totalProjects === 1 ? "projeto" : "projetos"} ·{" "}
                {totalTasks} {totalTasks === 1 ? "tarefa" : "tarefas"} ·{" "}
                {totalMembers} {totalMembers === 1 ? "membro" : "membros"}
              </p>
            </div>
            <Link
              href="/projects?new=1"
              className="flex items-center gap-1.5 rounded-md bg-foreground/10 px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-foreground/15 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo projeto
            </Link>
          </header>

          {/* Top widgets — 3 colunas */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <MyTasksCard
              loading={intentionsLoading}
              tasksByStatus={myTasksByStatus}
              activeTotal={myActiveTasks.length}
              hasHistory={allMyTasks.length > 0}
              projects={projects ?? []}
            />
            <RecentActivityCard summaries={recentActivity} />
            <BookmarksCard bookmarks={bookmarks} onRemove={removeBookmark} />
          </div>

          {/* Folders / Projetos */}
          <FoldersCard
            projects={projects ?? []}
            summaries={summaries ?? []}
            progressByProjectId={progressByProjectId}
            loading={projectsLoading}
          />

          {/* Times */}
          <TeamsCard teams={teams ?? []} projectsByTeam={projectsByTeam} />
        </div>
      </div>
    </PageTransition>
  );
}

// ============================================================
// Widget: Minhas tarefas
// ============================================================

type StatusKey = "inbox" | "ready" | "executing";

function MyTasksCard({
  loading,
  tasksByStatus,
  activeTotal,
  hasHistory,
  projects,
}: {
  loading: boolean;
  tasksByStatus: Record<StatusKey, IntentionDocument[]>;
  activeTotal: number;
  hasHistory: boolean;
  projects: Array<{ chave: string; nome: string }>;
}) {
  // Seção expandida default: primeira com tasks > 0; se nenhuma tiver, inbox.
  const initialExpanded: StatusKey = useMemo(() => {
    if (tasksByStatus.inbox.length > 0) return "inbox";
    if (tasksByStatus.ready.length > 0) return "ready";
    if (tasksByStatus.executing.length > 0) return "executing";
    return "inbox";
  }, [tasksByStatus]);
  const [expanded, setExpanded] = useState<StatusKey>(initialExpanded);

  const sections: Array<{
    key: StatusKey;
    label: string;
    icon: typeof CircleDashed;
    color: string;
  }> = [
    {
      key: "inbox",
      label: "Inbox",
      icon: CircleDashed,
      color: "text-zinc-400",
    },
    {
      key: "ready",
      label: "Pronto",
      icon: ListChecks,
      color: "text-blue-400",
    },
    {
      key: "executing",
      label: "Em execucao",
      icon: CircleDot,
      color: "text-violet-400",
    },
  ];

  const projectName = (id: string | null | undefined): string => {
    if (!id) return "";
    return projects.find((p) => p.chave === id)?.nome ?? "";
  };

  return (
    <Card title="Minhas tarefas" icon={ListChecks} accent="text-emerald-500">
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : activeTotal === 0 && !hasHistory ? (
        <EmptyState
          text="Você não tem tarefas atribuídas."
          icon={ListChecks}
          cta={{ label: "Criar tarefa", onClick: openNewIssueModal }}
        />
      ) : activeTotal === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-emerald-500/30 bg-emerald-500/5 px-3 py-6 text-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15">
            <ListChecks className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-[12.5px] font-medium text-emerald-200">
            Você está em dia!
          </p>
          <Link
            href="/intentions"
            className="text-[11.5px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver concluídas →
          </Link>
        </div>
      ) : (
        <ul className="space-y-1">
          {sections.map((s) => {
            const tasks = tasksByStatus[s.key];
            const count = tasks.length;
            const isOpen = expanded === s.key;
            const Icon = s.icon;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() =>
                    setExpanded(isOpen ? ("" as StatusKey) : s.key)
                  }
                  className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-accent/50"
                  aria-expanded={isOpen}
                >
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", s.color)} />
                  <span className="flex-1 text-left">{s.label}</span>
                  <span className="text-[12px] tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </button>
                {isOpen && (
                  <div className="ml-5 mt-0.5 mb-1.5 border-l border-border/50 pl-2">
                    {count === 0 ? (
                      <p className="px-2 py-1.5 text-[11.5px] text-muted-foreground/70 italic">
                        Nenhuma tarefa nesta categoria.
                      </p>
                    ) : (
                      <ul className="space-y-0.5">
                        {tasks.slice(0, 6).map((t) => (
                          <li key={t.id}>
                            <Link
                              href={`/projects/${t.projectSlug}/issues/${t.id}`}
                              className="flex flex-col gap-0.5 rounded-md px-2 py-1 transition-colors hover:bg-accent/40"
                            >
                              <span className="truncate text-[12.5px]">
                                {t.title}
                              </span>
                              {projectName(t.projectSlug) && (
                                <span className="truncate text-[10.5px] text-muted-foreground">
                                  em {projectName(t.projectSlug)}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                        {count > 6 && (
                          <li>
                            <Link
                              href={`/intentions?status=${s.key}`}
                              className="block px-2 py-1 text-[11.5px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Ver mais {count - 6} →
                            </Link>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ============================================================
// Widget: Atividade recente
// ============================================================

function RecentActivityCard({ summaries }: { summaries: ProjectSummary[] }) {
  return (
    <Card title="Atividade recente" icon={Activity} accent="text-sky-500">
      {summaries.length === 0 ? (
        <EmptyState
          text="Sem atividade recente nos projetos."
          icon={Activity}
        />
      ) : (
        <ul className="space-y-2">
          {summaries.map((s) => (
            <li key={s.projectId}>
              <Link
                href={`/projects/${s.projectId}`}
                className="flex flex-col gap-0.5 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/50"
              >
                <span className="truncate text-[13px] font-medium">
                  {s.lastActivity?.intentionTitle ?? s.projectName}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  em {s.projectName} ·{" "}
                  {formatRelative(s.lastActivity?.timestamp)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ============================================================
// Widget: Bookmarks
// ============================================================

interface BookmarkItem {
  id: string;
  label: string;
  href: string;
  kind: "project" | "task";
}

function BookmarksCard({
  bookmarks,
  onRemove,
}: {
  bookmarks: BookmarkItem[];
  onRemove: (id: string) => void;
}) {
  return (
    <Card title="Favoritos" icon={Bookmark} accent="text-amber-500">
      {bookmarks.length === 0 ? (
        <EmptyState
          text="Marque projetos ou tarefas como favoritos para acessá-los rápido."
          icon={Bookmark}
        />
      ) : (
        <ul className="space-y-1">
          {bookmarks.map((b) => (
            <li
              key={b.id}
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/50"
            >
              <Link
                href={b.href}
                className="flex flex-1 min-w-0 items-center gap-2 text-[13px]"
              >
                {b.kind === "project" ? (
                  <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <ListChecks className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{b.label}</span>
              </Link>
              <button
                type="button"
                onClick={() => onRemove(b.id)}
                className="text-[11px] text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                aria-label="Remover favorito"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ============================================================
// Widget: Folders (Projetos) — estilo ClickUp
// Estado 1: card "Folders" com pasta "Projetos" clicavel.
// Estado 2: card "Lists" com tabela dos projetos da pasta (substitui).
// ============================================================

interface ProjectListItem {
  chave: string;
  nome: string;
  taskCount: number;
  teamId?: string | null;
}

// Paleta para coluna "Cor" da Lists — derivada do hash do nome.
const PROJECT_HEX = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#06b6d4",
];
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return h >>> 0;
}
function projectHex(nome: string): string {
  return PROJECT_HEX[hashStr(nome) % PROJECT_HEX.length];
}

function formatDateShort(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function FoldersCard({
  projects,
  summaries,
  progressByProjectId,
  loading,
}: {
  projects: ProjectListItem[];
  summaries: ProjectSummary[];
  progressByProjectId: Map<string, { done: number; total: number }>;
  loading: boolean;
}) {
  // openFolder = null  → mostra grid de pastas (Estado 1).
  // openFolder = ID    → mostra lista de projects (Estado 2).
  //   ID pode ser DEntidade -155 (pasta real) ou UNASSIGNED_FOLDER_ID
  //   ("__unassigned__", pasta virtual de projects sem pasta).
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  // Modais de CRUD (Etapa 2). Renderizados como portal — abertos via state.
  // `null` em rename/delete target = modal fechado; objeto = pasta-alvo.
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FolderType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FolderType | null>(null);

  // Pastas reais (DEntidade -155 via useFolders → /entidades/folders).
  // Backend retorna ordenadas alfabeticamente por nome.
  const {
    data: folders,
    isLoading: foldersLoading,
    isError: foldersError,
  } = useFolders();

  // Projects sem pasta (limbo). Usado para contagem da "Sem pasta" no Estado 1
  // e como lista no Estado 2 quando openFolder === UNASSIGNED_FOLDER_ID.
  const { data: unassignedProjects, isLoading: unassignedLoading } =
    useUnassignedProjects();

  // Projects de UMA pasta especifica. So dispara quando openFolder e um ID real.
  const realFolderId =
    openFolder && openFolder !== UNASSIGNED_FOLDER_ID ? openFolder : null;
  const { data: folderProjects, isLoading: folderProjectsLoading } =
    useFolderProjects(realFolderId);

  const summaryById = useMemo(() => {
    const m = new Map<string, ProjectSummary>();
    for (const s of summaries) m.set(s.projectId, s);
    return m;
  }, [summaries]);

  // Lista renderizada no Estado 2 (drill-down) — normaliza para ProjectListItem
  // do widget. Inclui dataInicio/dataFim via casting (campos opcionais).
  const drillProjects = useMemo<ProjectListItem[]>(() => {
    const src =
      openFolder === UNASSIGNED_FOLDER_ID
        ? (unassignedProjects ?? [])
        : realFolderId
          ? (folderProjects ?? [])
          : [];
    return src.map(
      (p) =>
        ({
          chave: p.chave,
          nome: p.nome,
          taskCount: p.taskCount,
          teamId: p.teamId ?? null,
          dataInicio: p.dataInicio,
          dataFim: p.dataFim,
        }) as ProjectListItem,
    );
  }, [openFolder, realFolderId, unassignedProjects, folderProjects]);

  // Nome da pasta selecionada para o breadcrumb.
  const drillFolderName = useMemo(() => {
    if (openFolder === UNASSIGNED_FOLDER_ID) return "Sem pasta";
    if (!realFolderId) return "";
    const f = (folders ?? []).find((x: FolderType) => x.id === realFolderId);
    return f?.nome ?? "Pasta";
  }, [openFolder, realFolderId, folders]);

  const drillLoading =
    openFolder === UNASSIGNED_FOLDER_ID
      ? unassignedLoading
      : folderProjectsLoading;

  // Contagem de "Sem pasta" — preferencialmente do hook (backend autoritativo).
  // Fallback para os projects ja carregados pelo useProjects (campo folderId)
  // quando o backend indisponivel/erro — evita tela em branco no cutover.
  const apiUnassignedCount = (unassignedProjects ?? []).length;
  const localUnassignedCount = projects.filter(
    (p) => !(p as ProjectListItem & { folderId?: string | null }).folderId,
  ).length;
  const unassignedCount = foldersError
    ? localUnassignedCount
    : apiUnassignedCount;
  const hasUnassigned = unassignedCount > 0;

  // ----- Estado 1: Folders -----
  if (openFolder === null) {
    const realFolders = folders ?? [];
    const isLoadingList = loading || foldersLoading || unassignedLoading;
    const showEmpty =
      !isLoadingList && realFolders.length === 0 && !hasUnassigned;

    return (
      <>
        <section className="rounded-xl border border-border bg-card/30 p-4">
          <header className="mb-3 flex items-center gap-2">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60" />
            <h2 className="text-[14px] font-semibold tracking-tight">
              Folders
            </h2>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
                aria-label="Expandir primeira pasta"
                title="Expandir"
                disabled={realFolders.length === 0 && !hasUnassigned}
                onClick={() => {
                  if (realFolders.length > 0) setOpenFolder(realFolders[0].id);
                  else if (hasUnassigned) setOpenFolder(UNASSIGNED_FOLDER_ID);
                }}
              >
                <Maximize2 className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Nova pasta"
                title="Nova pasta"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>

          {isLoadingList ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-10 w-full" />
            </div>
          ) : showEmpty ? (
            <EmptyState
              text="Nenhuma pasta ou projeto neste workspace ainda."
              cta={{
                label: "Criar pasta",
                onClick: () => setCreateOpen(true),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {realFolders.map((f: FolderType) => (
                <div
                  key={f.id}
                  className="group relative flex items-center rounded-md border border-border/70 bg-card/40 transition-colors hover:border-border hover:bg-accent/30"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFolder(f.id)}
                    className="flex flex-1 items-center gap-2 px-3 py-2.5 text-left"
                  >
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: projectHex(f.nome) }}
                      aria-hidden
                    />
                    <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-[13px] font-medium">
                      {f.nome}
                    </span>
                    <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
                      {f.projectCount}
                    </span>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Opções da pasta ${f.nome}`}
                        title="Opções"
                        className="mr-1 flex h-7 w-7 items-center justify-center rounded text-muted-foreground/60 opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => setRenameTarget(f)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Renomear
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(f)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {hasUnassigned && (
                <button
                  type="button"
                  onClick={() => setOpenFolder(UNASSIGNED_FOLDER_ID)}
                  className="flex items-center gap-2 rounded-md border border-dashed border-border/70 bg-card/40 px-3 py-2.5 text-left hover:border-border hover:bg-accent/30 transition-colors"
                >
                  <Folder className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                  <span className="truncate text-[13px] font-medium text-muted-foreground">
                    Sem pasta
                  </span>
                  <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
                    {unassignedCount}
                  </span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* Modais CRUD (Etapa 2) — renderizados como portal pelo Radix Dialog */}
        <CreateFolderModal open={createOpen} onOpenChange={setCreateOpen} />
        {renameTarget && (
          <RenameFolderModal
            open={!!renameTarget}
            onOpenChange={(o) => !o && setRenameTarget(null)}
            folder={renameTarget}
          />
        )}
        {deleteTarget && (
          <DeleteFolderDialog
            open={!!deleteTarget}
            onOpenChange={(o) => !o && setDeleteTarget(null)}
            folder={deleteTarget}
          />
        )}
      </>
    );
  }

  // ----- Estado 2: Lists (substitui o card Folders) -----
  return (
    <section className="rounded-xl border border-border bg-card/30 p-4">
      <header className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpenFolder(null)}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Voltar para Folders"
          title="Voltar"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-[14px] font-semibold tracking-tight">Lists</h2>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          / {drillFolderName}
        </span>
        <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
          {drillProjects.length}
        </span>
      </header>

      {drillLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : drillProjects.length === 0 ? (
        <EmptyState text="Nenhum projeto nesta pasta." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-1.5 font-medium">Nome</th>
                <th className="hidden sm:table-cell px-2 py-1.5 font-medium">
                  Cor
                </th>
                <th className="hidden md:table-cell px-2 py-1.5 font-medium">
                  Progresso
                </th>
                <th className="hidden lg:table-cell px-2 py-1.5 font-medium">
                  Início
                </th>
                <th className="hidden lg:table-cell px-2 py-1.5 font-medium">
                  Término
                </th>
                <th className="hidden sm:table-cell px-2 py-1.5 font-medium text-right">
                  Tarefas
                </th>
                <th className="w-8 px-2 py-1.5">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {drillProjects.map((p) => {
                const summary = summaryById.get(p.chave);
                // Progresso real: tasks com status=done sobre total.
                // Calculado client-side via progressByProjectId (vem do
                // workspace, derivado de allIntentions).
                const local = progressByProjectId.get(p.chave);
                const tasks = local?.total ?? summary?.taskCount ?? p.taskCount;
                const done = local?.done ?? 0;
                const progress =
                  tasks > 0 ? Math.round((done / tasks) * 100) : 0;
                // dataInicio/dataFim podem nao vir no useProjects basico.
                // ProjectSummary nao tem essas datas. Mostra placeholder se nao existir.
                const dataInicio = formatDateShort(
                  (p as ProjectListItem & { dataInicio?: string | null })
                    .dataInicio,
                );
                const dataFim = formatDateShort(
                  (p as ProjectListItem & { dataFim?: string | null }).dataFim,
                );
                const hex = projectHex(p.nome);
                return (
                  <tr
                    key={p.chave}
                    className="group border-b border-border/30 last:border-b-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-2 py-2 align-middle">
                      <Link
                        href={`/projects/${p.chave}`}
                        className="flex items-center gap-2 min-w-0"
                      >
                        <ListChecks className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium">{p.nome}</span>
                      </Link>
                    </td>
                    <td className="hidden sm:table-cell px-2 py-2 align-middle">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: hex }}
                        title="Cor do projeto"
                      />
                    </td>
                    <td className="hidden md:table-cell px-2 py-2 align-middle">
                      {tasks > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
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
                            {done}/{tasks}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/50">
                          —
                        </span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell px-2 py-2 align-middle text-[12px] text-muted-foreground">
                      {dataInicio ?? (
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                    </td>
                    <td className="hidden lg:table-cell px-2 py-2 align-middle text-[12px] text-muted-foreground">
                      {dataFim ? (
                        <span className="inline-flex items-center gap-1">
                          {dataFim}
                          {/* Bandeira so se ja passou — afordancia de risco */}
                          {new Date(
                            (p as ProjectListItem & { dataFim?: string })
                              .dataFim ?? "",
                          ).getTime() < Date.now() && (
                            <Flag className="h-3 w-3 text-rose-400" />
                          )}
                        </span>
                      ) : (
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-2 py-2 align-middle text-right tabular-nums text-muted-foreground">
                      {tasks}
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Ações do projeto ${p.nome}`}
                            title="Ações"
                            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/60 opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <MoveProjectSubmenu
                            projectId={p.chave}
                            projectName={p.nome}
                            currentFolderId={realFolderId}
                          />
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${p.chave}`}>
                              <ListChecks className="mr-2 h-3.5 w-3.5" />
                              Abrir projeto
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ============================================================
// Widget: Times
// ============================================================

interface TeamListItem {
  id: string;
  name: string;
  memberCount: number;
  color?: string | null;
}

function TeamsCard({
  teams,
  projectsByTeam,
}: {
  teams: TeamListItem[];
  projectsByTeam: Map<string, number>;
}) {
  return (
    <Card title="Times" icon={Users} hint={`${teams.length}`}>
      {teams.length === 0 ? (
        <EmptyState text="Voce ainda nao participa de nenhum time. Crie um em /teams." />
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <li key={t.id}>
              <Link
                href="/teams"
                className="flex items-center gap-3 rounded-md border border-border/70 bg-card/40 px-3 py-2.5 transition-colors hover:border-border hover:bg-accent/30"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[12px] font-bold text-white"
                  style={{ backgroundColor: t.color ?? "#64748b" }}
                >
                  {t.name[0]?.toUpperCase() ?? "T"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{t.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {t.memberCount} {t.memberCount === 1 ? "membro" : "membros"}{" "}
                    · {projectsByTeam.get(t.id) ?? 0}{" "}
                    {(projectsByTeam.get(t.id) ?? 0) === 1
                      ? "projeto"
                      : "projetos"}
                  </p>
                </div>
                <UserPlus className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ============================================================
// Helpers
// ============================================================

function Card({
  title,
  icon: Icon,
  hint,
  accent,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  /** Cor semantica do icone (Tailwind text-*). Default: muted. */
  accent?: string;
  children: React.ReactNode;
}) {
  // Deriva o background do badge a partir do accent (ex: text-emerald-500 -> bg-emerald-500/10)
  const accentBg = accent
    ? accent.replace("text-", "bg-").replace(/-\d+$/, "-500/10")
    : "bg-muted";
  return (
    <section className="rounded-xl border border-border bg-card/30 p-4">
      <header className="mb-3 flex items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md",
            accentBg,
          )}
        >
          <Icon className={cn("h-4 w-4", accent ?? "text-muted-foreground")} />
        </span>
        <h2 className="text-[14px] font-semibold tracking-tight">{title}</h2>
        {hint && (
          <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
            {hint}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

function EmptyState({
  text,
  icon: Icon,
  cta,
}: {
  text: string;
  icon?: React.ComponentType<{ className?: string }>;
  cta?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center">
      {Icon && (
        <Icon className="h-6 w-6 text-muted-foreground/60" aria-hidden />
      )}
      <p className="text-[12px] text-muted-foreground">{text}</p>
      {cta &&
        (cta.href ? (
          <Link
            href={cta.href}
            className="mt-1 inline-flex items-center gap-1 rounded-md bg-foreground/10 px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-foreground/15 transition-colors"
          >
            <Plus className="h-3 w-3" />
            {cta.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={cta.onClick}
            className="mt-1 inline-flex items-center gap-1 rounded-md bg-foreground/10 px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-foreground/15 transition-colors"
          >
            <Plus className="h-3 w-3" />
            {cta.label}
          </button>
        ))}
    </div>
  );
}

function formatRelative(timestamp?: string): string {
  if (!timestamp) return "—";
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return "—";
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "agora mesmo";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `ha ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `ha ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `ha ${diffD} d`;
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

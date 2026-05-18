"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  Bookmark,
  CircleDashed,
  CircleDot,
  Folder,
  ListChecks,
  Plus,
  Star,
  UserPlus,
  Users,
} from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useAuth } from "@/lib/hooks/use-auth";
import { useProjects, useProjectSummaries } from "@/lib/hooks/use-projects";
import { useIntentions } from "@/lib/hooks/use-intentions";
import { useMyTeams } from "@/lib/hooks/use-teams";
import { useOrgMembers } from "@/lib/hooks/use-organization";
import { useBookmarks } from "@/lib/hooks/use-task-bookmarks";
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
  const myTasks = useMemo(
    () => (allIntentions ?? []).filter((i) => i.assigneeId === myEntidadeId),
    [allIntentions, myEntidadeId],
  );
  const myByStatus = useMemo(() => {
    const map: Record<string, number> = {
      inbox: 0,
      ready: 0,
      executing: 0,
      done: 0,
    };
    for (const t of myTasks) {
      if (t.status in map) map[t.status] += 1;
    }
    return map;
  }, [myTasks]);

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
              byStatus={myByStatus}
              total={myTasks.length}
            />
            <RecentActivityCard summaries={recentActivity} />
            <BookmarksCard bookmarks={bookmarks} onRemove={removeBookmark} />
          </div>

          {/* Folders / Projetos */}
          <FoldersCard
            projects={projects ?? []}
            summaries={summaries ?? []}
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

function MyTasksCard({
  loading,
  byStatus,
  total,
}: {
  loading: boolean;
  byStatus: Record<string, number>;
  total: number;
}) {
  const rows: Array<{
    key: string;
    label: string;
    icon: typeof CircleDashed;
    color: string;
    href: string;
  }> = [
    {
      key: "inbox",
      label: "Inbox",
      icon: CircleDashed,
      color: "text-zinc-400",
      href: "/intentions/inbox",
    },
    {
      key: "ready",
      label: "Pronto",
      icon: ListChecks,
      color: "text-blue-400",
      href: "/intentions?status=ready",
    },
    {
      key: "executing",
      label: "Em execucao",
      icon: CircleDot,
      color: "text-violet-400",
      href: "/intentions?status=executing",
    },
  ];

  return (
    <Card title="Minhas tarefas" icon={ListChecks} accent="text-emerald-500">
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : total === 0 ? (
        <EmptyState
          text="Você não tem tarefas atribuídas."
          icon={ListChecks}
          cta={{ label: "Criar tarefa", href: "/intentions/new" }}
        />
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => {
            const count = byStatus[r.key] ?? 0;
            const Icon = r.icon;
            return (
              <li key={r.key}>
                <Link
                  href={r.href}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-accent/50"
                >
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", r.color)} />
                  <span className="flex-1">{r.label}</span>
                  <span className="text-[12px] tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </Link>
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

interface ProjectSummary {
  projectId: string;
  projectName: string;
  taskCount: number;
  weeklyThroughput: number;
  lastActivity: {
    timestamp: string;
    eventType: string;
    intentionTitle: string;
  } | null;
}

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
// Widget: Folders (Projetos)
// ============================================================

interface ProjectListItem {
  chave: string;
  nome: string;
  taskCount: number;
  teamId?: string | null;
}

function FoldersCard({
  projects,
  summaries,
  loading,
}: {
  projects: ProjectListItem[];
  summaries: ProjectSummary[];
  loading: boolean;
}) {
  const { isBookmarked, toggle } = useBookmarks();

  // Mapa rapido para enriquecer projetos com summaries (lastActivity, throughput).
  const summaryById = useMemo(() => {
    const m = new Map<string, ProjectSummary>();
    for (const s of summaries) m.set(s.projectId, s);
    return m;
  }, [summaries]);

  return (
    <Card
      title="Projetos"
      icon={Folder}
      accent="text-indigo-500"
      hint={`${projects.length}`}
    >
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          text="Nenhum projeto no workspace ainda."
          icon={Folder}
          cta={{ label: "Novo projeto", href: "/projects?new=1" }}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="w-8 px-2 py-1.5"></th>
                <th className="px-2 py-1.5 font-medium">Nome</th>
                <th className="hidden md:table-cell px-2 py-1.5 font-medium">
                  Progresso
                </th>
                <th className="hidden lg:table-cell px-2 py-1.5 font-medium">
                  Última atividade
                </th>
                <th className="hidden sm:table-cell px-2 py-1.5 font-medium text-right">
                  Tarefas
                </th>
                <th className="w-8 px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const summary = summaryById.get(p.chave);
                const tasks = summary?.taskCount ?? p.taskCount;
                const throughput = summary?.weeklyThroughput ?? 0;
                // Progresso visual: ratio throughput/tasks limitado a 100%.
                const progress =
                  tasks > 0
                    ? Math.min(100, Math.round((throughput / tasks) * 100))
                    : 0;
                const lastTs = summary?.lastActivity?.timestamp;
                const fav = isBookmarked(p.chave);
                const href = `/projects/${p.chave}`;
                return (
                  <tr
                    key={p.chave}
                    className="group border-b border-border/30 last:border-b-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-2 py-2 align-middle">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggle({
                            id: p.chave,
                            kind: "project",
                            label: p.nome,
                            href,
                          });
                        }}
                        aria-label={
                          fav
                            ? "Remover dos favoritos"
                            : "Adicionar aos favoritos"
                        }
                        className={cn(
                          "rounded p-1 transition-colors",
                          fav
                            ? "text-amber-400 hover:text-amber-300"
                            : "text-muted-foreground/40 hover:text-amber-400 opacity-0 group-hover:opacity-100",
                          fav && "opacity-100",
                        )}
                      >
                        <Star
                          className={cn("h-3.5 w-3.5", fav && "fill-current")}
                        />
                      </button>
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <Link
                        href={href}
                        className="flex items-center gap-2 min-w-0"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-600 text-[11px] font-bold text-white">
                          {(p.nome[0] ?? "P").toUpperCase()}
                        </span>
                        <span className="truncate font-medium">{p.nome}</span>
                      </Link>
                    </td>
                    <td className="hidden md:table-cell px-2 py-2 align-middle">
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
                    </td>
                    <td className="hidden lg:table-cell px-2 py-2 align-middle text-[12px] text-muted-foreground">
                      {formatRelative(lastTs)}
                    </td>
                    <td className="hidden sm:table-cell px-2 py-2 align-middle text-right tabular-nums text-muted-foreground">
                      {tasks}
                    </td>
                    <td className="px-2 py-2 align-middle text-right">
                      <Link
                        href={href}
                        className="text-[11px] text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                        aria-label="Abrir projeto"
                      >
                        Abrir →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
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
        <EmptyState
          text="Você ainda não participa de nenhum time."
          icon={Users}
          cta={{ label: "Ir para times", href: "/teams" }}
        />
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
  const accentBg = accent
    ? accent.replace("text-", "bg-").replace(/-\d+/, "-500/10")
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

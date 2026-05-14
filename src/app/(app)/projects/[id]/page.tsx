"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  CheckCircle2,
  Calendar,
  PenSquare,
  Cpu,
  Clock,
  Plus,
  Sparkles,
  Bug,
  TrendingUp,
  Eye,
  Code,
  HelpCircle,
  CheckCheck,
  SlidersHorizontal,
  Trash2,
  UserPlus,
} from "lucide-react";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useProject } from "@/lib/hooks/use-projects";
import { useIntentions, useMoveStatus } from "@/lib/hooks/use-intentions";
import { useProjectActivity } from "@/lib/hooks/use-activity";
import { useOrgMembers } from "@/lib/hooks/use-organization";
import {
  useProjectMembers,
  useRemoveProjectMember,
  useUpdateProjectMember,
} from "@/lib/hooks/use-project-members";
import type { ProjectMember, ProjectRole } from "@/lib/api/project-members";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ProjectPropertiesPanel } from "@/components/projects/project-properties-panel";
import { ProjectStatusList } from "@/components/projects/project-status-list";
import { AddProjectMemberModal } from "@/components/projects/add-project-member-modal";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { NewIssueModal } from "@/components/intentions/new-issue-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  IntentionDocument,
  IntentionPriority,
  IntentionStatus,
  IntentionType,
} from "@/types/intention";

// ============================================================
// Helpers de ícone colorido (mesma lógica dos cards de projeto)
// ============================================================

const ICON_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

function projectColorClass(nome?: string | null): string {
  const idx = (nome?.charCodeAt(0) ?? 0) % ICON_COLORS.length;
  return ICON_COLORS[idx];
}

function ProjectIcon({
  nome,
  size = "sm",
}: {
  nome?: string | null;
  size?: "sm" | "lg";
}) {
  const color = projectColorClass(nome);
  const initial = nome?.[0]?.toUpperCase() ?? "P";
  if (size === "lg") {
    return (
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md text-[18px] font-bold text-white shrink-0",
          color,
        )}
      >
        {initial}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white shrink-0",
        color,
      )}
    >
      {initial}
    </span>
  );
}

// ============================================================
// Tabs
// ============================================================

type TabKey = "overview" | "activity" | "issues" | "members";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Visao geral" },
  { key: "activity", label: "Atividade" },
  { key: "issues", label: "Issues" },
  { key: "members", label: "Membros" },
];

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { data: project, isLoading } = useProject(projectId);
  const { data: intentions } = useIntentions({ projectSlug: projectId });
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = (role ?? "").toUpperCase() === "ADMIN";

  usePageTitle(project?.nome ?? "Project");

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [favorited, setFavorited] = useState(false);
  const [newIssueOpen, setNewIssueOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const issuesList = (intentions ?? []) as IntentionDocument[];

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        {/* Top breadcrumb bar */}
        <header className="flex h-11 shrink-0 items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-border">
          <nav className="flex items-center gap-1.5 text-[13px] min-w-0">
            <Link
              href="/projects"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Projects
            </Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <ProjectIcon nome={project?.nome} />
            <span className="font-medium truncate">
              {project?.nome ?? "..."}
            </span>
            <button
              type="button"
              onClick={() => setFavorited((v) => !v)}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors ml-1"
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
              aria-label="Mais opcoes"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setNewIssueOpen(true)}
              className="flex items-center gap-1.5 rounded-md bg-foreground/10 px-2 py-1 text-[12px] font-medium text-foreground hover:bg-foreground/15 transition-colors"
              aria-label="Nova issue"
              title="Nova issue neste projeto"
            >
              <PenSquare className="h-3.5 w-3.5" />
              Nova issue
            </button>
            <button
              type="button"
              onClick={() => setPropertiesOpen(true)}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Propriedades do projeto"
              title="Propriedades"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
            <Link
              href={`/projects/${projectId}/automation`}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Automacao do projeto"
              title="Automacao"
            >
              <Cpu className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* Tabs row */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "rounded-md px-2 py-1 text-[12px] font-medium transition-colors",
                  activeTab === tab.key
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content + side panel */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Main content */}
          <div className="flex-1 min-w-0 overflow-auto scrollbar-none">
            {activeTab === "overview" && (
              <OverviewTab
                projectId={projectId}
                project={project}
                isLoading={isLoading}
                issues={issuesList}
                onNewTask={() => setNewIssueOpen(true)}
                canAddMembers={isAdmin}
                onAddMembers={() => setAddMemberOpen(true)}
                canDelete={isAdmin}
                onDeleteProject={() => setDeleteOpen(true)}
              />
            )}
            {activeTab === "activity" && <ActivityTab projectId={projectId} />}
            {activeTab === "issues" && <IssuesTab issues={issuesList} />}
            {activeTab === "members" && (
              <MembersTab
                projectId={projectId}
                canManage={isAdmin}
                onAddMembers={() => setAddMemberOpen(true)}
              />
            )}
          </div>

          {/* Right side panel (Properties) — so em monitor grande (2xl+).
              Em telas menores, PropertiesStrip inline cobre os dados essenciais
              e o kanban (5 colunas) fica com a largura total disponivel. */}
          <aside className="hidden 2xl:flex w-[260px] shrink-0 flex-col border-l border-border overflow-auto">
            <PropertiesPanel project={project} />
            <ActivityPanel projectName={project?.nome} />
          </aside>
        </div>
      </div>

      {/* New issue modal — projeto pre-selecionado */}
      <NewIssueModal
        open={newIssueOpen}
        onOpenChange={setNewIssueOpen}
        defaultProjectId={projectId}
      />

      {/* Properties panel (Sheet right) — edicao inline (ADMIN-only) */}
      <ProjectPropertiesPanel
        open={propertiesOpen}
        onOpenChange={setPropertiesOpen}
        project={project}
      />

      {/* Add member modal — ADMIN-only */}
      <AddProjectMemberModal
        projectId={projectId}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
      />

      {/* Delete project dialog — ADMIN-only.
          Redireciona para /projects apos sucesso (o projeto deixa de existir). */}
      {project && (
        <DeleteProjectDialog
          project={{ chave: project.chave, nome: project.nome }}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onSuccess={() => router.push("/projects")}
        />
      )}
    </PageTransition>
  );
}

// ============================================================
// Overview tab
// ============================================================

// ============================================================
// Kanban Column config
// ============================================================

type KanbanStatus = "inbox" | "ready" | "executing" | "done" | "failed";

interface KanbanColumnConfig {
  status: KanbanStatus;
  label: string;
  headerBg: string;
  headerText: string;
  badgeBg: string;
  badgeText: string;
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    status: "inbox",
    label: "INBOX",
    headerBg: "bg-zinc-100 dark:bg-zinc-800/60",
    headerText: "text-zinc-600 dark:text-zinc-300",
    badgeBg: "bg-zinc-200 dark:bg-zinc-700",
    badgeText: "text-zinc-700 dark:text-zinc-200",
  },
  {
    status: "ready",
    label: "READY",
    headerBg: "bg-blue-50 dark:bg-blue-950/40",
    headerText: "text-blue-700 dark:text-blue-300",
    badgeBg: "bg-blue-100 dark:bg-blue-900/60",
    badgeText: "text-blue-700 dark:text-blue-200",
  },
  {
    status: "executing",
    label: "EXECUTANDO",
    headerBg: "bg-amber-50 dark:bg-amber-950/40",
    headerText: "text-amber-700 dark:text-amber-300",
    badgeBg: "bg-amber-100 dark:bg-amber-900/60",
    badgeText: "text-amber-700 dark:text-amber-200",
  },
  {
    status: "done",
    label: "CONCLUÍDO",
    headerBg: "bg-emerald-50 dark:bg-emerald-950/40",
    headerText: "text-emerald-700 dark:text-emerald-300",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/60",
    badgeText: "text-emerald-700 dark:text-emerald-200",
  },
  {
    status: "failed",
    label: "FALHOU",
    headerBg: "bg-rose-50 dark:bg-rose-950/40",
    headerText: "text-rose-700 dark:text-rose-300",
    badgeBg: "bg-rose-100 dark:bg-rose-900/60",
    badgeText: "text-rose-700 dark:text-rose-200",
  },
];

const PRIORITY_DOT: Record<IntentionPriority, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-zinc-400",
};

const PRIORITY_LABEL: Record<IntentionPriority, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Baixa",
};

const TYPE_CONFIG: Record<
  IntentionType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  feature: { label: "Feature", icon: Sparkles, className: "text-blue-500" },
  bug: { label: "Bug", icon: Bug, className: "text-red-500" },
  improvement: {
    label: "Melhoria",
    icon: TrendingUp,
    className: "text-violet-500",
  },
  review: { label: "Review", icon: Eye, className: "text-amber-500" },
  refactor: { label: "Refactor", icon: Code, className: "text-cyan-500" },
  code: { label: "Codigo", icon: Code, className: "text-slate-500" },
  analysis: {
    label: "Analise",
    icon: HelpCircle,
    className: "text-orange-500",
  },
  documentation: {
    label: "Docs",
    icon: HelpCircle,
    className: "text-teal-500",
  },
  test: { label: "Teste", icon: CheckCheck, className: "text-emerald-500" },
};

const MAX_CARDS_PER_COLUMN = 4;

function shortId(id: string): string {
  // UUID-like: pega so o primeiro segmento; numerico: usa todo
  if (/^\d+$/.test(id)) return id;
  return id.split("-")[0]?.slice(0, 6) ?? id.slice(0, 6);
}

function KanbanCard({
  task,
  projectId,
  isDragging = false,
}: {
  task: IntentionDocument;
  projectId: string;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const typeConfig = TYPE_CONFIG[task.type];
  const TypeIcon = typeConfig?.icon;
  const description = task.problema?.trim();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "rounded-lg bg-background/80 border border-border/60 transition-all select-none",
        isDragging
          ? "opacity-40"
          : "hover:bg-background hover:border-border hover:shadow-sm cursor-grab active:cursor-grabbing",
      )}
    >
      <Link
        href={`/projects/${projectId}/issues/${task.id}`}
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col gap-1.5 p-3"
      >
        {/* Top: id + type */}
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <span className="font-mono text-muted-foreground/80 tabular-nums truncate">
            INT-{shortId(task.id)}
          </span>
          {typeConfig && TypeIcon && (
            <span
              className={cn(
                "flex items-center gap-1 font-semibold shrink-0",
                typeConfig.className,
              )}
              title={typeConfig.label}
            >
              <TypeIcon className="h-3 w-3" />
              {typeConfig.label}
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-[13px] font-medium leading-snug line-clamp-2 text-foreground">
          {task.title}
        </p>

        {/* Description (problema) */}
        {description && (
          <p className="text-[11px] leading-snug line-clamp-2 text-muted-foreground">
            {description}
          </p>
        )}

        {/* Footer: priority + updated time */}
        <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
          {task.priority && (
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  PRIORITY_DOT[task.priority],
                )}
              />
              {PRIORITY_LABEL[task.priority]}
            </span>
          )}
          <span className="tabular-nums">{formatRelative(task.updatedAt)}</span>
        </div>
      </Link>
    </div>
  );
}

function KanbanColumn({
  config,
  tasks,
  projectId,
  onShowMore,
  activeId,
  onNewTask,
}: {
  config: KanbanColumnConfig;
  tasks: IntentionDocument[];
  projectId: string;
  onShowMore: () => void;
  activeId: string | null;
  onNewTask: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: config.status });
  const visible = tasks.slice(0, MAX_CARDS_PER_COLUMN);
  const overflow = tasks.length - MAX_CARDS_PER_COLUMN;

  return (
    <div
      className={cn(
        "flex-1 min-w-0 basis-0 rounded-2xl border overflow-hidden transition-colors",
        config.headerBg,
        isOver ? "border-primary/50 ring-2 ring-primary/20" : "border-border",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span
          className={cn(
            "text-[11px] font-bold tracking-widest uppercase",
            config.headerText,
          )}
        >
          {config.label}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
            config.badgeBg,
            config.badgeText,
          )}
        >
          {tasks.length}
        </span>
      </div>

      {/* Subcards */}
      <div ref={setNodeRef} className="flex flex-col gap-2 px-3 min-h-[40px]">
        {visible.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/40 text-center py-4">
            —
          </p>
        ) : (
          visible.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              projectId={projectId}
              isDragging={activeId === task.id}
            />
          ))
        )}

        {overflow > 0 && (
          <button
            type="button"
            onClick={onShowMore}
            className={cn(
              "text-[11px] font-medium transition-colors text-center py-1 rounded-md hover:bg-background/40",
              config.headerText,
            )}
          >
            + {overflow} mais
          </button>
        )}
      </div>

      {/* Botão nova task */}
      <div className="px-3 py-3">
        <button
          type="button"
          onClick={onNewTask}
          className={cn(
            "flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors",
            "bg-background/50 hover:bg-background/80 border border-dashed border-border/60 hover:border-border",
            config.headerText,
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          Nova task
        </button>
      </div>
    </div>
  );
}

// Mantido como referencia — substituido por <ProjectStatusList /> (lista vertical estilo ClickUp).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _KanbanBoard({
  issues,
  projectId,
  onShowIssues,
  onNewTask,
}: {
  issues: IntentionDocument[];
  projectId: string;
  onShowIssues: () => void;
  onNewTask: () => void;
}) {
  const { move } = useMoveStatus();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const byStatus = (status: KanbanStatus) =>
    issues.filter((i) => i.status === status);

  const activeTask = activeId ? issues.find((i) => i.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const newStatus = over.id as IntentionStatus;
    const task = issues.find((i) => i.id === String(active.id));
    if (!task || task.status === newStatus) return;
    move(String(active.id), newStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-start gap-3 lg:gap-4 2xl:gap-5 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            config={col}
            tasks={byStatus(col.status)}
            projectId={projectId}
            onShowMore={onShowIssues}
            activeId={activeId}
            onNewTask={onNewTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rounded-lg bg-card border border-primary/40 shadow-lg w-[220px] rotate-2 opacity-95">
            <div className="flex flex-col gap-1.5 p-3">
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="font-mono text-muted-foreground/80 tabular-nums truncate">
                  INT-{shortId(activeTask.id)}
                </span>
                {(() => {
                  const c = TYPE_CONFIG[activeTask.type];
                  if (!c) return null;
                  const Icon = c.icon;
                  return (
                    <span
                      className={cn(
                        "flex items-center gap-1 font-semibold shrink-0",
                        c.className,
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {c.label}
                    </span>
                  );
                })()}
              </div>
              <p className="text-[13px] font-medium leading-snug line-clamp-2">
                {activeTask.title}
              </p>
              {activeTask.priority && (
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      PRIORITY_DOT[activeTask.priority],
                    )}
                  />
                  {PRIORITY_LABEL[activeTask.priority]}
                </div>
              )}
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function OverviewTab({
  projectId,
  project,
  isLoading,
  issues,
  onNewTask,
  canAddMembers,
  onAddMembers,
  canDelete,
  onDeleteProject,
}: {
  projectId: string;
  project:
    | {
        nome: string;
        descricao?: string | null;
        dataInicio?: string | null;
        dataFim?: string | null;
      }
    | undefined;
  isLoading: boolean;
  issues: IntentionDocument[];
  onNewTask: () => void;
  canAddMembers: boolean;
  onAddMembers: () => void;
  canDelete: boolean;
  onDeleteProject: () => void;
}) {
  const totalIssues = issues.length;
  const executingCount = issues.filter((i) => i.status === "executing").length;
  const doneCount = issues.filter((i) => i.status === "done").length;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 2xl:px-10">
      <div className="space-y-6 lg:space-y-8">
        {/* Project header */}
        <div className="space-y-3">
          <ProjectIcon nome={project?.nome} size="lg" />
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight">
              {isLoading ? "..." : (project?.nome ?? "Projeto")}
            </h1>
            {(canDelete || canAddMembers) && (
              <div className="flex shrink-0 flex-col items-end gap-2">
                {canDelete && (
                  <button
                    type="button"
                    onClick={onDeleteProject}
                    className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-card px-3 py-1.5 text-[12px] font-medium text-destructive hover:bg-destructive/10 hover:border-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir projeto
                  </button>
                )}
                {canAddMembers && (
                  <button
                    type="button"
                    onClick={onAddMembers}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground/85 hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Adicionar membros
                  </button>
                )}
              </div>
            )}
          </div>
          {project?.descricao && (
            <p className="text-[13px] text-muted-foreground">
              {project.descricao}
            </p>
          )}
        </div>

        {/* Inline properties strip — apenas dados reais */}
        <PropertiesStrip project={project} />

        {/* Métricas rápidas */}
        {totalIssues > 0 && (
          <div className="flex items-center gap-6 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Total</span>
              <span className="text-[15px] font-semibold tabular-nums">
                {totalIssues}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                Em execução
              </span>
              <span className="text-[15px] font-semibold tabular-nums">
                {executingCount}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                Concluídas
              </span>
              <span className="text-[15px] font-semibold tabular-nums">
                {doneCount}
              </span>
            </div>
          </div>
        )}

        {/* Lista por status (estilo ClickUp) */}
        <section className="space-y-1.5">
          <h2 className="text-[12px] font-medium text-muted-foreground">
            Visão do fluxo
          </h2>
          <ProjectStatusList
            issues={issues}
            projectId={projectId}
            onNewTask={onNewTask}
          />
        </section>
      </div>
    </div>
  );
}

function PropertiesStrip({
  project,
}: {
  project?:
    | {
        dataInicio?: string | null;
        dataFim?: string | null;
      }
    | null
    | undefined;
}) {
  const hasDataFim = !!project?.dataFim;
  const hasDataInicio = !!project?.dataInicio;

  if (!hasDataFim && !hasDataInicio) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[12px]">
      <span className="text-muted-foreground mr-1">Propriedades</span>
      {(hasDataInicio || hasDataFim) && (
        <span className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {hasDataInicio && (
            <span>
              {new Date(project!.dataInicio!).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          )}
          {hasDataInicio && hasDataFim && (
            <span className="text-muted-foreground">→</span>
          )}
          {hasDataFim && (
            <span>
              {new Date(project!.dataFim!).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

// ============================================================
// Activity tab
// ============================================================

type ActivityFilter = "all" | "created" | "status" | "deleted";

const CATEGORY_LABEL: Record<ActivityFilter, string> = {
  all: "Tudo",
  created: "Criadas",
  status: "Status",
  deleted: "Excluidas",
};

const CATEGORY_DOT: Record<string, string> = {
  created: "#22c55e",
  status: "#3b82f6",
  deleted: "#ef4444",
  other: "#94a3b8",
};

function ActivityTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useProjectActivity(projectId, { limit: 50 });
  const orgId = useAuthStore((s) => s.user?.orgId);
  const { data: members } = useOrgMembers(orgId);
  const [filter, setFilter] = useState<ActivityFilter>("all");

  // Map<userId, nome> — hidratacao de nome para eventos legados sem userName
  const memberNameById = new Map<string, string>(
    (members ?? [])
      .filter((m) => Boolean(m.id) && Boolean(m.name))
      .map((m) => [m.id, m.name] as [string, string]),
  );

  const events = data?.events ?? [];
  const filtered =
    filter === "all" ? events : events.filter((e) => e.category === filter);

  // Contadores por categoria pra mostrar nos chips
  const counts = events.reduce<Record<ActivityFilter, number>>(
    (acc, e) => {
      acc.all++;
      if (e.category === "created") acc.created++;
      else if (e.category === "status") acc.status++;
      else if (e.category === "deleted") acc.deleted++;
      return acc;
    },
    { all: 0, created: 0, status: 0, deleted: 0 },
  );

  if (isLoading) {
    return (
      <div className="px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16 flex flex-col items-center justify-center text-center">
        <Clock className="h-8 w-8 text-muted-foreground/30 mb-3 animate-pulse" />
        <p className="text-[13px] text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16 flex flex-col items-center justify-center text-center">
        <Clock className="h-8 w-8 text-muted-foreground/30 mb-3" />
        <p className="text-[13px] font-medium text-muted-foreground">
          Nenhuma atividade ainda
        </p>
        <p className="text-[12px] text-muted-foreground/60 mt-1">
          As atualizações deste projeto aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      {/* Filtros */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(Object.keys(CATEGORY_LABEL) as ActivityFilter[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={cn(
              "px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors",
              filter === k
                ? "bg-foreground text-background"
                : "bg-muted/60 text-muted-foreground hover:bg-muted",
            )}
          >
            {CATEGORY_LABEL[k]}
            <span className="ml-1.5 opacity-60 tabular-nums">{counts[k]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-[12px] text-muted-foreground/70 text-center py-8">
          Nenhuma atividade nesta categoria.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((ev) => (
            <li
              key={ev.id}
              className="flex items-start gap-3 rounded-md border border-border/40 bg-card px-3 py-2.5"
            >
              <div
                className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: CATEGORY_DOT[ev.category] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] leading-snug">
                  <span className="font-medium">
                    {ev.actorName ??
                      (ev.actorId && memberNameById.get(ev.actorId)) ??
                      (ev.actorId ? `Usuario #${ev.actorId}` : "Sistema")}
                  </span>{" "}
                  <span className="text-foreground">— {ev.message}</span>
                </p>
                <p className="text-[11px] text-muted-foreground/70 tabular-nums mt-0.5">
                  {formatRelative(ev.timestamp)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================
// Issues tab — reusa visual da /intentions
// ============================================================

function IssuesTab({ issues }: { issues: IntentionDocument[] }) {
  if (issues.length === 0) {
    return (
      <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-12 text-center">
        <CircleDashed className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-[13px] text-muted-foreground">
          Sem issues ainda
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-[40px_70px_28px_minmax(0,1fr)_120px] items-center gap-3 border-b border-border px-4 sm:px-6 lg:px-8 py-2 text-[11px] font-medium text-muted-foreground">
        <div>Pri</div>
        <div>Codigo</div>
        <div></div>
        <div>Titulo</div>
        <div>Atualizado</div>
      </div>
      {issues.map((i) => (
        <div
          key={i.id}
          className="grid grid-cols-[40px_70px_28px_minmax(0,1fr)_120px] items-center gap-3 border-b border-border/40 px-4 sm:px-6 lg:px-8 py-2 text-[13px] hover:bg-accent/30 transition-colors"
        >
          <PriorityIcon priority={i.priority} />
          <span className="text-[12px] text-muted-foreground tabular-nums">
            INT-{i.id}
          </span>
          <StatusIcon status={i.status} />
          <span className="truncate">{i.title}</span>
          <span className="text-[12px] text-muted-foreground">
            {formatRelative(i.updatedAt)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Members tab — gerencia membros do projeto (DVincula -171/-172/-173)
// ============================================================

const PROJECT_ROLE_BADGE: Record<ProjectRole, string> = {
  MANAGER: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  MEMBER: "bg-muted text-foreground/80 border-border",
  VIEWER: "bg-muted/60 text-muted-foreground border-border",
};

const PROJECT_ROLE_LABEL: Record<ProjectRole, string> = {
  MANAGER: "Manager",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

const PROJECT_ROLE_OPTIONS: ProjectRole[] = ["MANAGER", "MEMBER", "VIEWER"];

function MembersTab({
  projectId,
  canManage,
  onAddMembers,
}: {
  projectId: string;
  canManage: boolean;
  onAddMembers: () => void;
}) {
  const { data: members, isLoading } = useProjectMembers(projectId);
  const updateMember = useUpdateProjectMember(projectId);
  const removeMember = useRemoveProjectMember(projectId);

  const list = members ?? [];
  const managerCount = list.filter((m) => m.role === "MANAGER").length;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 2xl:px-10">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            Membros do projeto
            <span className="ml-2 text-[13px] font-normal text-muted-foreground tabular-nums">
              {list.length}
            </span>
          </h2>
          {canManage && (
            <button
              type="button"
              onClick={onAddMembers}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground/85 hover:bg-accent hover:text-foreground transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Adicionar membros
            </button>
          )}
        </div>

        <div>
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_140px_minmax(0,1.5fr)_28px] items-center gap-3 border-b border-border px-3 py-2 text-[11px] font-medium text-muted-foreground">
            <div>Nome</div>
            <div>Email</div>
            <div>Cargo</div>
            <div>Função</div>
            <div></div>
          </div>

          {isLoading ? (
            <div className="px-3 py-10 text-center text-[13px] text-muted-foreground">
              Carregando...
            </div>
          ) : list.length === 0 ? (
            <div className="px-3 py-10 text-center text-[13px] text-muted-foreground">
              Nenhum membro neste projeto ainda.
            </div>
          ) : (
            list.map((m) => (
              <ProjectMemberRow
                key={m.userId}
                member={m}
                canManage={canManage}
                isLastManager={m.role === "MANAGER" && managerCount === 1}
                isUpdating={updateMember.isPending}
                isRemoving={removeMember.isPending}
                onChangeRole={(role) =>
                  updateMember.mutate({
                    userId: m.userId,
                    payload: { role, ...(m.cargo ? { cargo: m.cargo } : {}) },
                  })
                }
                onRemove={() => removeMember.mutate(m.userId)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectMemberRow({
  member,
  canManage,
  isLastManager,
  isUpdating,
  isRemoving,
  onChangeRole,
  onRemove,
}: {
  member: ProjectMember;
  canManage: boolean;
  isLastManager: boolean;
  isUpdating: boolean;
  isRemoving: boolean;
  onChangeRole: (role: ProjectRole) => void;
  onRemove: () => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const initials = (member.nome ?? "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_140px_minmax(0,1.5fr)_28px] items-center gap-3 border-b border-border/40 px-3 py-2 text-[13px] hover:bg-accent/20 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-medium text-white">
            {initials || "?"}
          </span>
          <span className="truncate font-medium">{member.nome}</span>
        </div>

        <span className="truncate text-[12px] text-muted-foreground">
          {member.email ?? "—"}
        </span>

        <ProjectRoleCell
          role={member.role}
          canEdit={canManage && !isLastManager}
          isPending={isUpdating}
          onChange={onChangeRole}
        />

        <span className="truncate text-[12px] text-muted-foreground">
          {member.cargo ?? "—"}
        </span>

        <div>
          {canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  aria-label="Mais opcoes"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="text-[12px] text-destructive focus:text-destructive"
                  disabled={isLastManager}
                  onClick={() => setConfirmRemove(true)}
                >
                  {isLastManager
                    ? "Ultimo Manager (nao pode sair)"
                    : "Remover do projeto"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover do projeto?</DialogTitle>
            <DialogDescription>
              <strong>{member.nome}</strong> perdera acesso a este projeto. A
              conta no workspace continua intacta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRemove(false)}
              className="text-[12px]"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onRemove();
                setConfirmRemove(false);
              }}
              disabled={isRemoving}
              className="text-[12px]"
            >
              {isRemoving ? "Removendo..." : "Sim, remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProjectRoleCell({
  role,
  canEdit,
  isPending,
  onChange,
}: {
  role: ProjectRole;
  canEdit: boolean;
  isPending: boolean;
  onChange: (next: ProjectRole) => void;
}) {
  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium w-fit",
        PROJECT_ROLE_BADGE[role],
      )}
    >
      {PROJECT_ROLE_LABEL[role]}
      {canEdit && <ChevronDown className="h-3 w-3 opacity-70" />}
    </span>
  );

  if (!canEdit) return badge;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Alterar funcao"
          disabled={isPending}
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          {badge}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {PROJECT_ROLE_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt}
            className="text-[12px]"
            disabled={opt === role || isPending}
            onClick={() => onChange(opt)}
          >
            <span
              className={cn(
                "mr-2 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium",
                PROJECT_ROLE_BADGE[opt],
              )}
            >
              {PROJECT_ROLE_LABEL[opt]}
            </span>
            {opt === role && (
              <span className="ml-auto text-[10px] text-muted-foreground">
                atual
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================
// Right side panel
// ============================================================

function PropertiesPanel({
  project,
}: {
  project:
    | {
        nome: string;
        descricao?: string | null;
        dataInicio?: string | null;
        dataFim?: string | null;
        responsavel?: { chave: string; nome: string } | null;
      }
    | undefined;
}) {
  const hasDataInicio = !!project?.dataInicio;
  const hasDataFim = !!project?.dataFim;
  const hasDates = hasDataInicio || hasDataFim;
  const hasResponsavel = !!project?.responsavel?.nome;

  const hasAnyProp = hasDates || hasResponsavel;

  return (
    <section className="border-b border-border px-4 py-4">
      <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground mb-3">
        Propriedades
      </h3>
      {!hasAnyProp ? (
        <p className="text-[11px] text-muted-foreground/60">
          Nenhuma propriedade disponível.
        </p>
      ) : (
        <dl className="space-y-2 text-[12px]">
          {hasResponsavel && (
            <div className="flex items-center gap-2 py-0.5">
              <dt className="w-20 shrink-0 text-muted-foreground">
                Responsável
              </dt>
              <dd className="flex items-center gap-1.5 truncate text-foreground">
                <CircleDashed className="h-3 w-3 shrink-0 text-muted-foreground" />
                {project!.responsavel!.nome}
              </dd>
            </div>
          )}
          {hasDates && (
            <div className="flex items-center gap-2 py-0.5">
              <dt className="w-20 shrink-0 text-muted-foreground">Datas</dt>
              <dd className="flex items-center gap-1 text-foreground">
                <Calendar className="h-3 w-3 shrink-0 text-muted-foreground" />
                {hasDataInicio && (
                  <span>
                    {new Date(project!.dataInicio!).toLocaleDateString(
                      "pt-BR",
                      { day: "2-digit", month: "short" },
                    )}
                  </span>
                )}
                {hasDataInicio && hasDataFim && (
                  <span className="text-muted-foreground">→</span>
                )}
                {hasDataFim && (
                  <span>
                    {new Date(project!.dataFim!).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                )}
              </dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}

function ActivityPanel({ projectName }: { projectName?: string }) {
  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Atividade
        </h3>
      </div>
      <div className="flex items-start gap-2 text-[12px]">
        <CircleDashed className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
        <span className="text-muted-foreground">
          Projeto {projectName ?? ""} criado
        </span>
      </div>
    </section>
  );
}

// ============================================================
// Status / Priority primitives (subset reused from /intentions)
// ============================================================

function PriorityIcon({ priority }: { priority: IntentionPriority }) {
  const map: Record<IntentionPriority, { bg: string; symbol: string }> = {
    urgent: { bg: "bg-red-500", symbol: "!" },
    high: { bg: "bg-orange-500", symbol: "▲" },
    medium: { bg: "bg-amber-500", symbol: "=" },
    low: { bg: "bg-zinc-500", symbol: "▽" },
  };
  const c = map[priority] ?? map.medium;
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

function StatusIcon({ status }: { status: IntentionStatus }) {
  const isDone = status === "done";
  if (isDone) {
    return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />;
  }
  return (
    <CircleDashed className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
  );
}

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
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

"use client";

import {
  Plus,
  MoreHorizontal,
  Cpu,
  Trash2,
  CheckSquare,
  Calendar,
  FolderOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useProjects } from "@/lib/hooks/use-projects";
import { NewProjectModal } from "@/components/projects/new-project-modal";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";

// Paleta de cores para ícone do projeto (baseada na inicial)
const PROJECT_COLORS = [
  { bg: "bg-blue-500", text: "text-white" },
  { bg: "bg-violet-500", text: "text-white" },
  { bg: "bg-emerald-500", text: "text-white" },
  { bg: "bg-amber-500", text: "text-white" },
  { bg: "bg-rose-500", text: "text-white" },
  { bg: "bg-cyan-500", text: "text-white" },
];

function getProjectColor(nome: string) {
  const idx = nome.charCodeAt(0) % PROJECT_COLORS.length;
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
  const idx = nome.charCodeAt(0) % AVATAR_COLORS.length;
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
    className:
      "bg-muted text-muted-foreground",
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
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{
    chave: string;
    nome: string;
  } | null>(null);
  const userRole = useAuthStore((s) => s.user?.role);
  const isAdmin = userRole?.toUpperCase() === "ADMIN";

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        {/* Page header */}
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-8">
          <h1 className="text-[13px] font-medium">Projetos</h1>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setNewProjectOpen(true)}
                className="flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-[12px] font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Plus className="h-3 w-3" />
                Novo Projeto
              </button>
            )}
            {!isAdmin && (
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
        <div className="flex-1 overflow-auto p-8">
          {isLoading ? (
            <SkeletonCards />
          ) : !projects?.length ? (
            <EmptyState onCreate={() => setNewProjectOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard
                  key={p.chave}
                  project={p}
                  onClick={() => router.push(`/projects/${p.chave}`)}
                  onAutomation={() =>
                    router.push(`/projects/${p.chave}/automation`)
                  }
                  onDelete={
                    isAdmin
                      ? () =>
                          setProjectToDelete({ chave: p.chave, nome: p.nome })
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>

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

function ProjectCard({
  project,
  onClick,
  onAutomation,
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
  onClick: () => void;
  onAutomation: () => void;
  onDelete?: () => void;
}) {
  const color = getProjectColor(project.nome);
  const initial = project.nome.charAt(0).toUpperCase();

  const statusKey = project.status ?? "active";
  const statusConfig = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.active;

  const targetDate = project.dataFim ? formatTargetDate(project.dataFim) : null;

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

      {/* Divider */}
      <div className="mx-4 border-t border-border/60" />

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 p-4 pt-3">
        {/* Esquerda: status + data */}
        <div className="flex items-center gap-2 min-w-0">
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
        </div>

        {/* Direita: avatar + task count */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Task count */}
          {typeof project.taskCount === "number" && project.taskCount > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CheckSquare className="h-3 w-3" />
              <span className="tabular-nums">{project.taskCount}</span>
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
    <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <FolderOpen className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-medium">Nenhum projeto ainda</h3>
      <p className="mt-1 text-[12px] text-muted-foreground max-w-xs">
        Crie seu primeiro projeto para começar a organizar as intenções da sua equipe.
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

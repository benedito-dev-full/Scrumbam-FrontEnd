"use client";

import { useRouter } from "next/navigation";
import { Box } from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useTeamStore } from "@/lib/stores/team-store";
import { useTeam, useMyTeams } from "@/lib/hooks/use-teams";
import { useTeamProjects } from "@/lib/hooks/use-projects";
import { cn } from "@/lib/utils";

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

export default function TeamProjectsPage() {
  usePageTitle("Time — Projetos");
  const router = useRouter();
  const selectedTeamId = useTeamStore((s) => s.selectedTeamId);
  const { isLoading: teamsLoading } = useMyTeams();
  const { data: team } = useTeam(selectedTeamId);
  const { data: projects, isLoading: projectsLoading } =
    useTeamProjects(selectedTeamId);

  const showLoading = teamsLoading || (!!selectedTeamId && projectsLoading);

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-8">
          <div className="flex items-center gap-2">
            <h1 className="text-[13px] font-medium">Projetos</h1>
            {team && (
              <span className="text-[12px] text-muted-foreground">
                · {team.name}
              </span>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {!selectedTeamId && !teamsLoading ? (
            <EmptyTeamState />
          ) : showLoading ? (
            <SkeletonGrid />
          ) : !projects || projects.length === 0 ? (
            <EmptyProjectsState />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard
                  key={p.chave}
                  project={p}
                  onClick={() => router.push(`/projects/${p.chave}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

function ProjectCard({
  project,
  onClick,
}: {
  project: {
    chave: string;
    nome: string;
    descricao?: string | null;
    taskCount?: number;
  };
  onClick: () => void;
}) {
  const color = getProjectColor(project.nome);
  const initial = project.nome.charAt(0).toUpperCase();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={cn(
        "group rounded-xl border border-border bg-card p-4",
        "hover:border-primary/30 hover:shadow-md",
        "transition-all duration-200 cursor-pointer",
      )}
      aria-label={`Abrir projeto ${project.nome}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[14px] font-semibold",
            color.bg,
            color.text,
          )}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-foreground">
            {project.nome}
          </p>
          {project.descricao && (
            <p className="truncate text-[11px] text-muted-foreground">
              {project.descricao}
            </p>
          )}
        </div>
      </div>
      {project.taskCount !== undefined && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          {project.taskCount}{" "}
          {project.taskCount === 1 ? "intencao" : "intencoes"}
        </p>
      )}
    </div>
  );
}

function EmptyTeamState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
        <Box className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-[14px] font-medium">Selecione um time</p>
      <p className="max-w-md text-[12px] text-muted-foreground">
        Escolha um time na barra lateral para ver os projetos vinculados.
      </p>
    </div>
  );
}

function EmptyProjectsState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
        <Box className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-[14px] font-medium">Nenhum projeto neste time</p>
      <p className="max-w-md text-[12px] text-muted-foreground">
        Crie um projeto em /projects e vincule-o a este time no momento da
        criacao.
      </p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

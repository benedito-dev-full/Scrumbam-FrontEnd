"use client";

import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { Box, CircleDot, Star } from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { IntentionListItem } from "@/components/intentions/intention-list-item";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { usePreference } from "@/lib/hooks/use-preference";
import { useTeamStore } from "@/lib/stores/team-store";
import { useTeam, useMyTeams } from "@/lib/hooks/use-teams";
import { useTeamProjects } from "@/lib/hooks/use-projects";
import { intentionsApi } from "@/lib/api/intentions";
import { QUERY_KEYS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { IntentionDocument } from "@/types/intention";

const TEAM_FALLBACK_COLOR = "#64748b";

export default function TeamIssuesPage() {
  usePageTitle("Time — Issues");
  const selectedTeamId = useTeamStore((s) => s.selectedTeamId);
  const { isLoading: teamsLoading } = useMyTeams();
  const { data: team } = useTeam(selectedTeamId);
  const { data: projects, isLoading: projectsLoading } =
    useTeamProjects(selectedTeamId);
  const [favorited, setFavorited] = usePreference(
    `favorite.team-issues.${selectedTeamId ?? "none"}`,
    false,
  );

  // Busca intencoes em paralelo para todos os projetos do time
  const projectIds = (projects ?? []).map((p) => p.chave).filter(Boolean);
  const intentionQueries = useQueries({
    queries: projectIds.map((pid) => ({
      queryKey: QUERY_KEYS.intentions.list(pid),
      queryFn: () => intentionsApi.list(pid),
      staleTime: 30_000,
      enabled: projectIds.length > 0,
    })),
  });

  const isLoading =
    teamsLoading ||
    projectsLoading ||
    intentionQueries.some((q) => q.isLoading);

  // Agrupa por projeto: [{ project, intentions }]
  const groups = (projects ?? [])
    .map((p, idx) => ({
      project: p,
      intentions: (intentionQueries[idx]?.data ?? []) as IntentionDocument[],
    }))
    .filter((g) => g.intentions.length > 0);

  const totalIntentions = groups.reduce(
    (sum, g) => sum + g.intentions.length,
    0,
  );

  return (
    <PageTransition className="h-full">
      <div className="flex h-full flex-col">
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-8">
          <div className="flex items-center gap-2">
            {team && (
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                style={{ backgroundColor: team.color || TEAM_FALLBACK_COLOR }}
                title={team.name}
              >
                {team.name.charAt(0).toUpperCase()}
              </span>
            )}
            <h1 className="text-[13px] font-medium">Issues</h1>
            {team && (
              <button
                type="button"
                onClick={() => setFavorited(!favorited)}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded transition-colors",
                  favorited
                    ? "text-yellow-400 hover:bg-accent"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
                aria-label={
                  favorited
                    ? "Remover dos favoritos"
                    : "Adicionar aos favoritos"
                }
                aria-pressed={favorited}
                title={
                  favorited
                    ? "Remover dos favoritos"
                    : "Adicionar aos favoritos"
                }
              >
                <Star
                  className={cn("h-3.5 w-3.5", favorited && "fill-yellow-400")}
                />
              </button>
            )}
            {team && totalIntentions > 0 && (
              <span className="ml-1 text-[12px] text-muted-foreground">
                {totalIntentions} ativas
              </span>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl p-8">
            {!selectedTeamId && !teamsLoading ? (
              <EmptyTeamState />
            ) : isLoading ? (
              <SkeletonList />
            ) : !projects || projects.length === 0 ? (
              <EmptyProjectsState />
            ) : groups.length === 0 ? (
              <EmptyIntentionsState />
            ) : (
              <div className="space-y-6">
                {groups.map((g) => (
                  <ProjectGroup
                    key={g.project.chave}
                    projectId={g.project.chave}
                    projectName={g.project.nome}
                    intentions={g.intentions}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function ProjectGroup({
  projectId,
  projectName,
  intentions,
}: {
  projectId: string;
  projectName: string;
  intentions: IntentionDocument[];
}) {
  return (
    <section>
      <header className="mb-2 flex items-center justify-between">
        <Link
          href={`/projects/${projectId}`}
          className="flex items-center gap-2 text-[13px] font-medium text-foreground hover:underline"
        >
          <Box className="h-3.5 w-3.5 text-muted-foreground" />
          {projectName}
          <span className="text-[11px] text-muted-foreground">
            ({intentions.length})
          </span>
        </Link>
      </header>
      <ul className="space-y-1.5">
        {intentions.map((intention) => (
          <li key={intention.id}>
            <IntentionListItem intention={intention} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyTeamState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
        <CircleDot className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-[14px] font-medium">Selecione um time</p>
      <p className="max-w-md text-[12px] text-muted-foreground">
        Escolha um time na barra lateral para ver as issues dos projetos
        vinculados.
      </p>
    </div>
  );
}

function EmptyProjectsState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
        <Box className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-[14px] font-medium">Nenhum projeto neste time</p>
      <p className="max-w-md text-[12px] text-muted-foreground">
        Vincule projetos a este time para ver as issues aqui.
      </p>
    </div>
  );
}

function EmptyIntentionsState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
        <CircleDot className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-[14px] font-medium">Nenhuma issue ativa</p>
      <p className="max-w-md text-[12px] text-muted-foreground">
        Os projetos deste time ainda nao tem intencoes registradas.
      </p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

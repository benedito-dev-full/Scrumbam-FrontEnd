"use client";

import { useMemo, useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useAuth } from "@/lib/hooks/use-auth";
import { useMyTeams, useTeamMembers } from "@/lib/hooks/use-teams";
import { useProjects } from "@/lib/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TeamFormDialog } from "@/components/teams/team-form-dialog";
import { DeleteTeamDialog } from "@/components/teams/delete-team-dialog";
import { TeamMembersDialog } from "@/components/teams/team-members-dialog";
import { TeamBadge } from "@/components/teams/team-badge";
import { cn } from "@/lib/utils";
import type { Team, TeamMember } from "@/types/team";

/**
 * Lista de times do workspace — estilo Discord roles.
 *
 * Cards verticais (nao tabela seca). Cada card tem:
 *  - Acento lateral com a cor do time (faixa fina a esquerda).
 *  - Badge grande (icone + cor) puxando o olho pra identidade do time.
 *  - Nome + sigla + descritivo "X membros, Y projetos".
 *  - Stack de avatares dos primeiros membros + acoes ao final.
 *
 * Backend nao expoe Agentes/Regras/Atividade-recente por time, entao essas
 * dimensoes foram droppadas em vez de virar colunas de "—" decorativas.
 */
export default function TeamsPage() {
  usePageTitle("Times");
  const { user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  const { data: teams, isLoading: teamsLoading } = useMyTeams();
  const { data: projects } = useProjects();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);
  const [membersTeam, setMembersTeam] = useState<Team | null>(null);

  const sortedTeams = useMemo(
    () => [...(teams ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [teams],
  );

  const projectsCountByTeam = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of projects ?? []) {
      if (!p.teamId) continue;
      map.set(p.teamId, (map.get(p.teamId) ?? 0) + 1);
    }
    return map;
  }, [projects]);

  const teamsWithoutIcon = sortedTeams.filter((t) => !t.icon).length;

  return (
    <PageTransition>
      <div className="px-8 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Times</h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Times de funcao da equipe — Dev, Design, Marketing, Copy...
                cada time tem sua cor e icone proprios.
              </p>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="h-9 px-4 text-[13px]"
              >
                <Plus className="mr-1 h-4 w-4" />
                Novo time
              </Button>
            )}
          </div>

          {/* Banner: incentivar a editar times sem icone */}
          {isAdmin && !teamsLoading && teamsWithoutIcon > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-[13px]">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div className="flex-1">
                <p className="font-medium text-amber-200/90">
                  {teamsWithoutIcon === 1
                    ? "1 time sem icone"
                    : `${teamsWithoutIcon} times sem icone`}
                </p>
                <p className="mt-0.5 text-[12px] text-amber-200/60">
                  Adicione um icone (Code, Megaphone, Palette...) pra reforcar
                  a identidade de funcao de cada time. Edite o time e escolha
                  na galeria.
                </p>
              </div>
            </div>
          )}

          {/* Cards */}
          {teamsLoading ? (
            <CardSkeletons />
          ) : sortedTeams.length === 0 ? (
            <EmptyState isAdmin={isAdmin} onCreate={() => setCreateOpen(true)} />
          ) : (
            <ul className="space-y-2">
              {sortedTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  projectsCount={projectsCountByTeam.get(team.id) ?? 0}
                  onEdit={() => setEditTeam(team)}
                  onManageMembers={() => setMembersTeam(team)}
                  onDelete={() => setDeleteTeam(team)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <TeamFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <TeamFormDialog
        team={editTeam}
        open={!!editTeam}
        onOpenChange={(o) => !o && setEditTeam(null)}
      />
      {deleteTeam && (
        <DeleteTeamDialog
          team={deleteTeam}
          open={!!deleteTeam}
          onOpenChange={(o) => !o && setDeleteTeam(null)}
        />
      )}
      {membersTeam && (
        <TeamMembersDialog
          team={membersTeam}
          open={!!membersTeam}
          onOpenChange={(o) => !o && setMembersTeam(null)}
        />
      )}
    </PageTransition>
  );
}

// ============================================================
// Empty state
// ============================================================

const SUGGESTED_TEAMS = ["Desenvolvimento", "Design", "Marketing", "Copy", "Operacoes", "QA"];

function EmptyState({
  isAdmin,
  onCreate,
}: {
  isAdmin: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/30 px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Users className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-[15px] font-semibold">
        Voce ainda nao participa de nenhum time
      </h2>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Comece criando times pelas funcoes da sua equipe.
      </p>
      {isAdmin && (
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {SUGGESTED_TEAMS.map((label) => (
            <span
              key={label}
              className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      )}
      {isAdmin && (
        <Button size="sm" onClick={onCreate} className="mt-5 text-[13px]">
          <Plus className="mr-1 h-4 w-4" />
          Criar primeiro time
        </Button>
      )}
    </div>
  );
}

// ============================================================
// Team card
// ============================================================

interface TeamCardProps {
  team: Team;
  projectsCount: number;
  onEdit: () => void;
  onManageMembers: () => void;
  onDelete: () => void;
}

function TeamCard({
  team,
  projectsCount,
  onEdit,
  onManageMembers,
  onDelete,
}: TeamCardProps) {
  const accent = team.color || "#64748b";

  return (
    <li>
      <div className="group relative flex items-center gap-4 overflow-hidden rounded-lg border border-border bg-card/40 px-4 py-3.5 transition-colors hover:bg-accent/20">
        {/* Faixa de acento lateral com cor do time */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: accent }}
        />

        <TeamBadge
          name={team.name}
          color={team.color}
          icon={team.icon}
          size="lg"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[14px] font-medium">{team.name}</p>
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {team.key}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            <span className="tabular-nums">{team.memberCount}</span>
            {" "}
            {team.memberCount === 1 ? "membro" : "membros"}
            <span className="mx-1.5 text-muted-foreground/50">·</span>
            <span className="tabular-nums">{projectsCount}</span>
            {" "}
            {projectsCount === 1 ? "projeto" : "projetos"}
          </p>
        </div>

        <MemberAvatars teamId={team.id} memberCount={team.memberCount} />

        {(team.canEdit || team.canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                aria-label={`Acoes do time ${team.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {team.canEdit && (
                <>
                  <DropdownMenuItem onSelect={onEdit} className="text-[12px]">
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={onManageMembers}
                    className="text-[12px]"
                  >
                    <Users className="mr-2 h-3.5 w-3.5" />
                    Gerenciar membros
                  </DropdownMenuItem>
                </>
              )}
              {team.canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={onDelete}
                    className="text-[12px] text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </li>
  );
}

// ============================================================
// Member avatars stack
// ============================================================

const AVATAR_PALETTE = [
  "bg-amber-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-lime-500",
];

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function MemberAvatars({
  teamId,
  memberCount,
}: {
  teamId: string;
  memberCount: number;
}) {
  const { data: members, isLoading } = useTeamMembers(teamId);

  if (memberCount === 0) {
    return (
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground/50">
        sem membros
      </span>
    );
  }

  if (isLoading) {
    return (
      <div className="flex -space-x-1.5">
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            className="h-6 w-6 rounded-full border-2 border-card"
          />
        ))}
      </div>
    );
  }

  const list = members ?? [];
  const visible = list.slice(0, 4);
  const extra = Math.max(0, memberCount - visible.length);

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1.5">
        {visible.map((m) => (
          <MemberCircle key={m.userId} member={m} />
        ))}
      </div>
      {extra > 0 && (
        <span className="text-[12px] text-muted-foreground tabular-nums">
          +{extra}
        </span>
      )}
    </div>
  );
}

function MemberCircle({ member }: { member: TeamMember }) {
  const initial = (member.name || "?").trim().charAt(0).toUpperCase();
  const colorClass = colorFor(member.userId || member.name || "");
  return (
    <span
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[10px] font-semibold text-white",
        colorClass,
      )}
      title={member.name}
    >
      {initial}
    </span>
  );
}

// ============================================================
// Skeletons
// ============================================================

function CardSkeletons() {
  return (
    <ul className="space-y-2">
      {[1, 2, 3].map((i) => (
        <li
          key={i}
          className="flex items-center gap-4 rounded-lg border border-border bg-card/40 px-4 py-3.5"
        >
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2.5 w-48" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

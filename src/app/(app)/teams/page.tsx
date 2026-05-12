"use client";

import { useMemo, useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Plus,
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

const GRID =
  "grid grid-cols-[minmax(0,2fr)_180px_90px_90px_140px_140px_32px] items-center gap-3";

/**
 * Lista de times do workspace — estilo ClickUp.
 *
 * Colunas:
 *  - Time (avatar colorido + nome + key).
 *  - Membros (stack de avatares + "+N").
 *  - Projetos (derivado de useProjects filtrado por teamId).
 *  - Agentes / Regras de automação / Atividade recente: backend ainda nao
 *    expoe agregados por time, entao renderiza "—" sem inventar dados.
 *
 * As operacoes destrutivas/dialogs reaproveitam os mesmos componentes da
 * pagina de settings (/settings/workspace/teams).
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

  return (
    <PageTransition>
      <div className="px-8 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Times</h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Times de funcao da equipe — Dev, Design, Marketing, Copy...
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

          {/* Table card */}
          <section className="overflow-hidden rounded-xl border border-border bg-card/40">
            <div
              className={cn(
                GRID,
                "border-b border-border px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
              )}
            >
              <div>Time</div>
              <div>Membros</div>
              <div>Projetos</div>
              <div>Agentes</div>
              <div>Regras de automacao</div>
              <div>Atividade recente</div>
              <div />
            </div>

            {teamsLoading ? (
              <TeamSkeletonRows />
            ) : sortedTeams.length === 0 ? (
              <div className="px-4 py-16 text-center text-[13px] text-muted-foreground space-y-2">
                <p>Voce ainda nao participa de nenhum time.</p>
                {isAdmin && (
                  <p className="text-muted-foreground/80">
                    Crie o primeiro — ex: Desenvolvimento, Marketing, Design, Copy.
                  </p>
                )}
              </div>
            ) : (
              sortedTeams.map((team) => (
                <TeamRow
                  key={team.id}
                  team={team}
                  projectsCount={projectsCountByTeam.get(team.id) ?? 0}
                  onEdit={() => setEditTeam(team)}
                  onManageMembers={() => setMembersTeam(team)}
                  onDelete={() => setDeleteTeam(team)}
                />
              ))
            )}
          </section>
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
// Team row
// ============================================================

interface TeamRowProps {
  team: Team;
  projectsCount: number;
  onEdit: () => void;
  onManageMembers: () => void;
  onDelete: () => void;
}

function TeamRow({
  team,
  projectsCount,
  onEdit,
  onManageMembers,
  onDelete,
}: TeamRowProps) {
  return (
    <div
      className={cn(
        GRID,
        "border-b border-border/40 px-4 py-3 text-[13px] transition-colors last:border-b-0 hover:bg-accent/20",
      )}
    >
      {/* Time */}
      <div className="flex min-w-0 items-center gap-3">
        <TeamBadge
          name={team.name}
          color={team.color}
          icon={team.icon}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium">{team.name}</p>
          <p className="truncate text-[12px] text-muted-foreground">
            <span className="font-mono uppercase tracking-wide">
              {team.key}
            </span>
            <span className="mx-1.5 text-muted-foreground/50">·</span>
            prefixo das issues
          </p>
        </div>
      </div>

      {/* Membros */}
      <MemberAvatars teamId={team.id} memberCount={team.memberCount} />

      {/* Projetos */}
      <span className="tabular-nums text-foreground/90">{projectsCount}</span>

      {/* Agentes (sem dado agregado no backend) */}
      <span className="tabular-nums text-muted-foreground/70">—</span>

      {/* Regras de automacao */}
      <span className="text-muted-foreground/70">—</span>

      {/* Atividade recente */}
      <span className="text-muted-foreground/70">—</span>

      {/* Acoes */}
      <div>
        {(team.canEdit || team.canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
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
    </div>
  );
}

// ============================================================
// Member avatars
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

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex -space-x-1.5">
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              className="h-6 w-6 rounded-full border-2 border-card"
            />
          ))}
        </div>
      </div>
    );
  }

  const list = members ?? [];
  const visible = list.slice(0, 4);
  const extra = Math.max(0, (members?.length ?? memberCount) - visible.length);

  if (list.length === 0) {
    return <span className="text-[12px] text-muted-foreground/70">—</span>;
  }

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

function TeamSkeletonRows() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            GRID,
            "border-b border-border/40 px-4 py-3 last:border-b-0",
          )}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2.5 w-44" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-3 w-16" />
          <div />
        </div>
      ))}
    </>
  );
}

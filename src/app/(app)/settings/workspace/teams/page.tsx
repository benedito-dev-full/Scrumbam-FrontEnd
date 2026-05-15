"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useAuth } from "@/lib/hooks/use-auth";
import { useMyTeams, useTeamMembers } from "@/lib/hooks/use-teams";
import { useTeamStore } from "@/lib/stores/team-store";
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
import type { Team, TeamMember, TeamMemberRole } from "@/types/team";

/**
 * Pagina de gestao de times do workspace.
 *
 * Master-detail:
 *  - lista todos os times do usuario logado;
 *  - selecionando um, mostra seus membros abaixo (somente leitura);
 *  - acoes (criar/editar/remover time, gerenciar membros) sao delegadas aos
 *    dialogs existentes (`TeamFormDialog`, `DeleteTeamDialog`, `TeamMembersDialog`).
 *
 * RBAC: backend ja entrega `canEdit`/`canDelete` por time — frontend so renderiza.
 */
export default function TeamsSettingsPage() {
  usePageTitle("Times");
  const { user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  const { data: teams, isLoading: teamsLoading } = useMyTeams();
  const selectedTeamId = useTeamStore((s) => s.selectedTeamId);
  const setSelectedTeam = useTeamStore((s) => s.setSelectedTeam);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);
  const [membersTeam, setMembersTeam] = useState<Team | null>(null);

  const sortedTeams = useMemo(
    () => [...(teams ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [teams],
  );

  // Auto-seleciona primeiro time se nenhum esta selecionado (ou o selecionado
  // sumiu da lista por exclusao/perda de acesso).
  useEffect(() => {
    if (!sortedTeams.length) return;
    const exists = sortedTeams.some((t) => t.id === selectedTeamId);
    if (!selectedTeamId || !exists) {
      setSelectedTeam(sortedTeams[0].id);
    }
  }, [sortedTeams, selectedTeamId, setSelectedTeam]);

  const selectedTeam = sortedTeams.find((t) => t.id === selectedTeamId) ?? null;

  return (
    <PageTransition>
      <div className="px-4 sm:px-8 py-4 sm:py-8">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Times</h1>
              <p className="text-[13px] text-muted-foreground mt-1">
                Times de funcao — agrupe a equipe por especialidade (Dev,
                Design, Marketing, Copy...).
              </p>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="text-[12px] h-8"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Novo time
              </Button>
            )}
          </div>

          {/* Teams table */}
          <section>
            <div className="grid grid-cols-[minmax(0,2fr)_100px_120px_28px] items-center gap-3 border-b border-border px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <div>Time</div>
              <div>Membros</div>
              <div>Criado em</div>
              <div></div>
            </div>

            {teamsLoading ? (
              <TeamSkeletonRows />
            ) : sortedTeams.length === 0 ? (
              <div className="px-3 py-12 text-center text-[13px] text-muted-foreground space-y-2">
                <p>Voce ainda nao participa de nenhum time.</p>
                {isAdmin && (
                  <p className="text-muted-foreground/80">
                    Comece criando times como Desenvolvimento, Marketing, Design
                    ou Copy.
                  </p>
                )}
              </div>
            ) : (
              sortedTeams.map((team) => (
                <TeamRow
                  key={team.id}
                  team={team}
                  selected={team.id === selectedTeamId}
                  onSelect={() => setSelectedTeam(team.id)}
                  onEdit={() => setEditTeam(team)}
                  onManageMembers={() => setMembersTeam(team)}
                  onDelete={() => setDeleteTeam(team)}
                />
              ))
            )}
          </section>

          {/* Members do time selecionado */}
          {selectedTeam && (
            <MembersSection
              team={selectedTeam}
              onManage={() => setMembersTeam(selectedTeam)}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <TeamFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={(t) => setSelectedTeam(t.id)}
      />
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
          onSuccess={() => {
            if (deleteTeam.id === selectedTeamId) setSelectedTeam(null);
          }}
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
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onManageMembers: () => void;
  onDelete: () => void;
}

function TeamRow({
  team,
  selected,
  onSelect,
  onEdit,
  onManageMembers,
  onDelete,
}: TeamRowProps) {
  const created = new Date(team.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,2fr)_100px_120px_28px] items-center gap-3 border-b border-border/40 px-3 py-2.5 text-[13px] transition-colors",
        selected ? "bg-sidebar-accent/40" : "hover:bg-accent/30",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 items-center gap-2 text-left"
        aria-pressed={selected}
        aria-label={`Selecionar time ${team.name}`}
      >
        <TeamBadge name={team.name} color={team.color} icon={team.icon} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{team.name}</p>
          <p className="truncate text-[11px] text-muted-foreground font-mono uppercase tracking-wide">
            {team.key}
          </p>
        </div>
      </button>

      <span className="text-[12px] text-muted-foreground tabular-nums">
        {team.memberCount}
      </span>

      <span className="text-[12px] text-muted-foreground">{created}</span>

      <div>
        {(team.canEdit || team.canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label={`Acoes do time ${team.name}`}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
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
// Members section (read-only)
// ============================================================

function MembersSection({
  team,
  onManage,
}: {
  team: Team;
  onManage: () => void;
}) {
  const { data: members, isLoading } = useTeamMembers(team.id);

  return (
    <section>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Membros do time {team.name}</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {team.memberCount} {team.memberCount === 1 ? "membro" : "membros"}
          </p>
        </div>
        {team.canEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={onManage}
            className="text-[12px] h-8"
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Gerenciar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,2fr)_120px_100px] items-center gap-3 border-b border-border px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <div>Pessoa</div>
        <div>Papel</div>
        <div>Entrou em</div>
      </div>

      {isLoading ? (
        <MemberSkeletonRows />
      ) : !members?.length ? (
        <div className="px-3 py-8 text-center text-[13px] text-muted-foreground">
          Sem membros neste time.
        </div>
      ) : (
        members.map((m) => <MemberRow key={m.userId} member={m} />)
      )}
    </section>
  );
}

function MemberRow({ member }: { member: TeamMember }) {
  const initials = member.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const joined = member.joinedAt
    ? new Date(member.joinedAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="grid grid-cols-[minmax(0,2fr)_120px_100px] items-center gap-3 border-b border-border/40 px-3 py-2 text-[13px] transition-colors hover:bg-accent/30">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-medium text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{member.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {member.email ?? "—"}
          </p>
        </div>
      </div>
      <CargoBadge cargo={member.cargo} />
      <span className="text-[12px] text-muted-foreground">{joined}</span>
    </div>
  );
}

function CargoBadge({ cargo }: { cargo: TeamMemberRole }) {
  // Backend retorna LEAD/MEMBER; types antigos tinham ADMIN/MEMBER/VIEWER.
  // Tratamos os casos conhecidos.
  const config: Record<string, string> = {
    LEAD: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    ADMIN: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    MEMBER: "bg-muted text-foreground/80 border-border",
    VIEWER: "bg-muted/60 text-muted-foreground border-border",
  };
  const labelMap: Record<string, string> = {
    LEAD: "Lead",
    ADMIN: "Admin",
    MEMBER: "Member",
    VIEWER: "Viewer",
  };
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
        config[cargo] ?? config.MEMBER,
      )}
    >
      {labelMap[cargo] ?? cargo}
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
          className="grid grid-cols-[minmax(0,2fr)_100px_120px_28px] items-center gap-3 border-b border-border/40 px-3 py-2.5"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-20" />
          <div />
        </div>
      ))}
    </>
  );
}

function MemberSkeletonRows() {
  return (
    <>
      {[1, 2].map((i) => (
        <div
          key={i}
          className="grid grid-cols-[minmax(0,2fr)_120px_100px] items-center gap-3 border-b border-border/40 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-2 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </>
  );
}

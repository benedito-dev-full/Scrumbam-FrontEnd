"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  CircleDot,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMyTeams } from "@/lib/hooks/use-teams";
import { useTeamStore } from "@/lib/stores/team-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { isNavItemActive } from "@/lib/navigation";
import type { Team } from "@/types/team";
import { TeamFormDialog } from "./team-form-dialog";
import { DeleteTeamDialog } from "./delete-team-dialog";
import { TeamMembersDialog } from "./team-members-dialog";

const FALLBACK_COLOR = "#64748b";

type SubItem = {
  href: string;
  label: string;
  icon: typeof CircleDot;
  comingSoon?: boolean;
};

const subItems: SubItem[] = [
  { href: "/team/issues", label: "Issues", icon: CircleDot },
  { href: "/team/projects", label: "Projetos", icon: Box },
  { href: "/team/views", label: "Views", icon: Layers, comingSoon: true },
];

/**
 * Substitui o bloco hardcoded "Devari Tecnologia" da `app-sidebar`.
 *
 * Comportamento:
 *  - Lista todos os times onde o usuario logado e membro.
 *  - Time selecionado destacado com `bg-sidebar-accent`.
 *  - Subitens (Issues, Projetos, Views) aparecem para o time selecionado.
 *  - Botao "+" no header (ADMIN da org) abre dialog de criar.
 *  - Menu "..." por time (apenas para times com canEdit/canDelete) com:
 *    Editar, Membros, Deletar.
 */
export function TeamSelectorSidebar() {
  const pathname = usePathname();
  const { data: teams, isLoading } = useMyTeams();
  const selectedTeamId = useTeamStore((s) => s.selectedTeamId);
  const setSelectedTeam = useTeamStore((s) => s.setSelectedTeam);
  const userRole = useAuthStore((s) => s.user?.role);
  const isAdmin = userRole?.toUpperCase() === "ADMIN";

  // Dialogs state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);
  const [membersTeam, setMembersTeam] = useState<Team | null>(null);

  const sortedTeams = useMemo(
    () => [...(teams ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [teams],
  );

  // Auto-select primeiro time se nenhum esta selecionado, ou se o
  // selecionado nao existe mais na lista (perdeu acesso).
  useEffect(() => {
    if (!sortedTeams.length) {
      if (selectedTeamId) setSelectedTeam(null);
      return;
    }
    const exists = sortedTeams.some((t) => t.id === selectedTeamId);
    if (!exists) {
      setSelectedTeam(sortedTeams[0].id);
    }
  }, [sortedTeams, selectedTeamId, setSelectedTeam]);

  return (
    <div className="mt-3">
      {/* Header */}
      <div className="flex items-center gap-1 px-2 py-1">
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Seus times
        </span>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            aria-label="Novo time"
            title="Novo time"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-1 px-2">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-3/4" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && sortedTeams.length === 0 && (
        <div className="px-2 py-2 text-[12px] text-muted-foreground">
          Voce nao e membro de nenhum time.
        </div>
      )}

      {/* Lista de times */}
      {!isLoading && sortedTeams.length > 0 && (
        <ul className="space-y-px px-2">
          {sortedTeams.map((team) => {
            const selected = team.id === selectedTeamId;
            const initial = team.name.charAt(0).toUpperCase();
            const color = team.color || FALLBACK_COLOR;
            return (
              <li key={team.id}>
                <div
                  className={cn(
                    "group flex items-center gap-2 rounded-md px-2 py-1 transition-colors",
                    selected
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-foreground/85 hover:bg-sidebar-accent/70",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedTeam(team.id)}
                    className="flex flex-1 min-w-0 items-center gap-2 text-left"
                    aria-label={`Selecionar time ${team.name}`}
                    aria-pressed={selected}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {initial}
                    </span>
                    <span className="truncate text-[13px] font-medium">
                      {team.name}
                    </span>
                  </button>

                  {(team.canEdit || team.canDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
                          aria-label={`Acoes do time ${team.name}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {team.canEdit && (
                          <>
                            <DropdownMenuItem
                              onSelect={() => setEditTeam(team)}
                              className="text-[13px]"
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => setMembersTeam(team)}
                              className="text-[13px]"
                            >
                              <Users className="mr-2 h-3.5 w-3.5" />
                              Membros
                            </DropdownMenuItem>
                          </>
                        )}
                        {team.canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => setDeleteTeam(team)}
                              className="text-[13px] text-destructive focus:text-destructive"
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

                {/* Subitens — so para o time selecionado */}
                {selected && (
                  <ul className="ml-2 mt-px space-y-px border-l border-sidebar-border pl-2">
                    {subItems.map((item) => {
                      const active = isNavItemActive(pathname, item.href);
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-1 text-[13px] transition-colors",
                              active
                                ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                                : "text-foreground/85 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="flex-1 truncate">
                              {item.label}
                            </span>
                            {item.comingSoon && (
                              <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                                em breve
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

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
    </div>
  );
}

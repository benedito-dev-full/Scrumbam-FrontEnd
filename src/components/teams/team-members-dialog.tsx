"use client";

import { useMemo, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTeamMembers,
  useAddTeamMember,
  useUpdateTeamMemberRole,
  useRemoveTeamMember,
} from "@/lib/hooks/use-teams";
import { useOrgMembers } from "@/lib/hooks/use-organization";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { Team, TeamMemberRole } from "@/types/team";

const ROLES: { value: TeamMemberRole; label: string }[] = [
  { value: "LEAD", label: "Lead" },
  { value: "MEMBER", label: "Membro" },
];

interface TeamMembersDialogProps {
  team: Team;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog de gestao de membros do time.
 *
 * Permissoes:
 *  - canEdit do time (do backend) controla se o usuario logado pode adicionar
 *    e alterar cargos.
 *  - Lista membros via GET /teams/:id/members.
 *  - Selector pega usuarios da org via useOrgMembers e filtra os ja adicionados.
 */
export function TeamMembersDialog({
  team,
  open,
  onOpenChange,
}: TeamMembersDialogProps) {
  const orgId = useAuthStore((s) => s.user?.orgId);
  const { data: members, isLoading } = useTeamMembers(open ? team.id : null);
  const { data: orgMembers } = useOrgMembers(open ? orgId : undefined);

  const addMember = useAddTeamMember();
  const updateRole = useUpdateTeamMemberRole();
  const removeMember = useRemoveTeamMember();

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<TeamMemberRole>("MEMBER");

  const memberIdSet = useMemo(
    () => new Set((members ?? []).map((m) => m.userId)),
    [members],
  );

  const availableUsers = useMemo(
    () => (orgMembers ?? []).filter((u) => !memberIdSet.has(u.id)),
    [orgMembers, memberIdSet],
  );

  const handleAdd = () => {
    if (!selectedUserId) return;
    addMember.mutate(
      {
        teamId: team.id,
        dto: { userId: selectedUserId, cargo: selectedRole },
      },
      {
        onSuccess: () => {
          setSelectedUserId("");
          setSelectedRole("MEMBER");
        },
      },
    );
  };

  const handleRoleChange = (userId: string, cargo: TeamMemberRole) => {
    updateRole.mutate({ teamId: team.id, userId, dto: { cargo } });
  };

  const handleRemove = (userId: string) => {
    removeMember.mutate({ teamId: team.id, userId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Membros — {team.name}</DialogTitle>
          <DialogDescription>
            Gerencie quem pertence ao time e o cargo de cada membro.
          </DialogDescription>
        </DialogHeader>

        {/* Add new member */}
        {team.canEdit && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-[12px] font-medium text-muted-foreground">
              Adicionar membro
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={availableUsers.length === 0 || addMember.isPending}
              >
                <SelectTrigger className="flex-1 min-w-0 text-[13px]">
                  <SelectValue
                    placeholder={
                      availableUsers.length === 0
                        ? "Todos os usuarios ja estao no time"
                        : "Selecione um usuario"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedRole}
                onValueChange={(v) => setSelectedRole(v as TeamMemberRole)}
                disabled={addMember.isPending}
              >
                <SelectTrigger className="w-full sm:w-32 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!selectedUserId || addMember.isPending}
                size="sm"
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>
          </div>
        )}

        {/* Member list */}
        <div className="space-y-1">
          <p className="text-[12px] font-medium text-muted-foreground">
            Membros ({members?.length ?? 0})
          </p>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !members || members.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              Nenhum membro neste time ainda.
            </p>
          ) : (
            <ul className="space-y-1">
              {members.map((m) => (
                <li
                  key={m.userId}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{m.name}</p>
                    {m.email && (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {m.email}
                      </p>
                    )}
                  </div>
                  <Select
                    value={m.cargo}
                    onValueChange={(v) =>
                      handleRoleChange(m.userId, v as TeamMemberRole)
                    }
                    disabled={!team.canEdit || updateRole.isPending}
                  >
                    <SelectTrigger className="h-7 w-24 text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {team.canEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(m.userId)}
                      disabled={removeMember.isPending}
                      aria-label={`Remover ${m.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

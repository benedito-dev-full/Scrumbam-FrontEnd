"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Search, UserPlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOrgMembers } from "@/lib/hooks/use-organization";
import {
  useProjectMembers,
  useAddProjectMember,
} from "@/lib/hooks/use-project-members";
import { cn } from "@/lib/utils";
import type { ProjectRole } from "@/lib/api/project-members";

interface AddProjectMemberModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_OPTIONS: { value: ProjectRole; label: string }[] = [
  { value: "MEMBER", label: "Member" },
  { value: "MANAGER", label: "Manager" },
  { value: "VIEWER", label: "Viewer" },
];

export function AddProjectMemberModal({
  projectId,
  open,
  onOpenChange,
}: AddProjectMemberModalProps) {
  const orgId = useAuthStore((s) => s.user?.orgId);
  const { data: orgMembers, isLoading: loadingOrg } = useOrgMembers(orgId);
  const { data: projectMembers } = useProjectMembers(projectId);
  const addMember = useAddProjectMember(projectId);

  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [role, setRole] = useState<ProjectRole>("MEMBER");

  const projectMemberIds = useMemo(
    () => new Set((projectMembers ?? []).map((m) => m.userId)),
    [projectMembers],
  );

  const availableMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (orgMembers ?? [])
      .filter((m) => !projectMemberIds.has(m.id))
      .filter((m) => {
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
        );
      });
  }, [orgMembers, projectMemberIds, search]);

  const reset = () => {
    setSearch("");
    setSelectedUserId(null);
    setRole("MEMBER");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = () => {
    if (!selectedUserId) return;
    addMember.mutate(
      { userId: selectedUserId, role },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar membros ao projeto</DialogTitle>
          <DialogDescription>
            Selecione um membro do workspace e o cargo dele neste projeto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email"
              className="h-9 pl-8 text-[13px]"
              autoFocus
            />
          </div>

          {/* Lista de candidatos */}
          <div className="max-h-64 overflow-auto rounded-md border border-border">
            {loadingOrg ? (
              <div className="p-6 text-center text-[12px] text-muted-foreground">
                Carregando...
              </div>
            ) : availableMembers.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-muted-foreground">
                {projectMemberIds.size > 0 && (orgMembers?.length ?? 0) > 0
                  ? "Todos os membros do workspace ja estao neste projeto."
                  : "Nenhum membro encontrado."}
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {availableMembers.map((m) => {
                  const isSelected = selectedUserId === m.id;
                  const initials = m.name
                    .split(" ")
                    .map((w) => w[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(m.id)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors",
                          isSelected ? "bg-accent" : "hover:bg-accent/40",
                        )}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-medium text-white">
                          {initials || "?"}
                        </span>
                        <span className="flex-1 min-w-0">
                          <p className="truncate text-[13px] font-medium">
                            {m.name}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {m.email}
                          </p>
                        </span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Role */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">
              Cargo no projeto:
            </span>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as ProjectRole)}
            >
              <SelectTrigger className="h-8 w-[140px] text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-[12px]"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleClose(false)}
            className="text-[12px]"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!selectedUserId || addMember.isPending}
            className="text-[12px]"
          >
            {addMember.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <UserPlus className="mr-1.5 h-3 w-3" />
                Adicionar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Users, UserPlus, Loader2, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useOrgMembers,
  useAddOrgMember,
  useRemoveOrgMember,
  useUpdateMemberRole,
} from "@/lib/hooks/use-organization";
import type { OrgRole, OrgMember } from "@/types";

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const ROLE_CONFIG: Record<OrgRole, { label: string; className: string }> = {
  ADMIN: {
    label: "Admin",
    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  },
  MEMBER: {
    label: "Membro",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  },
  VIEWER: {
    label: "Visualizador",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
};

interface MemberRowProps {
  member: OrgMember;
  isAdmin: boolean;
  isCurrentUser: boolean;
  onRemove: (member: OrgMember) => void;
  onRoleChange: (userId: string, role: OrgRole) => void;
  isUpdatingRole: boolean;
}

function MemberRow({
  member,
  isAdmin,
  isCurrentUser,
  onRemove,
  onRoleChange,
  isUpdatingRole,
}: MemberRowProps) {
  const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.MEMBER;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50 hover:shadow-sm">
      <Avatar>
        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{member.name}</p>
          {isCurrentUser && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400"
            >
              Voce
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
      </div>

      {isAdmin && !isCurrentUser ? (
        <div className="flex items-center gap-2">
          <Select
            value={member.role}
            onValueChange={(v) => onRoleChange(member.id, v as OrgRole)}
            disabled={isUpdatingRole}
          >
            <SelectTrigger className="h-7 text-xs w-[120px] gap-1">
              <SelectValue />
              <ChevronDown className="h-3 w-3 opacity-50" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MEMBER">Membro</SelectItem>
              <SelectItem value="VIEWER">Visualizador</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(member)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Badge variant="outline" className={roleConfig.className}>
          {roleConfig.label}
        </Badge>
      )}
    </div>
  );
}

function MembersSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function AddMemberForm({ orgId }: { orgId: string }) {
  const addMember = useAddOrgMember(orgId);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<OrgRole>("MEMBER");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;

    addMember.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
      },
      {
        onSuccess: () => {
          setName("");
          setEmail("");
          setPassword("");
          setRole("MEMBER");
          setShowForm(false);
        },
      },
    );
  };

  if (!showForm) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setShowForm(true)}
      >
        <UserPlus className="h-4 w-4" />
        Adicionar membro
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome</Label>
            <Input
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm"
              required
              minLength={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              placeholder="email@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 text-sm"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Senha inicial</Label>
            <Input
              type="password"
              placeholder="Minimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-8 text-sm"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cargo</Label>
            <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
              <SelectTrigger className="h-8 text-sm w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MEMBER">Membro</SelectItem>
                <SelectItem value="VIEWER">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="submit"
              size="sm"
              className="h-8"
              disabled={
                addMember.isPending ||
                !name.trim() ||
                !email.trim() ||
                !password.trim()
              }
            >
              {addMember.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Adicionando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface OrgMembersFullProps {
  orgId: string;
  currentUserId: string;
  isAdmin: boolean;
}

export function OrgMembersFull({
  orgId,
  currentUserId,
  isAdmin,
}: OrgMembersFullProps) {
  const { data: members, isLoading, error } = useOrgMembers(orgId);
  const removeMember = useRemoveOrgMember(orgId);
  const updateRole = useUpdateMemberRole(orgId);
  const [memberToRemove, setMemberToRemove] = useState<OrgMember | null>(null);

  const handleRoleChange = (userId: string, role: OrgRole) => {
    updateRole.mutate({ userId, role });
  };

  const handleConfirmRemove = () => {
    if (!memberToRemove) return;
    removeMember.mutate(memberToRemove.id, {
      onSuccess: () => setMemberToRemove(null),
    });
  };

  return (
    <Card className="border-l-[3px] border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <CardTitle>Membros</CardTitle>
              <CardDescription className="text-xs">
                {members?.length
                  ? `${members.length} membro${members.length !== 1 ? "s" : ""} na organizacao`
                  : "Gerencie os membros da sua organizacao"}
              </CardDescription>
            </div>
          </div>
          {isAdmin && <AddMemberForm orgId={orgId} />}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && <MembersSkeleton />}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
            <p className="text-sm text-destructive">
              Erro ao carregar membros. Verifique sua conexao.
            </p>
          </div>
        )}

        {!isLoading && !error && members?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
            <div className="rounded-full bg-blue-500/10 p-4 mb-3">
              <Users className="h-8 w-8 text-blue-500/60" />
            </div>
            <p className="text-sm font-medium mb-1">Nenhum membro encontrado</p>
            <p className="text-xs text-muted-foreground">
              {isAdmin
                ? 'Clique em "Adicionar membro" para convidar alguem'
                : "Aguarde um administrador adicionar membros"}
            </p>
          </div>
        )}

        {!isLoading && !error && members && members.length > 0 && (
          <div className="space-y-2">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isAdmin={isAdmin}
                isCurrentUser={member.id === currentUserId}
                onRemove={setMemberToRemove}
                onRoleChange={handleRoleChange}
                isUpdatingRole={updateRole.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Confirmation dialog for removing a member */}
      <Dialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover membro</DialogTitle>
            <DialogDescription>
              Remover <strong>{memberToRemove?.name}</strong> da organizacao?
              Suas intencoes e historico serao preservados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMemberToRemove(null)}
              disabled={removeMember.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemove}
              disabled={removeMember.isPending}
            >
              {removeMember.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

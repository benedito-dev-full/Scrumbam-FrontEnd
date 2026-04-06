"use client";

import { useState } from "react";
import { Users, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrgMembers, useAddOrgMember } from "@/lib/hooks/use-organization";
import type { OrgRole, OrgMember } from "@/types";

function getInitials(name: string): string {
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

function MemberRow({ member }: { member: OrgMember }) {
  const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.MEMBER;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <Avatar size="default">
        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{member.name}</p>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
      </div>
      <Badge variant="outline" className={roleConfig.className}>
        {roleConfig.label}
      </Badge>
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

export function OrgMembers({ orgId }: { orgId: string }) {
  const { data: members, isLoading, error } = useOrgMembers(orgId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros da Organizacao
          </h2>
          <p className="text-sm text-muted-foreground">
            {members?.length
              ? `${members.length} membro${members.length !== 1 ? "s" : ""}`
              : "Gerencie os membros da sua organizacao"}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">
            Erro ao carregar membros. Verifique sua conexao.
          </p>
        </div>
      )}

      {!isLoading && !error && members?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
          <Users className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhum membro encontrado
          </p>
        </div>
      )}

      {!isLoading && !error && members && members.length > 0 && (
        <div className="space-y-2">
          {members.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </div>
      )}

      <AddMemberForm orgId={orgId} />
    </div>
  );
}

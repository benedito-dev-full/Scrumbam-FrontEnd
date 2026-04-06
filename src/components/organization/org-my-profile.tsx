"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useMe, useUpdateMe } from "@/lib/hooks/use-organization";
import { getInitials } from "@/components/organization/org-members-full";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MEMBER: "Membro",
  VIEWER: "Visualizador",
};

export function OrgMyProfile() {
  const { data: me, isLoading, error } = useMe();
  const updateMe = useUpdateMe();

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileChanged, setProfileChanged] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (me) {
      setName(me.name ?? "");
      setEmail(me.email ?? "");
      setProfileChanged(false);
    }
  }, [me]);

  const handleProfileChange = (field: "name" | "email", value: string) => {
    if (field === "name") setName(value);
    if (field === "email") setEmail(value);
    setProfileChanged(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileChanged) return;

    const dto: Record<string, string> = {};
    if (name !== (me?.name ?? "")) dto.name = name;
    if (email !== (me?.email ?? "")) dto.email = email;

    if (Object.keys(dto).length === 0) return;

    updateMe.mutate(dto, {
      onSuccess: () => setProfileChanged(false),
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) return;
    if (newPassword.length < 6) return;

    updateMe.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
      },
    );
  };

  const passwordMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  if (isLoading) {
    return (
      <Card className="border-l-[3px] border-l-sky-500">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3.5 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
            <p className="text-sm text-destructive">
              Erro ao carregar dados do perfil.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <Card className="border-l-[3px] border-l-sky-500">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-sky-500/20">
              <AvatarFallback className="text-lg font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400">
                {getInitials(me?.name ?? "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{me?.name ?? "Meu Perfil"}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-0.5 text-xs">
                <Badge variant="outline" className="text-[10px]">
                  {ROLE_LABELS[me?.role ?? ""] ?? me?.role}
                </Badge>
                <span>em {me?.organizationName}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="me-name">Nome</Label>
              <Input
                id="me-name"
                value={name}
                onChange={(e) => handleProfileChange("name", e.target.value)}
                placeholder="Seu nome"
                minLength={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="me-email">Email</Label>
              <Input
                id="me-email"
                type="email"
                value={email}
                onChange={(e) => handleProfileChange("email", e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <Separator />

            <Button
              type="submit"
              disabled={!profileChanged || updateMe.isPending}
              className="gap-2"
            >
              {updateMe.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar perfil
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card className="border-l-[3px] border-l-amber-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-3">
              <KeyRound className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <CardTitle>Trocar Senha</CardTitle>
              <CardDescription className="text-xs">
                Informe sua senha atual para definir uma nova
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-pw">Senha atual</Label>
              <Input
                id="current-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Senha atual"
                minLength={6}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-pw">Nova senha</Label>
                <Input
                  id="new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pw">Confirmar nova senha</Label>
                <Input
                  id="confirm-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  minLength={6}
                  required
                />
                {passwordMismatch && (
                  <p className="text-xs text-destructive">
                    As senhas nao coincidem
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <Button
              type="submit"
              variant="outline"
              disabled={
                updateMe.isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                passwordMismatch ||
                newPassword.length < 6
              }
              className="gap-2"
            >
              {updateMe.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Trocar senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

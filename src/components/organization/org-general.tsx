"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Save,
  Loader2,
  Palette,
  Webhook,
  Info,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  useOrganization,
  useUpdateOrganization,
} from "@/lib/hooks/use-organization";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AxiosError } from "axios";

interface OrgGeneralProps {
  orgId: string;
  isAdmin: boolean;
}

export function OrgGeneral({ orgId, isAdmin }: OrgGeneralProps) {
  const { data: org, isLoading, error } = useOrganization(orgId);
  const updateOrg = useUpdateOrganization(orgId);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (org) {
      setName(org.name ?? "");
      setEmail(org.email ?? "");
      setPhone(org.phone ?? "");
      setHasChanges(false);
    }
  }, [org]);

  const handleFieldChange = (
    field: "name" | "email" | "phone",
    value: string,
  ) => {
    if (field === "name") setName(value);
    if (field === "email") setEmail(value);
    if (field === "phone") setPhone(value);
    setHasChanges(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    const dto: Record<string, string> = {};
    if (name !== (org?.name ?? "")) dto.name = name;
    if (email !== (org?.email ?? "")) dto.email = email;
    if (phone !== (org?.phone ?? "")) dto.phone = phone;

    if (Object.keys(dto).length === 0) return;

    updateOrg.mutate(dto, {
      onSuccess: () => setHasChanges(false),
    });
  };

  if (isLoading) {
    return (
      <Card className="border-l-[3px] border-l-indigo-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-56" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
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
              Erro ao carregar dados da organizacao.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main form card */}
      <Card className="border-l-[3px] border-l-indigo-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-3">
              <Building2 className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <CardTitle>Dados da Organizacao</CardTitle>
              <CardDescription className="text-xs">
                {org?.memberCount ?? 0} membro
                {(org?.memberCount ?? 0) !== 1 ? "s" : ""} ativo
                {(org?.memberCount ?? 0) !== 1 ? "s" : ""}
                {" | "}
                Criada em{" "}
                {org?.createdAt
                  ? new Date(org.createdAt).toLocaleDateString("pt-BR")
                  : "---"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isAdmin && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 mb-4">
              <Info className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Apenas administradores podem editar os dados da organizacao
              </p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Nome</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                disabled={!isAdmin}
                placeholder="Nome da organizacao"
                minLength={2}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-email">Email</Label>
                <Input
                  id="org-email"
                  type="email"
                  value={email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  disabled={!isAdmin}
                  placeholder="contato@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-phone">Telefone</Label>
                <Input
                  id="org-phone"
                  value={phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  disabled={!isAdmin}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {isAdmin && (
              <>
                <Separator />
                <Button
                  type="submit"
                  disabled={!hasChanges || updateOrg.isPending}
                  className="gap-2"
                >
                  {updateOrg.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar alteracoes
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Quick links - Settings style */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">
          Configuracoes relacionadas
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/settings/branding"
            className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-[var(--scrumban-brand)]/40"
          >
            <div className="rounded-lg bg-[var(--status-review)]/10 p-3">
              <Palette className="h-5 w-5 text-[var(--status-review)]" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Branding</h4>
              <p className="text-xs text-muted-foreground">
                Logo, cores e nome
              </p>
            </div>
          </Link>
          <Link
            href="/settings/webhooks"
            className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-[var(--scrumban-brand)]/40"
          >
            <div className="rounded-lg bg-[var(--status-doing)]/10 p-3">
              <Webhook className="h-5 w-5 text-[var(--status-doing)]" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Webhooks</h4>
              <p className="text-xs text-muted-foreground">Notificacoes HTTP</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Danger zone - Admin only */}
      {isAdmin && <DangerZoneOrg orgId={orgId} orgName={org?.name ?? ""} />}
    </div>
  );
}

function DangerZoneOrg({
  orgId,
  orgName,
}: {
  orgId: string;
  orgName: string;
}) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canConfirm =
    confirmText === "EXCLUIR" && password.length >= 6;

  const handleDelete = async () => {
    if (!canConfirm) return;
    setError("");
    setLoading(true);

    try {
      await authApi.deleteOrganization(orgId, password);
      logout();
      router.replace("/login");
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Erro ao excluir organizacao.");
      } else {
        setError("Erro de conexao.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-destructive/50 border-l-[3px] border-l-destructive">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-destructive/10 p-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription className="text-xs">
              Acoes irreversiveis para a organizacao
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div>
            <p className="text-sm font-medium">Excluir organizacao</p>
            <p className="text-xs text-muted-foreground">
              Remove a organizacao, todos os membros, projetos e tarefas
            </p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPassword(""); setConfirmText(""); setError(""); } }}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-destructive">
                  Excluir organizacao
                </DialogTitle>
                <DialogDescription>
                  Esta acao e <strong>irreversivel</strong>. Todos os dados da
                  organizacao serao excluidos permanentemente, incluindo membros,
                  projetos e tarefas.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="delete-org-confirm">
                    Digite <strong>EXCLUIR</strong> para confirmar
                  </Label>
                  <Input
                    id="delete-org-confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="EXCLUIR"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delete-org-password">
                    Sua senha para confirmacao
                  </Label>
                  <Input
                    id="delete-org-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    autoComplete="current-password"
                  />
                </div>
                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={!canConfirm || loading}
                  className="gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Excluir organizacao
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

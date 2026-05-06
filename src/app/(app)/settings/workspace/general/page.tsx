"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useOrganization,
  useUpdateOrganization,
} from "@/lib/hooks/use-organization";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const FISCAL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function WorkspaceGeneralPage() {
  usePageTitle("Workspace");
  // (Workspace mantido — jargao consolidado)
  const { user, logout } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const orgId = user?.orgId;
  const { data: org } = useOrganization(orgId);
  const updateOrg = useUpdateOrganization(orgId);

  const [name, setName] = useState(user?.orgNome ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    if (org?.name) setName(org.name);
    else if (user?.orgNome) setName(user.orgNome);
  }, [org, user]);

  const orgInitials = (name || "DT")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const slugFallback = (name || "workspace")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const nameDirty = name.trim() !== (org?.name ?? user?.orgNome ?? "") && name.trim().length > 0;

  const saveName = () => {
    if (!nameDirty) return;
    updateOrg.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          if (user) setUser({ ...user, orgNome: name.trim() });
        },
      },
    );
  };

  const deleteOrg = useMutation({
    mutationFn: (password: string) =>
      authApi.deleteOrganization(orgId!, password),
    onSuccess: () => {
      toast.success("Workspace excluido");
      queryClient.clear();
      logout();
    },
    onError: (error: { response?: { status?: number } }) => {
      if (error.response?.status === 401) {
        toast.error("Senha incorreta");
      } else if (error.response?.status === 403) {
        toast.error("Sem permissao para excluir o workspace");
      } else {
        toast.error("Erro ao excluir workspace");
      }
    },
  });

  const handleDelete = () => {
    if (!deletePassword.trim()) {
      toast.error("Digite sua senha para confirmar");
      return;
    }
    deleteOrg.mutate(deletePassword);
  };

  return (
    <PageTransition>
      <div className="px-8 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <h1 className="text-2xl font-semibold tracking-tight">Workspace</h1>

          {/* ============ IDENTITY ============ */}
          <div className="rounded-md border border-border bg-card overflow-hidden">
            {/* Logo */}
            <Row
              label="Logo"
              description="Tamanho recomendado: 256x256px"
              hint="Gap #30 — upload em /settings/branding"
            >
              <Link
                href="/settings/branding"
                className="flex items-center gap-2 group"
                title="Configurar branding"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-500 text-[12px] font-bold text-black group-hover:opacity-90 transition-opacity">
                  {orgInitials}
                </div>
                <Pencil className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </Row>

            {/* Name */}
            <Row label="Nome">
              <div className="flex items-center gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="h-8 text-[13px] w-64"
                />
                {nameDirty && (
                  <Button
                    size="sm"
                    onClick={saveName}
                    disabled={updateOrg.isPending}
                    className="text-[12px] h-8"
                  >
                    {updateOrg.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                )}
              </div>
            </Row>

            {/* URL slug (stub) */}
            <Row
              label="URL"
              stub
              hint="Gap #31 — campo slug nao existe no schema"
              noBorder
            >
              <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
                <span>scrumban.app/</span>
                <Input
                  value={slugFallback}
                  disabled
                  className="h-8 text-[13px] w-44"
                />
              </div>
            </Row>
          </div>

          {/* ============ TIME & REGION ============ */}
          <section className="space-y-3">
            <h2 className="text-base font-medium">Hora e regiao</h2>
            <div className="rounded-md border border-border bg-card overflow-hidden">
              <Row
                label="Primeiro mes do ano fiscal"
                description="Usado para agrupar projetos e issues por trimestre, semestre e ano"
                stub
                hint="Gap #32"
              >
                <Select value="January" disabled>
                  <SelectTrigger className="h-8 min-w-[140px] text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FISCAL_MONTHS.map((m) => (
                      <SelectItem key={m} value={m} className="text-[12px]">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
              <Row
                label="Regiao"
                description="Definida na criacao do workspace e nao pode ser alterada"
                stub
                hint="Gap #32 — backend usa America/Sao_Paulo fixo"
                noBorder
              >
                <span className="text-[12px] text-muted-foreground">
                  Brazil
                </span>
              </Row>
            </div>
          </section>

          {/* ============ WELCOME MESSAGE (paywall stub) ============ */}
          <section className="space-y-3">
            <h2 className="text-base font-medium">Mensagem de boas-vindas</h2>
            <div className="rounded-md border border-border bg-card overflow-hidden">
              <Row
                label="Configurar mensagem de boas-vindas"
                stub
                hint="Gap #33 — feature Enterprise"
                noBorder
              >
                <span className="text-[12px] text-muted-foreground">
                  Em plano superior
                </span>
              </Row>
            </div>
          </section>

          {/* ============ DANGER ZONE ============ */}
          <section className="space-y-3">
            <h2 className="text-base font-medium text-destructive">
              Zona de perigo
            </h2>
            <div className="rounded-md border border-destructive/30 bg-card overflow-hidden">
              <div className="flex items-center justify-between gap-6 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium">Excluir workspace</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Agendar exclusao permanente do workspace
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  className="text-[12px] text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Excluir workspace
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Confirm delete dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir workspace?</DialogTitle>
            <DialogDescription>
              Esta acao e <strong>permanente</strong>. O workspace{" "}
              <strong>{org?.name ?? user?.orgNome}</strong> e todos os seus
              projetos, issues, members e dados serao excluidos. Voce sera
              deslogado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-[12px] font-medium">
              Confirme com sua senha
            </label>
            <Input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Sua senha"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleDelete();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConfirmDelete(false);
                setDeletePassword("");
              }}
              className="text-[12px]"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={!deletePassword.trim() || deleteOrg.isPending}
              className="text-[12px]"
            >
              {deleteOrg.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir permanentemente"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

// ============================================================
// Layout primitive
// ============================================================

function Row({
  label,
  description,
  children,
  noBorder,
  stub,
  hint,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  noBorder?: boolean;
  stub?: boolean;
  hint?: string;
}) {
  return (
    <div
      title={hint}
      className={cn(
        "flex items-start justify-between gap-6 px-4 py-3",
        !noBorder && "border-b border-border",
        stub && "opacity-70",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium">{label}</p>
        {description && (
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

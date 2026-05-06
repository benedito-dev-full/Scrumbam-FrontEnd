"use client";

import { useEffect, useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useUpdateMe,
  useRemoveOrgMember,
} from "@/lib/hooks/use-organization";
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
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function ProfilePage() {
  usePageTitle("Perfil");
  const { user, logout } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);

  const updateMe = useUpdateMe();
  const removeMember = useRemoveOrgMember(user?.orgId);

  // Local form state — initialized from user, kept in sync
  const [fullName, setFullName] = useState(user?.nome ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [emailEditing, setEmailEditing] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.nome);
      setEmail(user.email);
    }
  }, [user]);

  const nameDirty = fullName.trim() !== (user?.nome ?? "") && fullName.trim().length > 0;
  const emailDirty = email.trim() !== (user?.email ?? "") && email.trim().length > 0;

  const initials = (user?.nome || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const saveName = () => {
    if (!nameDirty) return;
    updateMe.mutate(
      { name: fullName.trim() },
      {
        onSuccess: () => {
          if (user) setUser({ ...user, nome: fullName.trim() });
        },
      },
    );
  };

  const saveEmail = () => {
    if (!emailDirty) return;
    updateMe.mutate(
      { email: email.trim() },
      {
        onSuccess: () => {
          if (user) setUser({ ...user, email: email.trim() });
          setEmailEditing(false);
        },
      },
    );
  };

  const handleLeave = () => {
    if (!user?.entidadeId) {
      toast.error("Nao foi possivel identificar o usuario");
      return;
    }
    removeMember.mutate(user.entidadeId, {
      onSuccess: () => {
        setConfirmLeave(false);
        logout();
      },
    });
  };

  return (
    <PageTransition>
      <div className="px-8 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>

          {/* Profile card */}
          <div className="rounded-md border border-border bg-card overflow-hidden">
            {/* Profile picture */}
            <Row label="Foto de perfil" description="Gap #24 — sem upload">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-[12px] font-medium text-white"
                title="Iniciais geradas a partir do nome"
              >
                {initials}
              </div>
            </Row>

            {/* Email */}
            <Row label="Email">
              {emailEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-8 text-[13px] w-64"
                  />
                  <Button
                    size="sm"
                    onClick={saveEmail}
                    disabled={!emailDirty || updateMe.isPending}
                    className="text-[12px] h-8"
                  >
                    {updateMe.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEmail(user?.email ?? "");
                      setEmailEditing(false);
                    }}
                    className="text-[12px] h-8"
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[13px]">{user?.email ?? "—"}</span>
                  <button
                    type="button"
                    onClick={() => setEmailEditing(true)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    aria-label="Editar email"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
              )}
            </Row>

            {/* Full name */}
            <Row label="Nome completo">
              <div className="flex items-center gap-2">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                    disabled={updateMe.isPending}
                    className="text-[12px] h-8"
                  >
                    {updateMe.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                )}
              </div>
            </Row>

            {/* Username (stub) */}
            <Row
              label="Username"
              description="Uma palavra, tipo apelido ou primeiro nome"
              stub
              title="Gap #25 — campo username nao existe no schema"
              noBorder
            >
              <Input
                value=""
                disabled
                placeholder="—"
                className="h-8 text-[13px] w-64"
              />
            </Row>
          </div>

          {/* Workspace access */}
          <section className="space-y-3">
            <h2 className="text-base font-medium">Acesso ao workspace</h2>
            <div className="rounded-md border border-border bg-card overflow-hidden">
              <Row label="Sair deste workspace" noBorder>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmLeave(true)}
                  className="text-[12px] text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Sair do workspace
                </Button>
              </Row>
            </div>
          </section>
        </div>
      </div>

      {/* Confirm leave dialog */}
      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sair do workspace?</DialogTitle>
            <DialogDescription>
              Voce perdera acesso a {user?.orgNome ?? "esta organizacao"} e a
              todos os projetos dela. Sera deslogado em seguida.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmLeave(false)}
              className="text-[12px]"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeave}
              disabled={removeMember.isPending}
              className="text-[12px]"
            >
              {removeMember.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Saindo...
                </>
              ) : (
                "Sim, sair"
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
  title,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  noBorder?: boolean;
  stub?: boolean;
  title?: string;
}) {
  return (
    <div
      title={title}
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

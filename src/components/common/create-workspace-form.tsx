"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";

import { authApi } from "@/lib/api/auth";
import { organizationsApi } from "@/lib/api/organizations";
import { getEntidadeIdFromToken } from "@/lib/auth/decode-jwt";
import { LAST_ORG_LS_KEY, useAuthStore } from "@/lib/stores/auth-store";
import type { AuthResponse, User } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Form compartilhado para criar uma nova workspace.
 *
 * Encapsula `POST /organizations` + `POST /auth/switch-org` + atualização
 * do auth store + invalidação de cache. Reusado por:
 *  - `/orphan` (tela de estado órfão — ADR-V2-038)
 *  - `WorkspaceSwitcher` (dropdown da sidebar)
 *
 * Não decide o que acontece DEPOIS do sucesso: o caller injeta via
 * `onSuccess` (redirect, toast, fechar modal, refresh, etc.). Isso
 * permite UX divergente entre orphan (redirect /intentions) e dialog
 * (apenas refresh dos server components).
 */

function buildUser(data: AuthResponse): User {
  const fromToken = getEntidadeIdFromToken(data.accessToken);
  return {
    id: data.user.id,
    entidadeId: fromToken ?? data.user.entidadeId ?? data.user.id,
    nome: data.user.name,
    email: data.user.email,
    role: data.user.orgRole?.toLowerCase() || data.user.role || "member",
    orgId: data.user.organizationId || "",
    orgNome: data.user.organizationName || "",
    availableOrgs: data.user.availableOrgs ?? [],
    isOrphan: data.user.isOrphan ?? !data.user.organizationId,
  };
}

export interface CreateWorkspaceFormProps {
  /** Disparado após criar org + switchOrg + atualizar store. Recebe o ID da nova org. */
  onSuccess?: (newOrgId: string) => void;
  /** Quando passado, renderiza botão "Cancelar" (útil em modal). */
  onCancel?: () => void;
  /** Focar input ao montar. Default true. */
  autoFocus?: boolean;
  /** Label do botão de submit. Default "Criar workspace". */
  submitLabel?: string;
}

export function CreateWorkspaceForm({
  onSuccess,
  onCancel,
  autoFocus = true,
  submitLabel = "Criar workspace",
}: CreateWorkspaceFormProps) {
  const queryClient = useQueryClient();
  const login = useAuthStore((s) => s.login);

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (nome: string) => {
      const org = await organizationsApi.create({ nome });
      // switchOrg emite novo JWT já carregando organizationId — derruba
      // estado órfão e troca tenant ativo numa só ida ao servidor.
      const resp = await authApi.switchOrg(org.id);
      return { org, resp };
    },
    onSuccess: ({ org, resp }) => {
      const newUser = buildUser(resp);
      login(newUser, resp.accessToken, resp.refreshToken);
      if (typeof window !== "undefined" && newUser.orgId) {
        window.localStorage.setItem(LAST_ORG_LS_KEY, newUser.orgId);
      }
      // Queries em cache pertencem à org anterior. Limpar evita leak entre tenants.
      queryClient.clear();
      setName("");
      onSuccess?.(org.id);
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        const msg =
          (err.response?.data as { message?: string } | undefined)?.message ||
          "Erro ao criar workspace.";
        setError(msg);
      } else {
        setError("Erro ao criar workspace.");
      }
    },
  });

  const hasCancel = typeof onCancel === "function";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const trimmed = name.trim();
        if (!trimmed) {
          setError("Informe o nome da workspace.");
          return;
        }
        mutation.mutate(trimmed);
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="workspace-name" className="text-[12px]">
          Nome da workspace
        </Label>
        <Input
          id="workspace-name"
          type="text"
          placeholder="Ex: Acme Corp"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={mutation.isPending}
          autoFocus={autoFocus}
          maxLength={100}
          className="h-10 text-[14px]"
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
          <p className="text-[12px] text-destructive">{error}</p>
        </div>
      )}

      <div
        className={
          hasCancel
            ? "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
            : ""
        }
      >
        {hasCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={!name.trim() || mutation.isPending}
          className={hasCancel ? "" : "w-full"}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Folder, Loader2, X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCreateFolder } from "@/lib/hooks/use-folders";

interface CreateFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Callback opcional após criar (recebe id/nome da pasta). */
  onCreated?: (folder: { id: string; nome: string }) => void;
}

const MAX_NAME = 100;

/**
 * Modal de criação de pasta (Folder).
 *
 * Backend V2: `POST /entidades/folders` (ADR-V2-FOLDERS-001).
 * O hook `useCreateFolder` injeta `organizationId` do auth-store
 * e cuida de invalidation/toast (sucesso e erro).
 *
 * Mesmo padrão visual do `edit-project-modal.tsx`:
 * - breadcrumb com workspace label
 * - input nome com autofocus
 * - Ctrl/Cmd+Enter submete
 * - Esc/cancelar fecha sem perder dados se já estava digitando
 *
 * Submit bloqueado quando nome vazio ou pending.
 */
export function CreateFolderModal({
  open,
  onOpenChange,
  onCreated,
}: CreateFolderModalProps) {
  const { user } = useAuth();
  const [nome, setNome] = useState("");
  const createMutation = useCreateFolder();

  // Reseta o input ao reabrir o modal (evita arrastar texto entre instâncias).
  useEffect(() => {
    if (open) setNome("");
  }, [open]);

  const trimmed = nome.trim();
  const canSubmit =
    trimmed.length > 0 &&
    trimmed.length <= MAX_NAME &&
    !createMutation.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createMutation.mutate(
      { nome: trimmed },
      {
        onSuccess: (folder) => {
          onCreated?.({ id: folder.id, nome: folder.nome });
          onOpenChange(false);
        },
      },
    );
  };

  const handleCancel = () => {
    if (createMutation.isPending) return;
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canSubmit) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const workspaceLabel = user?.orgNome || "Workspace";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !createMutation.isPending && onOpenChange(o)}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md p-0 gap-0 overflow-hidden border-border"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <DialogTitle className="flex min-w-0 items-center gap-1.5 text-[13px]">
            <span className="flex max-w-[200px] items-center gap-1.5 truncate rounded bg-emerald-500/15 px-1.5 py-0.5 text-[12px] font-medium text-emerald-300">
              <Folder className="h-3 w-3 shrink-0" />
              <span className="truncate">{workspaceLabel}</span>
            </span>
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
            <span className="truncate font-medium">Nova pasta</span>
          </DialogTitle>
          <button
            type="button"
            onClick={handleCancel}
            disabled={createMutation.isPending}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 space-y-2 px-5 py-4">
          <input
            type="text"
            placeholder="Nome da pasta"
            value={nome}
            maxLength={MAX_NAME}
            onChange={(e) => setNome(e.target.value)}
            autoFocus
            className="h-10 w-full rounded-md border-0 bg-muted/40 px-3 text-[16px] font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted/60"
          />
          <p className="text-[11px] text-muted-foreground/70">
            Use a pasta para agrupar projetos do mesmo cliente ou contexto. O
            nome pode ter até {MAX_NAME} caracteres.
          </p>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={createMutation.isPending}
            className="h-8 text-[12px]"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-8 bg-blue-600 text-[12px] text-white hover:bg-blue-700"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar pasta"
            )}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

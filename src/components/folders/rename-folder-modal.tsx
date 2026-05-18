"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Folder, Loader2, X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { useUpdateFolder } from "@/lib/hooks/use-folders";
import type { Folder as FolderType } from "@/types";

interface RenameFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: Pick<FolderType, "id" | "nome">;
}

const MAX_NAME = 100;

/**
 * Modal para renomear uma pasta existente.
 *
 * Backend V2: `PATCH /entidades/folders/:id` body `{nome}`.
 *
 * Pré-preenche o input com o nome atual. Submit só dispara request quando
 * o nome efetivamente mudou — caso contrário fecha sem chamada (evita
 * 304-like sem efeito útil).
 */
export function RenameFolderModal({
  open,
  onOpenChange,
  folder,
}: RenameFolderModalProps) {
  const { user } = useAuth();
  const [nome, setNome] = useState(folder.nome);
  const updateMutation = useUpdateFolder();

  // Recarrega valor inicial quando o modal abre ou troca de pasta.
  useEffect(() => {
    if (open) setNome(folder.nome);
  }, [open, folder]);

  const trimmed = nome.trim();
  const hasChange = trimmed.length > 0 && trimmed !== folder.nome.trim();
  const canSubmit =
    trimmed.length > 0 &&
    trimmed.length <= MAX_NAME &&
    !updateMutation.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (!hasChange) {
      // Nada mudou — fecha sem rede.
      onOpenChange(false);
      return;
    }
    updateMutation.mutate(
      { folderId: folder.id, dto: { nome: trimmed } },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  const handleCancel = () => {
    if (updateMutation.isPending) return;
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
      onOpenChange={(o) => !updateMutation.isPending && onOpenChange(o)}
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
            <span className="truncate font-medium">Renomear pasta</span>
          </DialogTitle>
          <button
            type="button"
            onClick={handleCancel}
            disabled={updateMutation.isPending}
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
            placeholder="Novo nome"
            value={nome}
            maxLength={MAX_NAME}
            onChange={(e) => setNome(e.target.value)}
            autoFocus
            className="h-10 w-full rounded-md border-0 bg-muted/40 px-3 text-[16px] font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted/60"
          />
          <p className="text-[11px] text-muted-foreground/70">
            Os projetos vinculados a esta pasta continuam intactos.
          </p>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={updateMutation.isPending}
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
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

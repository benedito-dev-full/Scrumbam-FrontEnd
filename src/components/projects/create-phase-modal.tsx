"use client";

/**
 * Modal de criacao de bloco (fase / DTask idClasse=-200) — ADR-V2-050.
 *
 * Mesmo padrao visual do CreateFolderModal: breadcrumb com label do
 * projeto, input nome com autofocus, textarea descricao opcional,
 * Ctrl/Cmd+Enter submete, ESC fecha.
 */

import { useEffect, useState } from "react";
import { ChevronRight, Layers, Loader2, X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreatePhase } from "@/lib/hooks/use-phases";
import type { Phase } from "@/lib/api/phases";

interface CreatePhaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  /** Nome do projeto para mostrar no breadcrumb. */
  projectName?: string;
  /** Se passado, cria uma sub-fase desse pai. */
  parentPhaseId?: string;
  /** Nome do pai para mostrar no breadcrumb (so quando parentPhaseId). */
  parentPhaseName?: string;
  /** Callback opcional pos-create. */
  onCreated?: (phase: Phase) => void;
}

const MAX_NAME = 200;
const MAX_DESC = 2000;

export function CreatePhaseModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  parentPhaseId,
  parentPhaseName,
  onCreated,
}: CreatePhaseModalProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const createMutation = useCreatePhase(projectId);

  // Reseta os campos ao reabrir
  useEffect(() => {
    if (open) {
      setNome("");
      setDescricao("");
    }
  }, [open]);

  const trimmedNome = nome.trim();
  const trimmedDesc = descricao.trim();
  const canSubmit =
    trimmedNome.length >= 3 &&
    trimmedNome.length <= MAX_NAME &&
    trimmedDesc.length <= MAX_DESC &&
    !createMutation.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createMutation.mutate(
      {
        nome: trimmedNome,
        descricao: trimmedDesc || undefined,
        idPai: parentPhaseId,
      },
      {
        onSuccess: (phase) => {
          onCreated?.(phase);
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

  const isSubPhase = !!parentPhaseId;
  const title = isSubPhase ? "Novo sub-bloco" : "Novo bloco";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !createMutation.isPending && onOpenChange(o)}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg p-0 gap-0 overflow-hidden border-border"
        onKeyDown={handleKeyDown}
      >
        {/* Header com breadcrumb */}
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <DialogTitle className="flex min-w-0 items-center gap-1.5 text-[13px]">
            <span className="flex max-w-[180px] items-center gap-1.5 truncate rounded bg-violet-500/15 px-1.5 py-0.5 text-[12px] font-medium text-violet-300">
              <Layers className="h-3 w-3 shrink-0" />
              <span className="truncate">{projectName || "Projeto"}</span>
            </span>
            {isSubPhase && parentPhaseName && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                <span className="max-w-[140px] truncate text-[12px] text-muted-foreground">
                  {parentPhaseName}
                </span>
              </>
            )}
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
            <span className="truncate font-medium">{title}</span>
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
        <div className="flex-1 space-y-4 px-5 py-4">
          <div className="space-y-1.5">
            <label
              htmlFor="phase-nome"
              className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              Nome do bloco
            </label>
            <input
              id="phase-nome"
              type="text"
              placeholder="Ex: Backend — Auth & RBAC"
              value={nome}
              maxLength={MAX_NAME}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
              className="h-10 w-full rounded-md border-0 bg-muted/40 px-3 text-[15px] font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted/60"
            />
            <p className="text-[11px] text-muted-foreground/70">
              Minimo 3 caracteres. Bloco agrupa tasks do projeto.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="phase-descricao"
              className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              Descricao
              <span className="ml-1.5 text-[10px] font-normal normal-case text-muted-foreground/60">
                (opcional)
              </span>
            </label>
            <textarea
              id="phase-descricao"
              placeholder="O que este bloco entrega? Quais sao os limites e dependencias?"
              value={descricao}
              maxLength={MAX_DESC}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border-0 bg-muted/40 px-3 py-2 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted/60"
            />
            <p className="text-[11px] text-muted-foreground/70">
              {descricao.length}/{MAX_DESC} caracteres.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
          <p className="hidden sm:block text-[10.5px] text-muted-foreground/70">
            <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 text-[10px] font-mono">
              {typeof navigator !== "undefined" &&
              navigator.platform?.toLowerCase().includes("mac")
                ? "Cmd"
                : "Ctrl"}
            </kbd>{" "}
            +{" "}
            <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 text-[10px] font-mono">
              Enter
            </kbd>{" "}
            para criar
          </p>
          <div className="flex items-center gap-2">
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
              className="h-8 bg-violet-600 text-[12px] text-white hover:bg-violet-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar bloco"
              )}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

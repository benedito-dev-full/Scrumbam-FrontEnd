"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteProject } from "@/lib/hooks/use-projects";

interface DeleteProjectDialogProps {
  project: { chave: string; nome: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Callback executado apos delete bem-sucedido.
   * Use para redirect (ex: voltar para /projects do detalhe).
   */
  onSuccess?: () => void;
}

/**
 * Dialog de confirmacao GitHub-style para exclusao de projeto.
 *
 * Anti-acidente: o botao "Excluir" so habilita quando o usuario digita
 * o nome do projeto exatamente igual.
 *
 * O hook useDeleteProject ja exibe toast de sucesso/erro e invalida queries.
 */
export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
}: DeleteProjectDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const { mutate: deleteProject, isPending } = useDeleteProject();

  // Reset input ao abrir/fechar
  useEffect(() => {
    if (!open) {
      setConfirmText("");
    }
  }, [open]);

  const canDelete = confirmText.trim() === project.nome.trim() && !isPending;

  const handleDelete = () => {
    if (!canDelete) return;
    deleteProject(project.chave, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir projeto?
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <span className="block">
              Essa acao nao pode ser desfeita. Isso ira excluir permanentemente
              o projeto{" "}
              <strong className="text-foreground">{project.nome}</strong>, suas
              intencoes, membros, webhooks e notificacoes. O agente vinculado
              (se existir) sera desvinculado mas nao excluido.
            </span>
            <span className="block text-[12px] text-muted-foreground">
              O historico de execucoes (Automation) sera preservado para audit.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label
            htmlFor="confirm-project-name"
            className="text-[13px] text-muted-foreground"
          >
            Para confirmar, digite{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              {project.nome}
            </code>{" "}
            abaixo:
          </label>
          <Input
            id="confirm-project-name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={project.nome}
            autoComplete="off"
            disabled={isPending}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete}
          >
            {isPending ? "Excluindo..." : "Excluir projeto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

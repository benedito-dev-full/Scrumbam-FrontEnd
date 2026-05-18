"use client";

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
import { useDeleteFolder } from "@/lib/hooks/use-folders";
import type { Folder as FolderType } from "@/types";

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: Pick<FolderType, "id" | "nome" | "projectCount">;
  /** Callback opcional executado após delete bem-sucedido. */
  onDeleted?: () => void;
}

/**
 * Dialog de confirmação para exclusão de pasta.
 *
 * Comportamento (ADR-V2-FOLDERS-001 / CEO Q4):
 * - DProject permanece intacto — apenas o vínculo DVincula -183 é soft-deleted.
 * - Projects da pasta movem-se para "Sem pasta" (limbo).
 * - Operação reversível: criar nova pasta e mover projects de volta.
 *
 * Como o efeito é menos destrutivo que excluir um projeto, NÃO exigimos
 * digitar o nome — basta um clique confirmando. Mensagem deixa explícito
 * que projects sobrevivem.
 */
export function DeleteFolderDialog({
  open,
  onOpenChange,
  folder,
  onDeleted,
}: DeleteFolderDialogProps) {
  const { mutate: deleteFolder, isPending } = useDeleteFolder();

  const handleDelete = () => {
    if (isPending) return;
    deleteFolder(folder.id, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted?.();
      },
    });
  };

  const count = folder.projectCount ?? 0;
  const countText =
    count === 0
      ? "Esta pasta não possui projetos."
      : count === 1
        ? "1 projeto será movido para 'Sem pasta'."
        : `${count} projetos serão movidos para 'Sem pasta'.`;

  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir pasta?
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <span className="block">
              A pasta <strong className="text-foreground">{folder.nome}</strong>{" "}
              será excluída.
            </span>
            <span className="block text-foreground">{countText}</span>
            <span className="block text-[12px] text-muted-foreground">
              Nenhum projeto é apagado. Para desfazer, basta criar uma nova
              pasta e movê-los de volta.
            </span>
          </DialogDescription>
        </DialogHeader>

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
            disabled={isPending}
          >
            {isPending ? "Excluindo..." : "Excluir pasta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

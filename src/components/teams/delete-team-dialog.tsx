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
import { useDeleteTeam } from "@/lib/hooks/use-teams";
import type { Team } from "@/types/team";

interface DeleteTeamDialogProps {
  team: Team;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Dialog GitHub-style: o botao "Excluir" so habilita quando o usuario
 * digita o nome do time exatamente igual.
 *
 * useDeleteTeam ja exibe toast — incluindo a mensagem de 409 com a
 * orientacao "Desvincule os projetos do time antes de excluí-lo".
 */
export function DeleteTeamDialog({
  team,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTeamDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const { mutate: deleteTeam, isPending } = useDeleteTeam();

  useEffect(() => {
    if (!open) setConfirmText("");
  }, [open]);

  const canDelete = confirmText.trim() === team.name.trim() && !isPending;

  const handleDelete = () => {
    if (!canDelete) return;
    deleteTeam(team.id, {
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
            Excluir time?
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <span className="block">
              Essa acao nao pode ser desfeita. O time{" "}
              <strong className="text-foreground">{team.name}</strong> sera
              removido permanentemente. Membros perderao acesso aos recursos do
              time.
            </span>
            <span className="block text-[12px] text-muted-foreground">
              Se o time tiver projetos vinculados, desvincule-os antes.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label
            htmlFor="confirm-team-name"
            className="text-[13px] text-muted-foreground"
          >
            Para confirmar, digite{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              {team.name}
            </code>{" "}
            abaixo:
          </label>
          <Input
            id="confirm-team-name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={team.name}
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
            {isPending ? "Excluindo..." : "Excluir time"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

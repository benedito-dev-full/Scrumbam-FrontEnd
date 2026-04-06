"use client";

import { useState } from "react";
import {
  Pencil,
  GitPullRequest,
  Trash2,
  ArrowRight,
  CheckCheck,
  XCircle,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { IntentionDocument, IntentionStatus } from "@/types/intention";
import { useDeleteIntention, useMoveStatus } from "@/lib/hooks/use-intentions";

interface IntentionActionsProps {
  intention: IntentionDocument;
  isEditing?: boolean;
  onEditClick?: () => void;
  onCancelEdit?: () => void;
  onSaveEdit?: () => void;
  isSaving?: boolean;
}

// Status que permitem exclusao
const DELETABLE_STATUSES = new Set(["inbox", "ready"]);
const EDITABLE_STATUSES = new Set(["inbox", "ready"]);

// Transicoes possiveis por status (o que aparece como botao)
const STATUS_TRANSITIONS: Record<
  string,
  {
    label: string;
    target: IntentionStatus;
    icon: typeof ArrowRight;
    variant?: "default" | "outline" | "destructive";
  }[]
> = {
  inbox: [
    { label: "Mover para Ready", target: "ready", icon: ArrowRight },
    { label: "Descartar", target: "discarded", icon: Ban, variant: "outline" },
  ],
  ready: [
    { label: "Iniciar Execucao", target: "executing", icon: ArrowRight },
    {
      label: "Voltar para Inbox",
      target: "inbox",
      icon: ArrowRight,
      variant: "outline",
    },
    {
      label: "Cancelar",
      target: "cancelled",
      icon: XCircle,
      variant: "outline",
    },
  ],
  executing: [
    { label: "Marcar como Concluida", target: "done", icon: CheckCheck },
    {
      label: "Enviar para Validacao",
      target: "validating",
      icon: ArrowRight,
      variant: "outline",
    },
    {
      label: "Marcar como Falhou",
      target: "failed",
      icon: XCircle,
      variant: "destructive",
    },
  ],
  validating: [
    { label: "Validar (Aprovada)", target: "validated", icon: CheckCheck },
    {
      label: "Voltar para Execucao",
      target: "executing",
      icon: ArrowRight,
      variant: "outline",
    },
  ],
  failed: [{ label: "Reenviar para Ready", target: "ready", icon: ArrowRight }],
};

export function IntentionActions({
  intention,
  isEditing = false,
  onEditClick,
  onCancelEdit,
  onSaveEdit,
  isSaving = false,
}: IntentionActionsProps) {
  const { status } = intention;
  const { remove, isPending: isDeleting } = useDeleteIntention();
  const { move, isPending: isMoving } = useMoveStatus();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canDelete = DELETABLE_STATUSES.has(status);
  const canEdit = EDITABLE_STATUSES.has(status);
  const transitions = STATUS_TRANSITIONS[status] ?? [];

  const handleMove = (target: IntentionStatus) => {
    move(intention.id, target);
    toast.success(`Intencao movida para ${target}`);
  };

  const handleDelete = () => {
    remove(intention.id);
    setDeleteOpen(false);
  };

  // Modo edicao: salvar + cancelar
  if (isEditing) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Editando
        </p>
        <Button
          className="w-full gap-2"
          onClick={onSaveEdit}
          disabled={isSaving}
        >
          <Pencil className="h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar Alteracoes"}
        </Button>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={onCancelEdit}
          disabled={isSaving}
        >
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Titulo */}
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Acoes
      </p>

      {/* Botoes de transicao de status */}
      {transitions.map((t) => {
        const Icon = t.icon;
        return (
          <Button
            key={t.target}
            variant={t.variant ?? "default"}
            className="w-full gap-2"
            onClick={() => handleMove(t.target)}
            disabled={isMoving}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </Button>
        );
      })}

      {/* Editar (se permitido) */}
      {canEdit && onEditClick && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={onEditClick}
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      )}

      {/* PR link (se done) */}
      {status === "done" && intention.deliverables?.prUrl && (
        <Button variant="outline" className="w-full gap-2" asChild>
          <a
            href={intention.deliverables.prUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitPullRequest className="h-4 w-4" />
            Ver Pull Request
          </a>
        </Button>
      )}

      {/* Excluir (se permitido) */}
      {canDelete && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full gap-2 text-destructive hover:text-destructive"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir intencao?</DialogTitle>
              <DialogDescription>
                &quot;{intention.title}&quot; sera excluida. Esta acao nao pode
                ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleDelete}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

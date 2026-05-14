"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateWorkspaceForm } from "./create-workspace-form";

/**
 * Modal de criação de workspace acionável de qualquer ponto do app
 * (ex: `WorkspaceSwitcher` na sidebar).
 *
 * Diferente da tela `/orphan` (onboarding), este modal NÃO redireciona —
 * apenas atualiza o tenant ativo no store (via `CreateWorkspaceForm`) e
 * pede `router.refresh()` para re-executar server components com o novo
 * JWT. Componentes client (sidebar, switcher, queries do tanstack) já
 * reagem ao state novo automaticamente.
 */
export interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar nova workspace</DialogTitle>
          <DialogDescription>
            Você será admin da nova workspace e poderá convidar pessoas em
            seguida.
          </DialogDescription>
        </DialogHeader>

        <CreateWorkspaceForm
          autoFocus
          onCancel={() => onOpenChange(false)}
          onSuccess={() => {
            onOpenChange(false);
            toast.success("Workspace criada");
            // Re-renderiza server components com o JWT novo (organizationId
            // atualizado). Componentes client já reagem ao auth store.
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

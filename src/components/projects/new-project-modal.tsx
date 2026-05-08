"use client";

import { useState } from "react";
import {
  X,
  Loader2,
  ChevronRight,
  Play,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { projectsApi } from "@/lib/api/projects";
import { QUERY_KEYS } from "@/lib/constants";

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal de criacao de projeto.
 *
 * O backend (POST /projects) so persiste `name` + `description`. Por isso
 * o modal expoe apenas esses dois campos — qualquer outro chip (status,
 * prioridade, datas, membros) seria stub e induz o usuario ao erro de
 * achar que valores foram salvos.
 */
export function NewProjectModal({ open, onOpenChange }: NewProjectModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      projectsApi.create({
        nome: name.trim(),
        descricao: description.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      toast.success("Projeto criado");
      reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao criar projeto");
    },
  });

  const reset = () => {
    setName("");
    setDescription("");
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === "Enter" &&
      name.trim() &&
      !createMutation.isPending
    ) {
      e.preventDefault();
      createMutation.mutate();
    }
  };

  const workspaceLabel = user?.orgNome || "Workspace";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl p-0 gap-0 max-h-[85vh] overflow-hidden border-border"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-border">
          <DialogTitle className="flex items-center gap-1.5 text-[13px] min-w-0">
            <span className="flex items-center gap-1.5 rounded px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 text-[12px] font-medium truncate max-w-[200px]">
              <Play className="h-3 w-3 fill-emerald-400 shrink-0" />
              <span className="truncate">{workspaceLabel}</span>
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <span className="font-medium truncate">Novo projeto</span>
          </DialogTitle>
          <button
            type="button"
            onClick={handleCancel}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
          {/* Name */}
          <input
            type="text"
            placeholder="Nome do projeto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="h-10 w-full rounded-md bg-muted/40 px-3 text-[18px] font-semibold text-foreground outline-none border-0 placeholder:text-muted-foreground/50 focus:bg-muted/60 transition-colors"
          />

          {/* Description */}
          <textarea
            placeholder="Descreva o projeto, escopo, objetivo..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full rounded-md bg-muted/40 px-3 py-2 text-[13px] text-foreground outline-none border-0 placeholder:text-muted-foreground/50 focus:bg-muted/60 transition-colors resize-none"
          />
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="text-[12px] h-8"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            className="text-[12px] h-8 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar projeto"
            )}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

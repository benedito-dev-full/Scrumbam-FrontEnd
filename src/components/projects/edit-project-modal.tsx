"use client";

import { useEffect, useState } from "react";
import { X, Loader2, ChevronRight, Play } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/hooks/use-auth";
import { useMyTeams } from "@/lib/hooks/use-teams";
import { useUpdateProject } from "@/lib/hooks/use-projects";
import type { Project } from "@/types";

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

const NO_TEAM_VALUE = "__none__";

/**
 * Modal de edicao de projeto.
 *
 * Campos editaveis: nome, descricao, time. Membros sao gerenciados via
 * endpoint proprio (`/projects/:id/members`) na pagina de detalhe.
 *
 * Pre-preenchido com `initialData` (Project). Reset volta aos valores iniciais
 * (nao esvazia o form). Submit envia apenas campos modificados.
 *
 * Diferencas vs NewProjectModal:
 * - Sem multi-select de membros (decisao de produto: evita conflito com endpoint dedicado)
 * - "Sem time" desvincula explicitamente (envia `teamId: null` ao backend — ADR-V2-029)
 */
export function EditProjectModal({
  open,
  onOpenChange,
  project,
}: EditProjectModalProps) {
  const { user } = useAuth();

  const [name, setName] = useState(project.nome);
  const [description, setDescription] = useState(project.descricao ?? "");
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    project.teamId ?? "",
  );

  const { data: teams } = useMyTeams();
  const updateMutation = useUpdateProject();

  // Quando o projeto mudar (modal reaberto com outra row) ou abrir, recarrega
  // os valores iniciais para evitar arrastar estado entre instancias.
  useEffect(() => {
    if (open) {
      setName(project.nome);
      setDescription(project.descricao ?? "");
      setSelectedTeamId(project.teamId ?? "");
    }
  }, [open, project]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    // Constroi DTO com apenas os campos que mudaram (preserva semantica null vs undefined)
    const dto: {
      nome?: string;
      descricao?: string;
      teamId?: string | null;
    } = {};

    if (trimmedName !== project.nome) {
      dto.nome = trimmedName;
    }

    const trimmedDesc = description.trim();
    const currentDesc = project.descricao ?? "";
    if (trimmedDesc !== currentDesc) {
      dto.descricao = trimmedDesc;
    }

    const currentTeamId = project.teamId ?? "";
    if (selectedTeamId !== currentTeamId) {
      // teamId canonico do V2 (ADR-V2-029):
      //  - "Sem time" -> null explicito (desvincula).
      //  - id do time -> reatribui.
      dto.teamId = selectedTeamId === "" ? null : selectedTeamId;
    }

    // Sem alteracoes: simplesmente fecha modal
    if (Object.keys(dto).length === 0) {
      onOpenChange(false);
      return;
    }

    updateMutation.mutate(
      { id: project.chave, dto },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === "Enter" &&
      name.trim() &&
      !updateMutation.isPending
    ) {
      e.preventDefault();
      handleSubmit();
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
            <span className="font-medium truncate">Editar projeto</span>
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

          {/* Time (opcional) */}
          <div className="space-y-1">
            <label className="text-[12px] font-medium text-muted-foreground">
              Time
            </label>
            <Select
              value={selectedTeamId || NO_TEAM_VALUE}
              onValueChange={(v) =>
                setSelectedTeamId(v === NO_TEAM_VALUE ? "" : v)
              }
            >
              <SelectTrigger className="h-9 text-[13px] bg-muted/40 border-0 focus:bg-muted/60">
                <SelectValue placeholder="Sem time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TEAM_VALUE}>Sem time</SelectItem>
                {teams?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground/70">
              Selecionar &quot;Sem time&quot; desvincula o projeto do time
              atual.
            </p>
          </div>

          {/* Membros sao gerenciados na pagina do projeto (nao aqui) */}
          <p className="text-[11px] text-muted-foreground/70 pt-1">
            Membros do projeto sao gerenciados na pagina de detalhes do projeto.
          </p>
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
            onClick={handleSubmit}
            disabled={!name.trim() || updateMutation.isPending}
            className="text-[12px] h-8 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

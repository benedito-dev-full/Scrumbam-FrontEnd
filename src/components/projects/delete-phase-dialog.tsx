"use client";

/**
 * DeletePhaseDialog — confirmacao destrutiva para arquivar uma fase.
 *
 * UX:
 *   - Previa de impacto (metricas + sub-fases) puxada em tempo real
 *   - Warning forte quando ha tasks executing/failed (perda em andamento)
 *   - Transparencia: backend faz soft-delete (excluido=true) cascateado,
 *     mas nao expoe restore via HTTP — UI assume "ate aqui" e avisa o user
 *   - Botao destrutivo em rose-600 (Tailwind destrutivo padrao)
 *   - Esc fecha; Enter NAO confirma (acao destrutiva precisa click explicito)
 */

import { AlertTriangle, Layers, Loader2, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePhaseMetrics, useDeletePhase } from "@/lib/hooks/use-phases";
import { cn } from "@/lib/utils";

interface DeletePhaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  phase: {
    id: string;
    nome: string;
    idPai?: string | null;
  };
  /** Quantidade de sub-fases (calculado no parent a partir da lista). */
  subPhasesCount?: number;
  /** Callback opcional apos delete bem-sucedido. */
  onDeleted?: () => void;
}

export function DeletePhaseDialog({
  open,
  onOpenChange,
  projectId,
  phase,
  subPhasesCount = 0,
  onDeleted,
}: DeletePhaseDialogProps) {
  // Metrics ja vem do cache compartilhado (preenchidas pelo dashboard).
  // Sem refetch desnecessario aqui.
  const { data: metrics } = usePhaseMetrics(phase.id);
  const deleteMutation = useDeletePhase(projectId);

  const total = metrics?.total ?? 0;
  const inProgress = metrics?.inProgress ?? 0;
  const failed = metrics?.failed ?? 0;
  const done = metrics?.done ?? 0;
  const hasInFlight = inProgress > 0 || failed > 0;

  const handleConfirm = () => {
    if (deleteMutation.isPending) return;
    deleteMutation.mutate(
      { phaseId: phase.id, idPai: phase.idPai },
      {
        onSuccess: () => {
          onOpenChange(false);
          onDeleted?.();
        },
      },
    );
  };

  const handleCancel = () => {
    if (deleteMutation.isPending) return;
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !deleteMutation.isPending && onOpenChange(o)}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md p-0 gap-0 overflow-hidden border-rose-500/30"
      >
        {/* Header destrutivo */}
        <header className="flex items-center gap-3 border-b border-rose-500/20 bg-rose-500/5 px-5 py-3.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
            <Trash2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-[14px] font-semibold text-zinc-100">
              Excluir bloco?
            </DialogTitle>
            <DialogDescription className="text-[11.5px] text-zinc-500">
              Esta acao arquiva o bloco e tudo dentro dele.
            </DialogDescription>
          </div>
        </header>

        {/* Body — nome + impacto */}
        <div className="space-y-3 px-5 py-4">
          {/* Nome do bloco em destaque */}
          <div className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2">
            <p className="text-[10.5px] font-medium uppercase tracking-wide text-zinc-500">
              Bloco
            </p>
            <p className="truncate text-[14px] font-semibold text-zinc-100">
              {phase.nome}
            </p>
          </div>

          {/* Previa de impacto */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Sera arquivado em cascata:
            </p>
            <ul className="space-y-1 text-[12.5px] text-zinc-300">
              {subPhasesCount > 0 && (
                <li className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-violet-400/70" />
                  <span className="tabular-nums">{subPhasesCount}</span>
                  <span className="text-zinc-400">
                    sub-{subPhasesCount === 1 ? "bloco" : "blocos"}
                  </span>
                </li>
              )}
              {total > 0 ? (
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                  <span className="tabular-nums">{total}</span>
                  <span className="text-zinc-400">
                    {total === 1 ? "task" : "tasks"} no total
                  </span>
                  <span className="ml-auto text-[11px] text-zinc-600">
                    {done} concluida{done !== 1 ? "s" : ""}
                  </span>
                </li>
              ) : (
                <li className="text-[12px] italic text-zinc-600">
                  Nenhuma task neste bloco.
                </li>
              )}
            </ul>
          </div>

          {/* Warning forte quando ha atividade em andamento */}
          {hasInFlight && (
            <div
              className={cn(
                "flex items-start gap-2 rounded-md border px-3 py-2",
                "border-amber-500/30 bg-amber-500/10",
              )}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[12px] font-medium text-amber-300">
                  Atencao: ha trabalho em andamento
                </p>
                <p className="text-[11px] leading-relaxed text-amber-200/80">
                  {inProgress > 0 && (
                    <>
                      <span className="font-semibold tabular-nums">
                        {inProgress}
                      </span>{" "}
                      em execucao
                    </>
                  )}
                  {inProgress > 0 && failed > 0 && " · "}
                  {failed > 0 && (
                    <>
                      <span className="font-semibold tabular-nums">
                        {failed}
                      </span>{" "}
                      com falha
                    </>
                  )}
                  {" — tudo sera arquivado."}
                </p>
              </div>
            </div>
          )}

          {/* Nota de transparencia */}
          <p className="text-[10.5px] leading-relaxed text-zinc-600">
            O arquivamento e por marcador (soft delete). Os dados ficam no
            banco, mas <strong className="text-zinc-500">nao ha undo</strong>{" "}
            pela interface — restore requer suporte tecnico.
          </p>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={deleteMutation.isPending}
            className="h-8 text-[12px]"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="h-8 bg-rose-600 text-[12px] text-white hover:bg-rose-700 focus-visible:ring-rose-500/50"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Arquivando...
              </>
            ) : (
              <>
                <Trash2 className="mr-1.5 h-3 w-3" />
                Excluir bloco
              </>
            )}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

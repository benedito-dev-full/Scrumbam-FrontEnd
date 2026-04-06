"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSetAppetite, useExtendAppetite } from "@/lib/hooks/use-card-detail";
import { AlertTriangle, Plus } from "lucide-react";
import { differenceInDays } from "date-fns";
import type { Task } from "@/types";
import { STATUS } from "@/lib/constants";

interface CardAppetiteIndicatorProps {
  task: Task;
  projectId: string;
}

export function CardAppetiteIndicator({
  task,
  projectId,
}: CardAppetiteIndicatorProps) {
  const setAppetite = useSetAppetite(projectId);
  const extendAppetite = useExtendAppetite(projectId);

  const [showSetDialog, setShowSetDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [dias, setDias] = useState("");
  const [justificativa, setJustificativa] = useState("");

  const isDone = task.status.chave === STATUS.DONE;

  const handleSetAppetite = () => {
    const d = parseInt(dias, 10);
    if (isNaN(d) || d <= 0) return;
    setAppetite.mutate(
      { taskId: task.chave, dias: d },
      {
        onSuccess: () => {
          setShowSetDialog(false);
          setDias("");
        },
      },
    );
  };

  const handleExtend = () => {
    const d = parseInt(dias, 10);
    if (isNaN(d) || d <= 0 || !justificativa.trim()) return;
    extendAppetite.mutate(
      { taskId: task.chave, dias: d, justificativa: justificativa.trim() },
      {
        onSuccess: () => {
          setShowExtendDialog(false);
          setDias("");
          setJustificativa("");
        },
      },
    );
  };

  // No appetite defined
  if (task.apetiteDias == null) {
    if (isDone) return null;
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSetDialog(true)}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Definir apetite
        </Button>

        <Dialog open={showSetDialog} onOpenChange={setShowSetDialog}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Definir Apetite</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Quantos dias para completar esta task?
              </label>
              <Input
                type="number"
                min={1}
                value={dias}
                onChange={(e) => setDias(e.target.value)}
                placeholder="Ex: 5"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                onClick={handleSetAppetite}
                disabled={
                  !dias || parseInt(dias, 10) <= 0 || setAppetite.isPending
                }
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Appetite defined - calculate progress
  const diasDecorridos = task.apetiteInicio
    ? differenceInDays(new Date(), new Date(task.apetiteInicio))
    : 0;
  const percentual = Math.min(
    Math.round((diasDecorridos / task.apetiteDias) * 100),
    150,
  );
  const estourado = percentual >= 100;
  const diasExcedidos = diasDecorridos - task.apetiteDias;

  let barColor = "bg-green-500 dark:bg-green-600";
  if (percentual >= 100) barColor = "bg-red-500 dark:bg-red-600";
  else if (percentual >= 80) barColor = "bg-amber-500 dark:bg-amber-600";
  else if (percentual >= 50) barColor = "bg-yellow-500 dark:bg-yellow-600";

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {estourado
              ? `Estourou por ${diasExcedidos} dia(s)`
              : `${diasDecorridos} de ${task.apetiteDias} dias`}
          </span>
          <span className="text-lg font-bold tabular-nums">{percentual}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
            style={{ width: `${Math.min(percentual, 100)}%` }}
          />
        </div>
      </div>

      {estourado && (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Apetite excedido por {diasExcedidos} dia(s)
        </Badge>
      )}

      {!isDone && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setDias("");
            setJustificativa("");
            setShowExtendDialog(true);
          }}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Estender
        </Button>
      )}

      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Estender Apetite</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Dias adicionais
              </label>
              <Input
                type="number"
                min={1}
                value={dias}
                onChange={(e) => setDias(e.target.value)}
                placeholder="Ex: 3"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Justificativa (obrigatoria)
              </label>
              <Textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Por que estender?"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleExtend}
              disabled={
                !dias ||
                parseInt(dias, 10) <= 0 ||
                !justificativa.trim() ||
                extendAppetite.isPending
              }
            >
              Estender
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

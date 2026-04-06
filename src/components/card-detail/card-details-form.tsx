"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useColumns, useTasks } from "@/lib/hooks/use-projects";
import { PRIORITY_CONFIG, TYPE_CONFIG } from "@/lib/constants";
import { User, Flag, Tag, Columns3, Clock, Save, Bot } from "lucide-react";
import type { Task, UpdateTaskDto } from "@/types";
import { useState } from "react";

interface CardDetailsFormProps {
  task: Task;
  projectId: string;
  onUpdate: (dto: UpdateTaskDto) => void;
  onMoveStatus: (idStatus: string) => void;
}

export function CardDetailsForm({
  task,
  projectId,
  onUpdate,
  onMoveStatus,
}: CardDetailsFormProps) {
  const { data: columns } = useColumns(projectId);
  const { data: tasks } = useTasks(projectId);
  const [manualHours, setManualHours] = useState(
    task.estimativaHoras?.toString() ?? "",
  );

  // Extract unique assignees from existing tasks
  const assignees = useMemo(() => {
    if (!tasks) return [];
    const seen = new Map<string, { nome: string; isAIAgent: boolean }>();
    for (const t of tasks) {
      if (t.assignee && !seen.has(t.assignee.chave)) {
        seen.set(t.assignee.chave, {
          nome: t.assignee.nome,
          isAIAgent: !!t.assignee.isAIAgent,
        });
      }
    }
    return Array.from(seen.entries()).map(([chave, info]) => ({
      chave,
      nome: info.nome,
      isAIAgent: info.isAIAgent,
    }));
  }, [tasks]);

  const handleSaveHours = () => {
    const hours = parseInt(manualHours, 10);
    if (!isNaN(hours) && hours > 0) {
      onUpdate({ estimativaHoras: hours });
    }
  };

  return (
    <div className="space-y-3">
      {/* Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 w-28 shrink-0">
          <Columns3 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Status</span>
        </div>
        <Select
          value={task.status.chave}
          onValueChange={(val) => onMoveStatus(val)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {columns?.map((col) => (
              <SelectItem key={col.chave} value={col.chave}>
                <div className="flex items-center gap-2">
                  {col.cor && (
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: col.cor }}
                    />
                  )}
                  {col.nome}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Prioridade */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 w-28 shrink-0">
          <Flag className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Prioridade</span>
        </div>
        <Select
          value={task.prioridade?.chave ?? "none"}
          onValueChange={(val) =>
            onUpdate({ idPrioridade: val === "none" ? undefined : val })
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Sem prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem prioridade</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tipo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 w-28 shrink-0">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Tipo</span>
        </div>
        <Select
          value={task.tipoTask?.chave ?? "none"}
          onValueChange={(val) =>
            onUpdate({ idTipoTask: val === "none" ? undefined : val })
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Sem tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem tipo</SelectItem>
            {Object.entries(TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 w-28 shrink-0">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Responsavel</span>
        </div>
        <Select
          value={task.assignee?.chave ?? "none"}
          onValueChange={(val) =>
            onUpdate({ idAssignee: val === "none" ? undefined : val })
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Sem responsavel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem responsavel</SelectItem>
            {assignees.map((a) => (
              <SelectItem key={a.chave} value={a.chave}>
                <div className="flex items-center gap-2">
                  {a.isAIAgent && (
                    <Bot className="h-3.5 w-3.5 text-violet-600" />
                  )}
                  {a.nome}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Estimativa manual */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 w-28 shrink-0">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Estimativa</span>
        </div>
        <div className="flex items-center gap-1.5 flex-1">
          <Input
            type="number"
            min={1}
            value={manualHours}
            onChange={(e) => setManualHours(e.target.value)}
            placeholder="horas"
            className="h-8 text-sm w-20"
          />
          <span className="text-xs text-muted-foreground">h</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={handleSaveHours}
            disabled={!manualHours || parseInt(manualHours, 10) <= 0}
          >
            <Save className="h-3.5 w-3.5" />
          </Button>
          {task.estimativaIA != null && (
            <span className="text-xs text-muted-foreground ml-1">
              IA: ~{task.estimativaIA}h
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

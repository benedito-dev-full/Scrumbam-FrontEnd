"use client";

import { useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/common/priority-badge";
import { TypeBadge } from "@/components/common/type-badge";
import { SectionHeader } from "@/components/common/section-header";
import { CardTitleEditor } from "./card-title-editor";
import { CardDescriptionEditor } from "./card-description-editor";
import { CardDetailsForm } from "./card-details-form";
import { CardTagsEditor } from "./card-tags-editor";
import { CardAppetiteIndicator } from "./card-appetite-indicator";
import { CardComments } from "./card-comments";
import { CardIntentionDoc } from "./card-intention-doc";
import { FileText, Settings2, Tags, Timer, MessageSquare } from "lucide-react";
import {
  useUpdateTask,
  useMoveTaskStatusFromDetail,
} from "@/lib/hooks/use-card-detail";
import type { Task, UpdateTaskDto } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CardDetailSheetProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export function CardDetailSheet({
  task,
  open,
  onClose,
  projectId,
}: CardDetailSheetProps) {
  const updateTask = useUpdateTask(projectId);
  const moveStatus = useMoveTaskStatusFromDetail(projectId);

  const handleUpdate = useCallback(
    (dto: UpdateTaskDto) => {
      if (!task) return;
      updateTask.mutate({ taskId: task.chave, dto });
    },
    [task, updateTask],
  );

  const handleTitleSave = useCallback(
    (titulo: string) => {
      if (!task) return;
      updateTask.mutate({ taskId: task.chave, dto: { titulo } });
    },
    [task, updateTask],
  );

  const handleDescriptionSave = useCallback(
    (descricao: string) => {
      if (!task) return;
      updateTask.mutate({ taskId: task.chave, dto: { descricao } });
    },
    [task, updateTask],
  );

  const handleMoveStatus = useCallback(
    (idStatus: string) => {
      if (!task) return;
      moveStatus.mutate({ taskId: task.chave, idStatus });
    },
    [task, moveStatus],
  );

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" responsive className="overflow-y-auto p-0">
        {!task ? (
          /* Skeleton loading state */
          <div className="p-6 space-y-4">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="h-px bg-border" />
            <Skeleton className="h-24 w-full" />
            <div className="h-px bg-border" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Header */}
            <SheetHeader className="px-4 sm:px-6 pt-6 pb-0">
              <SheetTitle className="sr-only">Detalhes do Card</SheetTitle>
              <SheetDescription className="sr-only">
                Edite os detalhes desta task
              </SheetDescription>
              <div className="space-y-2">
                <CardTitleEditor task={task} onSave={handleTitleSave} />
                <div className="flex flex-wrap items-center gap-1.5">
                  {task.tipoTask && <TypeBadge typeId={task.tipoTask.chave} />}
                  {task.prioridade && (
                    <PriorityBadge priorityId={task.prioridade.chave} />
                  )}
                  <Badge variant="outline" className="text-[10px] font-mono">
                    #{task.chave}
                  </Badge>
                </div>
              </div>
            </SheetHeader>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-1 mt-4">
              {/* Description */}
              <SectionHeader icon={FileText} title="Descricao">
                <CardDescriptionEditor
                  task={task}
                  onSave={handleDescriptionSave}
                />
              </SectionHeader>

              <div className="h-px bg-border my-2" />

              {/* Intention Doc -- collapsible, starts closed */}
              <SectionHeader
                icon={FileText}
                title="Documento de Intencao"
                collapsible
                defaultOpen={false}
              >
                <div className="mt-2">
                  <CardIntentionDoc task={task} projectId={projectId} />
                </div>
              </SectionHeader>

              <div className="h-px bg-border my-2" />

              {/* Details Form */}
              <SectionHeader icon={Settings2} title="Detalhes">
                <div className="mt-2">
                  <CardDetailsForm
                    task={task}
                    projectId={projectId}
                    onUpdate={handleUpdate}
                    onMoveStatus={handleMoveStatus}
                  />
                </div>
              </SectionHeader>

              <div className="h-px bg-border my-2" />

              {/* Tags */}
              <SectionHeader icon={Tags} title="Tags">
                <div className="mt-2">
                  <CardTagsEditor task={task} projectId={projectId} />
                </div>
              </SectionHeader>

              <div className="h-px bg-border my-2" />

              {/* Appetite / Circuit Breaker */}
              <SectionHeader icon={Timer} title="Apetite">
                <div className="mt-2">
                  <CardAppetiteIndicator task={task} projectId={projectId} />
                </div>
              </SectionHeader>

              <div className="h-px bg-border my-2" />

              {/* Comments */}
              <SectionHeader icon={MessageSquare} title="Comentarios">
                <div className="mt-2">
                  <CardComments taskId={task.chave} />
                </div>
              </SectionHeader>

              {/* Footer metadata */}
              <div className="pt-4 text-xs text-muted-foreground space-y-0.5 font-mono">
                <p>
                  Criado{" "}
                  {formatDistanceToNow(new Date(task.criadoEm), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
                <p>
                  Atualizado{" "}
                  {formatDistanceToNow(new Date(task.atualizadoEm), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

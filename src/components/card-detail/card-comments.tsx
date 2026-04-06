"use client";

import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useComments, useAddComment } from "@/lib/hooks/use-card-detail";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CardCommentsProps {
  taskId: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Simple hash to generate a consistent color index from a name */
function nameToColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_COLORS.length;
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400",
];

export function CardComments({ taskId }: CardCommentsProps) {
  const { data: comments, isLoading, isError } = useComments(taskId);
  const addComment = useAddComment(taskId);
  const [text, setText] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addComment.mutate({ texto: trimmed }, { onSuccess: () => setText("") });
  }, [text, addComment]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  if (isError) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Comentarios em breve -- endpoint nao disponivel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Adicionar comentario... (Enter para enviar)"
          className="min-h-[60px] resize-none text-sm"
          rows={2}
        />
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 self-end"
          onClick={handleSubmit}
          disabled={!text.trim() || addComment.isPending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && comments && comments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Nenhum comentario ainda.
        </p>
      )}

      {/* Timeline with vertical line */}
      {!isLoading && comments && comments.length > 0 && (
        <div className="relative max-h-64 overflow-y-auto">
          {/* Vertical line */}
          <div className="absolute left-[13px] top-4 bottom-4 w-px bg-border" />

          <div className="space-y-4">
            {comments.map((comment) => {
              const colorIdx = nameToColorIndex(comment.autor.nome);
              return (
                <div key={comment.chave} className="flex gap-3 relative">
                  <Avatar className="h-7 w-7 shrink-0 z-10 ring-2 ring-background">
                    <AvatarFallback
                      className={`text-[9px] font-semibold ${AVATAR_COLORS[colorIdx]}`}
                    >
                      {getInitials(comment.autor.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium truncate">
                        {comment.autor.nome}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(comment.criadoEm), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <p className="text-sm mt-0.5 whitespace-pre-wrap break-words text-muted-foreground">
                      {comment.texto}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

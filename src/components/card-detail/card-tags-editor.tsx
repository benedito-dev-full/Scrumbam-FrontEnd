"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTags } from "@/lib/hooks/use-projects";
import {
  useAddTag,
  useRemoveTag,
  useCreateTag,
} from "@/lib/hooks/use-card-detail";
import { Plus, X } from "lucide-react";
import type { Task } from "@/types";

interface CardTagsEditorProps {
  task: Task;
  projectId: string;
}

export function CardTagsEditor({ task, projectId }: CardTagsEditorProps) {
  const { data: allTags } = useTags();
  const addTag = useAddTag(projectId);
  const removeTag = useRemoveTag(projectId);
  const createTag = useCreateTag();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const taskTagIds = new Set(task.tags.map((t) => t.chave));

  const filteredTags = (allTags ?? []).filter(
    (tag) =>
      !taskTagIds.has(tag.chave) &&
      tag.nome.toLowerCase().includes(search.toLowerCase()),
  );

  const showCreateOption =
    search.trim().length > 0 &&
    !(allTags ?? []).some(
      (t) => t.nome.toLowerCase() === search.trim().toLowerCase(),
    );

  const handleAddTag = (tagId: string) => {
    addTag.mutate({ taskId: task.chave, tagId });
  };

  const handleRemoveTag = (tagId: string) => {
    removeTag.mutate({ taskId: task.chave, tagId });
  };

  const handleCreateTag = () => {
    const nome = search.trim();
    if (!nome) return;
    createTag.mutate(
      { nome },
      {
        onSuccess: (newTag) => {
          addTag.mutate({ taskId: task.chave, tagId: newTag.chave });
          setSearch("");
        },
      },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {task.tags.map((tag) => (
          <Badge
            key={tag.chave}
            variant="outline"
            className="gap-1 pr-1"
            style={{
              borderColor: tag.cor ?? undefined,
              color: tag.cor ?? undefined,
            }}
          >
            {tag.nome}
            <button
              onClick={() => handleRemoveTag(tag.chave)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted/80 transition-colors"
              aria-label={`Remover tag ${tag.nome}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-1.5 gap-1">
              <Plus className="h-3.5 w-3.5" />
              <span className="text-xs">Adicionar</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ou criar tag..."
              className="h-7 text-xs mb-2"
              autoFocus
            />
            <div className="max-h-32 overflow-y-auto space-y-0.5">
              {filteredTags.map((tag) => (
                <button
                  key={tag.chave}
                  onClick={() => {
                    handleAddTag(tag.chave);
                    setSearch("");
                  }}
                  className="flex items-center gap-2 w-full rounded px-2 py-1 text-sm hover:bg-muted transition-colors text-left"
                >
                  {tag.cor && (
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: tag.cor }}
                    />
                  )}
                  {tag.nome}
                </button>
              ))}
              {filteredTags.length === 0 && !showCreateOption && (
                <p className="text-xs text-muted-foreground px-2 py-1">
                  Nenhuma tag encontrada
                </p>
              )}
              {showCreateOption && (
                <button
                  onClick={handleCreateTag}
                  className="flex items-center gap-2 w-full rounded px-2 py-1 text-sm hover:bg-muted transition-colors text-left text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Criar &quot;{search.trim()}&quot;
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

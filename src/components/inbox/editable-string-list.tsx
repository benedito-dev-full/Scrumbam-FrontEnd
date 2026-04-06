"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EditableStringListProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export function EditableStringList({
  items,
  onChange,
  placeholder = "Adicionar item...",
}: EditableStringListProps) {
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (items.includes(trimmed)) return; // avoid duplicates
    onChange([...items, trimmed]);
    setDraft("");
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      {/* Existing items */}
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm"
            >
              <span className="flex-1 min-w-0 truncate">{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new item */}
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="text-sm h-8"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!draft.trim()}
          className="shrink-0 h-8 w-8 p-0"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

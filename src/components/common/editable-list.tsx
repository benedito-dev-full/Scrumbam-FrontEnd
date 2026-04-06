"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditableListProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
}

export function EditableList({
  items,
  onChange,
  placeholder,
  label,
  disabled = false,
}: EditableListProps) {
  const [draft, setDraft] = useState("");

  const addItem = () => {
    if (!draft.trim()) return;
    onChange([...items, draft.trim()]);
    setDraft("");
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Existing items */}
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm"
            >
              <span className="flex-1">{item}</span>
              {!disabled && (
                <button
                  onClick={() => removeItem(idx)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new */}
      {!disabled && (
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem();
              }
            }}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={addItem}
            disabled={!draft.trim()}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

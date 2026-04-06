"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { Task } from "@/types";

interface CardDescriptionEditorProps {
  task: Task;
  onSave: (descricao: string) => void;
}

export function CardDescriptionEditor({
  task,
  onSave,
}: CardDescriptionEditorProps) {
  const [value, setValue] = useState(task.descricao ?? "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    setValue(task.descricao ?? "");
  }, [task.descricao]);

  const flushSave = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      setSaveStatus("idle");

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        if (newValue !== (task.descricao ?? "")) {
          setSaveStatus("saving");
          onSaveRef.current(newValue);
          setTimeout(() => setSaveStatus("saved"), 500);
          setTimeout(() => setSaveStatus("idle"), 2500);
        }
      }, 1500);
    },
    [task.descricao],
  );

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        // Save current value if there's a pending change
        const currentVal =
          document.querySelector<HTMLTextAreaElement>(
            "[data-description-editor]",
          )?.value ?? "";
        if (currentVal && currentVal !== (task.descricao ?? "")) {
          onSaveRef.current(currentVal);
        }
      }
    };
  }, [task.descricao]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">
          Descricao
        </label>
        {saveStatus === "saving" && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Salvando...
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="text-xs text-green-600 dark:text-green-400">
            Salvo
          </span>
        )}
      </div>
      <Textarea
        data-description-editor
        value={value}
        onChange={handleChange}
        onBlur={() => {
          flushSave();
          if (value !== (task.descricao ?? "")) {
            setSaveStatus("saving");
            onSave(value);
            setTimeout(() => setSaveStatus("saved"), 500);
            setTimeout(() => setSaveStatus("idle"), 2500);
          }
        }}
        placeholder="Adicione uma descricao..."
        className="min-h-[120px] resize-y"
      />
    </div>
  );
}

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import type { Task } from "@/types";

interface CardTitleEditorProps {
  task: Task;
  onSave: (titulo: string) => void;
}

export function CardTitleEditor({ task, onSave }: CardTitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(task.titulo);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(task.titulo);
  }, [task.titulo]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== task.titulo) {
      onSave(trimmed);
    } else {
      setValue(task.titulo);
    }
  }, [value, task.titulo, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        setIsEditing(false);
        setValue(task.titulo);
      }
    },
    [handleSave, task.titulo],
  );

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="text-lg font-semibold h-auto py-1"
      />
    );
  }

  return (
    <h2
      role="button"
      tabIndex={0}
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") setIsEditing(true);
      }}
      className="text-lg font-semibold cursor-text rounded px-1 -mx-1 hover:bg-muted/50 transition-colors"
    >
      {task.titulo}
    </h2>
  );
}

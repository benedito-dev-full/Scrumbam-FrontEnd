"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateTask } from "@/lib/hooks/use-card-detail";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import type { Task } from "@/types";

interface CardIntentionDocProps {
  task: Task;
  projectId: string;
}

interface IntentionField {
  key: keyof Pick<
    Task,
    | "problema"
    | "contexto"
    | "solucaoProposta"
    | "criteriosAceite"
    | "naoObjetivos"
    | "riscos"
  >;
  label: string;
  placeholder: string;
}

const FIELDS: IntentionField[] = [
  {
    key: "problema",
    label: "Problema",
    placeholder: "Qual problema esta intenção resolve?",
  },
  {
    key: "contexto",
    label: "Contexto",
    placeholder: "Contexto e background relevante",
  },
  {
    key: "solucaoProposta",
    label: "Solucao Proposta",
    placeholder: "Como pretendemos resolver?",
  },
  {
    key: "criteriosAceite",
    label: "Criterios de Aceite",
    placeholder: "Como saber que esta pronto?",
  },
  {
    key: "naoObjetivos",
    label: "Nao-Objetivos",
    placeholder: "O que NÃO faz parte desta intenção?",
  },
  {
    key: "riscos",
    label: "Riscos",
    placeholder: "Riscos e dependencias identificados",
  },
];

function DebouncedTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (newVal: string) => {
      setLocalValue(newVal);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onChange(newVal);
      }, 800);
    },
    [onChange],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <Textarea
      value={localValue}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      className="text-xs min-h-[50px] resize-y"
    />
  );
}

export function CardIntentionDoc({ task, projectId }: CardIntentionDocProps) {
  const [expanded, setExpanded] = useState(false);
  const updateTask = useUpdateTask(projectId);

  const hasAnyContent = FIELDS.some((f) => task[f.key]);

  const handleFieldUpdate = useCallback(
    (key: string, value: string) => {
      updateTask.mutate({ taskId: task.chave, dto: { [key]: value } });
    },
    [task.chave, updateTask],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <FileText className="h-3.5 w-3.5" />
          Documento de Intencao
          {hasAnyContent && (
            <span className="text-[10px] text-primary">(preenchido)</span>
          )}
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="space-y-3">
          {FIELDS.map((field) => (
            <div key={field.key} className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">
                {field.label}
              </Label>
              <DebouncedTextarea
                value={task[field.key] ?? ""}
                onChange={(val) => handleFieldUpdate(field.key, val)}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

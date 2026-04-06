"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { WizardFormData } from "./intention-wizard";
import type { IntentionType, IntentionPriority } from "@/types/intention";

interface Props {
  form: WizardFormData;
  onUpdate: (partial: Partial<WizardFormData>) => void;
}

const TYPES: Array<{ value: IntentionType; label: string }> = [
  { value: "code", label: "Codigo" },
  { value: "analysis", label: "Analise" },
  { value: "documentation", label: "Documentacao" },
  { value: "test", label: "Teste" },
  { value: "review", label: "Review" },
  { value: "refactor", label: "Refatoracao" },
];

const PRIORITIES: Array<{
  value: IntentionPriority;
  label: string;
  color: string;
}> = [
  { value: "urgent", label: "Urgente", color: "var(--priority-urgent)" },
  { value: "high", label: "Alta", color: "var(--priority-high)" },
  { value: "medium", label: "Media", color: "var(--priority-medium)" },
  { value: "low", label: "Baixa", color: "var(--priority-low)" },
];

export function WizardStepConfig({ form, onUpdate }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Configurar intencao</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Defina tipo, prioridade e apetite da intencao
        </p>
      </div>

      {/* Tipo */}
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select
          value={form.type}
          onValueChange={(v) => onUpdate({ type: v as IntentionType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Prioridade */}
      <div className="space-y-2">
        <Label>Prioridade</Label>
        <Select
          value={form.priority}
          onValueChange={(v) => onUpdate({ priority: v as IntentionPriority })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Apetite */}
      <div className="space-y-2">
        <Label htmlFor="apetite">
          Apetite (dias){" "}
          <span className="text-muted-foreground font-normal">
            — vale ate quantos dias de investimento?
          </span>
        </Label>
        <Input
          id="apetite"
          type="number"
          min={1}
          max={30}
          value={form.apetiteDias}
          onChange={(e) =>
            onUpdate({
              apetiteDias: Math.max(1, parseInt(e.target.value) || 1),
            })
          }
          className="w-32"
        />
      </div>
    </div>
  );
}

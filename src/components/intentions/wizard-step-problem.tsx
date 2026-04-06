"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { WizardFormData } from "./intention-wizard";

interface Props {
  form: WizardFormData;
  onUpdate: (partial: Partial<WizardFormData>) => void;
}

export function WizardStepProblem({ form, onUpdate }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          Qual problema voce quer resolver?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Descreva o problema que motivou esta intencao
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Titulo *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Ex: Implementar autenticacao OAuth Google"
          className="text-base"
        />
      </div>

      {/* Problema */}
      <div className="space-y-2">
        <Label htmlFor="problema">Problema *</Label>
        <Textarea
          id="problema"
          value={form.problema}
          onChange={(e) => onUpdate({ problema: e.target.value })}
          placeholder="Descreva o problema que voce quer resolver..."
          className="min-h-[120px]"
        />
      </div>

      {/* Contexto */}
      <div className="space-y-2">
        <Label htmlFor="contexto">
          Contexto{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Textarea
          id="contexto"
          value={form.contexto}
          onChange={(e) => onUpdate({ contexto: e.target.value })}
          placeholder="Background tecnico, decisoes anteriores, constraints..."
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}

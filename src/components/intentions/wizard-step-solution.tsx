"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EditableList } from "@/components/common/editable-list";
import type { WizardFormData } from "./intention-wizard";

interface Props {
  form: WizardFormData;
  onUpdate: (partial: Partial<WizardFormData>) => void;
}

export function WizardStepSolution({ form, onUpdate }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Como vamos resolver?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Descreva a solucao e os criterios de sucesso
        </p>
      </div>

      {/* Solucao Proposta */}
      <div className="space-y-2">
        <Label htmlFor="solucao">Solucao Proposta</Label>
        <Textarea
          id="solucao"
          value={form.solucaoProposta}
          onChange={(e) => onUpdate({ solucaoProposta: e.target.value })}
          placeholder="Integrar Google OAuth via passport-google-oauth20..."
          className="min-h-[100px]"
        />
      </div>

      {/* Criterios de Aceite */}
      <EditableList
        items={form.criteriosAceite}
        onChange={(criteriosAceite) => onUpdate({ criteriosAceite })}
        placeholder="Botao 'Entrar com Google' na tela de login"
        label="Criterios de Aceite"
      />

      {/* Nao-Objetivos */}
      <EditableList
        items={form.naoObjetivos}
        onChange={(naoObjetivos) => onUpdate({ naoObjetivos })}
        placeholder="NAO implementar Apple Sign-In nesta iteracao"
        label="Nao-Objetivos"
      />

      {/* Riscos */}
      <EditableList
        items={form.riscos}
        onChange={(riscos) => onUpdate({ riscos })}
        placeholder="Dependencia do Google Cloud Console"
        label="Riscos"
      />
    </div>
  );
}

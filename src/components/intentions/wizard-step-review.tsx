"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WizardFormData } from "./intention-wizard";

interface Props {
  form: WizardFormData;
}

const TYPE_LABELS: Record<string, string> = {
  code: "Codigo",
  analysis: "Analise",
  documentation: "Documentacao",
  test: "Teste",
  review: "Review",
  refactor: "Refatoracao",
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Baixa",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "var(--priority-urgent)",
  high: "var(--priority-high)",
  medium: "var(--priority-medium)",
  low: "var(--priority-low)",
};

function EmptyField() {
  return (
    <span className="text-sm text-muted-foreground italic">Nao informado</span>
  );
}

function ListPreview({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <EmptyField />;
  }

  return (
    <ul className="list-disc list-inside space-y-1 text-sm">
      {items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  );
}

export function WizardStepReview({ form }: Props) {
  const hasCriterios = form.criteriosAceite.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Revise sua intencao</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Confira os dados antes de criar. Voce pode voltar para editar qualquer
          step.
        </p>
      </div>

      {/* Aviso se criterios vazios */}
      {!hasCriterios && (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Recomendado: adicione pelo menos 1 criterio de aceite (Step 2)
        </div>
      )}

      {/* Documento de Intencao */}
      <Card className="gap-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Documento de Intencao</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Titulo */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Titulo
            </p>
            <p className="text-sm font-medium">{form.title}</p>
          </div>

          {/* Problema */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Problema
            </p>
            <p className="text-sm whitespace-pre-wrap">{form.problema}</p>
          </div>

          {/* Contexto */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Contexto
            </p>
            {form.contexto.trim() ? (
              <p className="text-sm whitespace-pre-wrap">{form.contexto}</p>
            ) : (
              <EmptyField />
            )}
          </div>

          {/* Solucao Proposta */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Solucao Proposta
            </p>
            {form.solucaoProposta.trim() ? (
              <p className="text-sm whitespace-pre-wrap">
                {form.solucaoProposta}
              </p>
            ) : (
              <EmptyField />
            )}
          </div>

          {/* Criterios de Aceite */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Criterios de Aceite
            </p>
            <ListPreview items={form.criteriosAceite} />
          </div>

          {/* Nao-Objetivos */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Nao-Objetivos
            </p>
            <ListPreview items={form.naoObjetivos} />
          </div>

          {/* Riscos */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Riscos
            </p>
            <ListPreview items={form.riscos} />
          </div>
        </CardContent>
      </Card>

      {/* Configuracao */}
      <Card className="gap-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Configuracao</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Tipo
              </p>
              <Badge variant="outline">
                {TYPE_LABELS[form.type] ?? form.type}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Prioridade
              </p>
              <Badge variant="outline" className="gap-1.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      PRIORITY_COLORS[form.priority] ?? "var(--muted)",
                  }}
                />
                {PRIORITY_LABELS[form.priority] ?? form.priority}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Apetite
              </p>
              <span className="font-medium">{form.apetiteDias} dias</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

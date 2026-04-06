"use client";

import { CheckCircle2, Circle, AlertTriangle, Ban } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { EditableList } from "@/components/common/editable-list";
import type { IntentionDocument } from "@/types/intention";

interface IntentionDocViewProps {
  intention: IntentionDocument;
  editable?: boolean;
  editForm?: Partial<IntentionDocument>;
  onUpdate?: (partial: Partial<IntentionDocument>) => void;
}

export function IntentionDocView({
  intention,
  editable = false,
  editForm,
  onUpdate,
}: IntentionDocViewProps) {
  const isEditing = editable && editForm && onUpdate;

  // Resolve field values: editing uses editForm, otherwise intention
  const problema = isEditing
    ? (editForm.problema ?? intention.problema)
    : intention.problema;
  const contexto = isEditing
    ? (editForm.contexto ?? intention.contexto)
    : intention.contexto;
  const solucaoProposta = isEditing
    ? (editForm.solucaoProposta ?? intention.solucaoProposta)
    : intention.solucaoProposta;
  const criteriosAceite = isEditing
    ? (editForm.criteriosAceite ?? intention.criteriosAceite)
    : intention.criteriosAceite;
  const naoObjetivos = isEditing
    ? (editForm.naoObjetivos ?? intention.naoObjetivos)
    : intention.naoObjetivos;
  const riscos = isEditing
    ? (editForm.riscos ?? intention.riscos)
    : intention.riscos;

  return (
    <div className="space-y-6">
      {/* Problema */}
      <DocSection title="Problema">
        {isEditing ? (
          <Textarea
            value={problema}
            onChange={(e) => onUpdate({ problema: e.target.value })}
            placeholder="Descreva o problema..."
            className="min-h-[80px] text-sm"
          />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {problema || (
              <span className="italic text-muted-foreground">
                Nenhum problema descrito ainda.
              </span>
            )}
          </p>
        )}
      </DocSection>

      {/* Contexto */}
      {(isEditing || contexto) && (
        <DocSection title="Contexto">
          {isEditing ? (
            <Textarea
              value={contexto}
              onChange={(e) => onUpdate({ contexto: e.target.value })}
              placeholder="Background e contexto..."
              className="min-h-[60px] text-sm"
            />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {contexto}
            </p>
          )}
        </DocSection>
      )}

      {/* Solucao Proposta */}
      {(isEditing || solucaoProposta) && (
        <DocSection title="Solucao Proposta">
          {isEditing ? (
            <Textarea
              value={solucaoProposta}
              onChange={(e) => onUpdate({ solucaoProposta: e.target.value })}
              placeholder="Como pretende resolver..."
              className="min-h-[60px] text-sm"
            />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {solucaoProposta}
            </p>
          )}
        </DocSection>
      )}

      {/* Criterios de Aceite */}
      {(isEditing || criteriosAceite.length > 0) && (
        <DocSection title="Criterios de Aceite">
          {isEditing ? (
            <EditableList
              items={criteriosAceite}
              onChange={(items) => onUpdate({ criteriosAceite: items })}
              placeholder="Adicionar criterio de aceite..."
              label=""
            />
          ) : (
            <ul className="space-y-2">
              {criteriosAceite.map((criterio, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  {intention.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-[var(--status-done)]" />
                  ) : (
                    <Circle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="leading-relaxed">{criterio}</span>
                </li>
              ))}
            </ul>
          )}
        </DocSection>
      )}

      {/* Nao-Objetivos */}
      {(isEditing || naoObjetivos.length > 0) && (
        <DocSection title="Nao-Objetivos">
          {isEditing ? (
            <EditableList
              items={naoObjetivos}
              onChange={(items) => onUpdate({ naoObjetivos: items })}
              placeholder="Adicionar nao-objetivo..."
              label=""
            />
          ) : (
            <ul className="space-y-2">
              {naoObjetivos.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Ban className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </DocSection>
      )}

      {/* Riscos */}
      {(isEditing || riscos.length > 0) && (
        <DocSection title="Riscos">
          {isEditing ? (
            <EditableList
              items={riscos}
              onChange={(items) => onUpdate({ riscos: items })}
              placeholder="Adicionar risco..."
              label=""
            />
          ) : (
            <ul className="space-y-2">
              {riscos.map((risco, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-[var(--priority-medium)]" />
                  <span className="leading-relaxed">{risco}</span>
                </li>
              ))}
            </ul>
          )}
        </DocSection>
      )}
    </div>
  );
}

function DocSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

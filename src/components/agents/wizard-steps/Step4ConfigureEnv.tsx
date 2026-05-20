"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardState } from "../VpsInstallWizard";

interface Step4ConfigureEnvProps {
  state: WizardState;
  onNext: () => void;
}

/**
 * Step 4 — Configurar credenciais.
 * Stub: input mascarado para ANTHROPIC_API_KEY.
 * Lógica real (PUT /agents/:id/env + confirmação) vem na Fase 5.
 */
export function Step4ConfigureEnv({
  state: _state,
  onNext: _onNext,
}: Step4ConfigureEnvProps) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1">
        <h2 className="text-[14px] font-medium">Configurar credenciais</h2>
        <p className="text-[13px] text-muted-foreground">
          Informe a chave de API do Anthropic para que o agente possa executar
          tarefas com Claude.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="anthropic-api-key" className="text-[13px]">
          ANTHROPIC_API_KEY
        </Label>
        <Input
          id="anthropic-api-key"
          type="password"
          placeholder="sk-ant-..."
          autoComplete="off"
          disabled
          className="font-mono text-[13px]"
        />
        <p className="text-[12px] text-muted-foreground">
          Sua chave nunca e armazenada no Scrumban — e enviada diretamente
          para a VPS via HMAC.
        </p>
      </div>

      <p className="text-[12px] text-muted-foreground">
        Envio real (PUT /agents/:id/env) implementado na Fase 5.
      </p>
    </div>
  );
}

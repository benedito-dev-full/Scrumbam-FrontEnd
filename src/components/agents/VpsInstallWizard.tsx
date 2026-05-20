"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Step1VpsInfo } from "./wizard-steps/Step1VpsInfo";
import { Step2Command } from "./wizard-steps/Step2Command";
import { Step3WaitingHandshake } from "./wizard-steps/Step3WaitingHandshake";
import { Step4ConfigureEnv } from "./wizard-steps/Step4ConfigureEnv";
import { Step5Done } from "./wizard-steps/Step5Done";

// ============================================================
// Types — máquina de estados do wizard
// ============================================================

export type WizardStep =
  | "COLLECTING_VPS_INFO"
  | "COMMAND_READY"
  | "WAITING_HANDSHAKE"
  | "CONFIGURING_ENV"
  | "DONE"
  | "ERROR";

export interface WizardState {
  step: WizardStep;
  installTokenId: string | null;
  agentId: string | null;
  vpsHostname: string;
  /** Nome amigável da VPS (ex: "prod-01"), usado para criar o agente. */
  vpsLabel: string;
  errorStep: WizardStep | null;
}

const INITIAL_STATE: WizardState = {
  step: "COLLECTING_VPS_INFO",
  installTokenId: null,
  agentId: null,
  vpsHostname: "",
  vpsLabel: "",
  errorStep: null,
};

// ============================================================
// Mapa de steps para exibição de progresso
// ============================================================

const STEP_ORDER: WizardStep[] = [
  "COLLECTING_VPS_INFO",
  "COMMAND_READY",
  "WAITING_HANDSHAKE",
  "CONFIGURING_ENV",
  "DONE",
];

const STEP_LABELS: Record<WizardStep, string> = {
  COLLECTING_VPS_INFO: "Informações",
  COMMAND_READY: "Instalar",
  WAITING_HANDSHAKE: "Aguardar",
  CONFIGURING_ENV: "Credenciais",
  DONE: "Concluído",
  ERROR: "Erro",
};

// ============================================================
// Props
// ============================================================

interface VpsInstallWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================
// Componente principal
// ============================================================

/**
 * Modal wizard step-by-step para conectar uma VPS ao Scrumban.
 *
 * Estado interno: WizardState (máquina de estados).
 * Lógica real de API é adicionada nas Fases 3-5.
 * Este scaffold (Fase 2) implementa apenas estrutura e navegação.
 */
export function VpsInstallWizard({ open, onOpenChange }: VpsInstallWizardProps) {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  // ── helpers ──────────────────────────────────────────────

  function resetWizard() {
    setState(INITIAL_STATE);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetWizard();
    onOpenChange(nextOpen);
  }

  function goToStep(step: WizardStep) {
    setState((prev) => ({ ...prev, step }));
  }

  // ── navegação entre steps ─────────────────────────────────

  function handleNext(updates?: Partial<WizardState>) {
    const current = STEP_ORDER.indexOf(state.step);
    if (current === -1 || current >= STEP_ORDER.length - 1) return;
    setState((prev) => ({ ...prev, ...updates, step: STEP_ORDER[current + 1] }));
  }

  function handleAgentConnected(agentId: string) {
    setState((prev) => ({
      ...prev,
      agentId,
      step: "CONFIGURING_ENV",
    }));
  }

  function handleClose() {
    handleOpenChange(false);
  }

  // ── progresso ─────────────────────────────────────────────

  const currentStepIndex = STEP_ORDER.indexOf(state.step);
  const totalSteps = STEP_ORDER.length;
  // currentStepIndex === -1 se step === "ERROR" — mostrar sem quebrar
  const displayIndex = currentStepIndex === -1 ? totalSteps : currentStepIndex + 1;

  // ── step content ──────────────────────────────────────────

  function renderStep() {
    switch (state.step) {
      case "COLLECTING_VPS_INFO":
        // Step1 controla o próprio avanço (valida campos antes de chamar onNext)
        return <Step1VpsInfo state={state} onNext={handleNext} />;
      case "COMMAND_READY":
        // Step2 controla o próprio avanço (aguarda token gerado antes de onNext)
        return <Step2Command state={state} onNext={handleNext} />;
      case "WAITING_HANDSHAKE":
        return (
          <Step3WaitingHandshake
            state={state}
            onAgentConnected={handleAgentConnected}
          />
        );
      case "CONFIGURING_ENV":
        return <Step4ConfigureEnv state={state} onNext={handleNext} />;
      case "DONE":
        return <Step5Done state={state} onClose={handleClose} />;
      case "ERROR":
        return (
          <div className="space-y-3 py-4">
            <p className="text-[13px] text-destructive font-medium">
              Ocorreu um erro durante a instalação.
            </p>
            <p className="text-[12px] text-muted-foreground">
              Tente novamente ou consulte o runbook de instalação.
            </p>
          </div>
        );
    }
  }

  // ── botão primário por step ───────────────────────────────
  //
  // Step1 e Step2 rendem seus próprios botões internamente.
  // O footer só mostra botão para DONE e steps futuros (Step4+).

  const isDone = state.step === "DONE";
  const isWaiting = state.step === "WAITING_HANDSHAKE";
  const isError = state.step === "ERROR";
  const stepOwnsButton =
    state.step === "COLLECTING_VPS_INFO" || state.step === "COMMAND_READY";

  function renderPrimaryButton() {
    if (isDone) {
      return (
        <Button size="sm" onClick={handleClose} className="text-[13px]">
          Fechar
        </Button>
      );
    }
    // Step1, Step2 e Step3 controlam a navegação internamente
    if (isWaiting || stepOwnsButton) {
      return null;
    }
    return (
      <Button
        size="sm"
        onClick={() => handleNext()}
        disabled={isError}
        className="text-[13px]"
      >
        {isError ? "Tentar novamente" : "Próximo"}
      </Button>
    );
  }

  // ── render ────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[15px]">Conectar VPS</DialogTitle>
            <span className="text-[12px] text-muted-foreground tabular-nums">
              Passo {displayIndex} de {totalSteps}
            </span>
          </div>

          {/* Barra de progresso */}
          <div className="flex gap-1 pt-1">
            {STEP_ORDER.map((s, i) => (
              <div
                key={s}
                className={[
                  "h-0.5 flex-1 rounded-full transition-colors",
                  i < displayIndex ? "bg-foreground" : "bg-border",
                ].join(" ")}
                aria-label={STEP_LABELS[s]}
              />
            ))}
          </div>
        </DialogHeader>

        {/* Conteúdo do step */}
        <div className="min-h-[160px]">{renderStep()}</div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-[13px] text-muted-foreground"
          >
            Cancelar
          </Button>

          <div className="flex items-center gap-2">
            {renderPrimaryButton()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

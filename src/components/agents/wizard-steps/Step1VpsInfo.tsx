"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { WizardState } from "../VpsInstallWizard";

interface Step1VpsInfoProps {
  state: WizardState;
  onNext: (updates?: Partial<WizardState>) => void;
}

/**
 * Valida hostname/IPv4.
 * Aceita: nomes de host RFC-válidos (ex: prod-01.example.com) ou IPv4 simples.
 */
function isValidHostname(value: string): boolean {
  if (!value) return false;
  // IPv4
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4.test(value)) {
    const parts = value.split(".").map(Number);
    return parts.every((n) => n >= 0 && n <= 255);
  }
  // Hostname: labels separados por ponto, cada label [a-z0-9-], sem começar/terminar com hífen
  const hostname =
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  return hostname.test(value);
}

/**
 * Step 1 — Informações da VPS.
 * Coleta nome amigável (vpsLabel) e hostname/IP (vpsHostname).
 * Avança apenas quando ambos os campos estão válidos.
 */
export function Step1VpsInfo({ state: _state, onNext }: Step1VpsInfoProps) {
  const [label, setLabel] = useState("");
  const [hostname, setHostname] = useState("");
  const [hostnameError, setHostnameError] = useState("");

  const labelValid = label.trim().length > 0;
  const hostnameValid = isValidHostname(hostname.trim());
  const canAdvance = labelValid && hostnameValid;

  function handleHostnameBlur() {
    if (hostname.trim() && !hostnameValid) {
      setHostnameError("Informe um hostname válido ou IPv4 (ex: 203.0.113.10)");
    } else {
      setHostnameError("");
    }
  }

  function handleHostnameChange(v: string) {
    setHostname(v);
    if (hostnameError && isValidHostname(v.trim())) {
      setHostnameError("");
    }
  }

  function handleSubmit() {
    if (!canAdvance) return;
    onNext({ vpsHostname: hostname.trim(), vpsLabel: label.trim() });
  }

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1">
        <h2 className="text-[14px] font-medium">Informações da VPS</h2>
        <p className="text-[13px] text-muted-foreground">
          Informe os dados da VPS para gerar o comando de instalação do agente.
        </p>
      </div>

      <div className="space-y-3">
        {/* Nome da VPS */}
        <div className="space-y-1.5">
          <Label htmlFor="vps-label" className="text-[13px]">
            Nome da VPS
          </Label>
          <Input
            id="vps-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="prod-01"
            autoComplete="off"
            className="text-[13px]"
          />
          <p className="text-[12px] text-muted-foreground">
            Um nome amigável para identificar esta VPS no Scrumban.
          </p>
        </div>

        {/* Hostname / IP */}
        <div className="space-y-1.5">
          <Label htmlFor="vps-hostname" className="text-[13px]">
            Hostname / IP
          </Label>
          <Input
            id="vps-hostname"
            value={hostname}
            onChange={(e) => handleHostnameChange(e.target.value)}
            onBlur={handleHostnameBlur}
            placeholder="203.0.113.10 ou prod-01.example.com"
            autoComplete="off"
            className={[
              "text-[13px] font-mono",
              hostnameError ? "border-destructive focus-visible:ring-destructive" : "",
            ].join(" ")}
          />
          {hostnameError ? (
            <p className="text-[12px] text-destructive">{hostnameError}</p>
          ) : (
            <p className="text-[12px] text-muted-foreground">
              Endereço IPv4 ou hostname DNS acessível pelo backend.
            </p>
          )}
        </div>
      </div>

      {/* Botão de avanço — Step1 controla quando avançar */}
      <div className="flex justify-end pt-1">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!canAdvance}
          className="text-[13px]"
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { agentEnvApi } from "@/lib/api/agent-env";
import type { WizardState } from "../VpsInstallWizard";

interface Step4ConfigureEnvProps {
  state: WizardState;
  onNext: () => void;
}

/**
 * Step 4 — Configurar credenciais.
 * Envia ANTHROPIC_API_KEY para a VPS via PUT /agents/:id/env.
 * O valor da key fica APENAS em useState local — nunca em localStorage.
 */
export function Step4ConfigureEnv({ state, onNext }: Step4ConfigureEnvProps) {
  const [apiKey, setApiKey] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      agentEnvApi.setEnv(state.agentId!, { anthropicApiKey: apiKey }),
    onSuccess: async () => {
      // Limpar a chave da memória imediatamente após envio bem-sucedido
      setApiKey("");

      // Confirmar que hasAnthropicKey === true (best-effort, timeout 5s)
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const status = await agentEnvApi.getEnvStatus(state.agentId!);
        clearTimeout(timer);
        if (!status.hasAnthropicKey) {
          // Backend confirmou mas flag ainda false — avançar mesmo assim
          toast.warning("Chave enviada, mas confirmação ainda pendente.");
        }
      } catch {
        // Timeout ou erro de rede — avançar sem bloquear
      }

      onNext();
    },
    onError: () => {
      toast.error("Erro ao enviar a chave. Verifique a conexão com a VPS e tente novamente.");
    },
  });

  const isDisabled = apiKey.trim() === "" || mutation.isPending;

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
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={mutation.isPending}
          className="font-mono text-[13px]"
        />
        <p className="text-[12px] text-muted-foreground">
          Sua chave nunca é armazenada no Scrumban — é enviada diretamente
          para a VPS via HMAC.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={isDisabled}
          className="text-[13px] gap-1.5"
        >
          {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {mutation.isPending ? "Salvando..." : "Salvar e continuar"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { agentsApi, type CreateAgentResponse } from "@/lib/api/agents";

interface GenerateInput {
  nome: string;
}

/**
 * Hook que encapsula a geração de install-token via agentsApi.create().
 *
 * Expõe:
 *  - `generate(input)` — dispara POST /agents/install-token
 *  - `data`            — CreateAgentResponse | null (após geração bem-sucedida)
 *  - `isPending`       — true enquanto a requisição está em andamento
 *  - `error`           — Error | null em caso de falha
 *  - `reset()`         — limpa data + error para permitir "Gerar novo token"
 *
 * Sem toast aqui: o componente Step2Command decide como comunicar erros
 * (via sonner) para ter controle total do feedback visual.
 */
export function useInstallCommand() {
  const [data, setData] = useState<CreateAgentResponse | null>(null);

  const mutation = useMutation<CreateAgentResponse, Error, GenerateInput>({
    mutationFn: (input) => agentsApi.create({ nome: input.nome }),
    onSuccess: (result) => {
      setData(result);
    },
  });

  const generate = useCallback(
    (input: GenerateInput) => {
      mutation.mutate(input);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutation.mutate],
  );

  const reset = useCallback(() => {
    setData(null);
    mutation.reset();
  }, [mutation]);

  return {
    generate,
    data,
    isPending: mutation.isPending,
    error: mutation.error,
    reset,
  };
}

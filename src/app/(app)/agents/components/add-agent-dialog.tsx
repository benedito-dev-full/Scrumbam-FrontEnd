"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateAgent } from "@/lib/hooks/use-agents";
import { InstallSnippet } from "./install-snippet";
import type { CreateAgentResponse } from "@/lib/api/agents";

/**
 * Modal "Adicionar agente" — fluxo em 2 passos:
 *
 * 1. Admin digita nome.
 * 2. Backend cria agente + retorna `oneLineInstall`.
 * 3. Modal exibe comando copiavel + lembrete de TTL 10 min.
 */
export function AddAgentDialog() {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [created, setCreated] = useState<CreateAgentResponse | null>(null);

  const mutation = useCreateAgent();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || nome.length < 3) return;
    mutation.mutate(
      { nome: nome.trim() },
      {
        onSuccess: (data) => setCreated(data),
      },
    );
  };

  const handleClose = () => {
    setOpen(false);
    setNome("");
    setCreated(null);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Adicionar agente
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) handleClose();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {!created ? (
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Cadastrar novo agente remoto</DialogTitle>
                <DialogDescription>
                  Após cadastrar, copie o comando one-liner e execute na VPS.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-nome">Nome do agente</Label>
                  <Input
                    id="agent-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="VPS-marta-padaria"
                    minLength={3}
                    maxLength={100}
                    autoFocus
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Sugestão: incluir contexto na nomenclatura (ex: nome do
                    cliente, função do servidor).
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={mutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Criando..." : "Criar agente"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Agente criado: {created.nome}</DialogTitle>
                <DialogDescription>
                  Copie o comando abaixo e execute na sua VPS como{" "}
                  <span className="font-semibold">root</span>. Token de
                  instalação válido por 10 minutos.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <ol className="ml-4 list-decimal space-y-3 text-sm">
                  <li>
                    <span className="font-medium">Copie o comando:</span>
                    <div className="mt-2">
                      <InstallSnippet
                        command={created.oneLineInstall}
                        expiresAt={created.installTokenExp}
                      />
                    </div>
                  </li>
                  <li>
                    <span className="font-medium">
                      Conecte-se à VPS por SSH como root:
                    </span>
                    <pre className="mt-2 rounded bg-muted p-2 text-xs font-mono">
                      ssh root@sua-vps.example.com
                    </pre>
                  </li>
                  <li>
                    <span className="font-medium">Cole e rode o comando.</span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      O instalador cria user dedicado, baixa o daemon, registra
                      no Argus e abre o túnel SSH.
                    </p>
                  </li>
                  <li>
                    <span className="font-medium">
                      Aguarde aparecer &quot;online&quot; nesta tela
                    </span>{" "}
                    (até 60s).
                  </li>
                </ol>
              </div>
              <DialogFooter>
                <Button onClick={handleClose}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

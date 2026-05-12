"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface InstallSnippetProps {
  command: string;
  expiresAt?: string;
}

/**
 * Bloco de comando one-liner copiavel.
 *
 * Replica padrao usado em /projects/setup. O TTL de 10 min do token
 * e exibido em destaque pra urgencia.
 */
export function InstallSnippet({ command, expiresAt }: InstallSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    toast.success("Comando copiado para a área de transferência");
    setTimeout(() => setCopied(false), 2000);
  };

  const expiresMsg = expiresAt
    ? `Token expira em ${new Date(expiresAt).toLocaleTimeString("pt-BR")}`
    : null;

  return (
    <div className="space-y-2">
      <div className="relative rounded-md border bg-muted p-3">
        <pre className="overflow-x-auto whitespace-pre-wrap break-all pr-12 text-xs font-mono text-foreground">
          {command}
        </pre>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="absolute right-2 top-2 h-7 gap-1.5"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copiar
            </>
          )}
        </Button>
      </div>
      {expiresMsg && (
        <p className="text-xs text-amber-700 font-medium">⚠ {expiresMsg}</p>
      )}
    </div>
  );
}

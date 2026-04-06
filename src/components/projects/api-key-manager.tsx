"use client";

import { useState } from "react";
import { Key, Copy, Check, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  useApiKeyInfo,
  useGenerateApiKey,
  useRevokeApiKey,
} from "@/lib/hooks/use-api-key";

interface ApiKeyManagerProps {
  projectId: string;
}

export function ApiKeyManager({ projectId }: ApiKeyManagerProps) {
  const { data: keyInfo, isLoading } = useApiKeyInfo(projectId);
  const generateMutation = useGenerateApiKey(projectId);
  const revokeMutation = useRevokeApiKey(projectId);

  // Local state — key plaintext only lives here, never persisted
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    generateMutation.mutate(undefined, {
      onSuccess: (data) => {
        setGeneratedKey(data.key);
        setShowKeyModal(true);
      },
    });
  };

  const handleCopyKey = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    toast.success("API Key copiada");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseKeyModal = () => {
    setShowKeyModal(false);
    setGeneratedKey(null);
    setCopied(false);
  };

  const handleRevoke = () => {
    revokeMutation.mutate(undefined, {
      onSuccess: () => {
        setShowRevokeDialog(false);
      },
    });
  };

  if (isLoading) {
    return <Skeleton className="h-7 w-40" />;
  }

  // No key — show generate button
  if (!keyInfo?.hasKey) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            handleGenerate();
          }}
          disabled={generateMutation.isPending}
        >
          <Key className="h-3 w-3" />
          {generateMutation.isPending ? "Gerando..." : "Gerar API Key"}
        </Button>

        {/* Modal: key generated */}
        <GeneratedKeyModal
          open={showKeyModal}
          generatedKey={generatedKey}
          copied={copied}
          onCopy={handleCopyKey}
          onClose={handleCloseKeyModal}
        />
      </>
    );
  }

  // Has key — show prefix + badge + revoke button
  return (
    <>
      <div
        className="flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-mono text-muted-foreground">
          <Key className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[120px]">{keyInfo.prefix}</span>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] text-green-500 border-green-500/30 bg-green-500/10"
        >
          Ativa
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            setShowRevokeDialog(true);
          }}
          disabled={revokeMutation.isPending}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Dialog: confirm revoke */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent
          showCloseButton={false}
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Revogar API Key
            </DialogTitle>
            <DialogDescription>
              Esta acao e irreversivel. A key sera permanentemente invalidada e
              qualquer integracao que a utilize deixara de funcionar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRevokeDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={revokeMutation.isPending}
            >
              {revokeMutation.isPending ? "Revogando..." : "Revogar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: key generated (also reachable from generate flow) */}
      <GeneratedKeyModal
        open={showKeyModal}
        generatedKey={generatedKey}
        copied={copied}
        onCopy={handleCopyKey}
        onClose={handleCloseKeyModal}
      />
    </>
  );
}

// ============================================================
// Sub-component: Generated Key Modal
// ============================================================

function GeneratedKeyModal({
  open,
  generatedKey,
  copied,
  onCopy,
  onClose,
}: {
  open: boolean;
  generatedKey: string | null;
  copied: boolean;
  onCopy: (e: React.MouseEvent) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-green-500" />
            API Key Gerada
          </DialogTitle>
          <DialogDescription>
            Copie esta key agora. Ela nao sera exibida novamente.
          </DialogDescription>
        </DialogHeader>

        {/* Warning */}
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Importante: Esta e a unica vez que a key sera exibida. Salve-a em um
            local seguro antes de fechar esta janela.
          </p>
        </div>

        {/* Key display */}
        {generatedKey && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/70 border border-border/50 p-3">
            <code className="flex-1 text-xs font-mono break-all text-foreground/90 select-all">
              {generatedKey}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 h-8 gap-1.5"
              onClick={onCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            Cole no{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
              .env
            </code>{" "}
            do seu projeto:
          </p>
          <div className="rounded-lg bg-muted/70 border border-border/50 p-2">
            <code className="text-xs font-mono text-foreground/90">
              SCRUMBAN_API_KEY={generatedKey ? generatedKey : "sua_key_aqui"}
            </code>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Entendi, ja copiei
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

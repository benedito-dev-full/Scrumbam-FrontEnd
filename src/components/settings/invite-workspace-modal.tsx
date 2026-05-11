"use client";

import { useState } from "react";
import { X, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAddOrgMember } from "@/lib/hooks/use-organization";
import { cn } from "@/lib/utils";

interface InviteWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InviteResult {
  email: string;
  status: "ok" | "error";
  errorMessage?: string;
}

/**
 * Modal de convite de novos membros por email (ADR-V2-028).
 *
 * Substitui o fluxo legado que criava contas com senha temporaria. Agora
 * cada email submetido dispara um convite (backend persiste token em
 * DTabela e envia email com link /invite?token=...). Rate limit 3/min
 * por org-admin no backend — o loop trata 429 explicitamente.
 */
export function InviteWorkspaceModal({
  open,
  onOpenChange,
}: InviteWorkspaceModalProps) {
  const { user } = useAuth();
  const addMember = useAddOrgMember(user?.orgId);

  const [emailsRaw, setEmailsRaw] = useState("");
  const [results, setResults] = useState<InviteResult[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const orgInitials = (user?.orgNome ?? "DT")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const reset = () => {
    setEmailsRaw("");
    setResults(null);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const parseEmails = (raw: string): string[] => {
    return raw
      .split(/[\s,;\n]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  };

  const nameFromEmail = (email: string): string => {
    const local = email.split("@")[0];
    return local
      .split(/[._-]/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  };

  const handleSubmit = async () => {
    const emails = parseEmails(emailsRaw);
    if (emails.length === 0) {
      toast.error("Digite pelo menos um email valido");
      return;
    }

    setSubmitting(true);
    const out: InviteResult[] = [];
    for (const email of emails) {
      try {
        await addMember.mutateAsync({
          name: nameFromEmail(email),
          email,
          // password ignorado pelo backend — invite gera credencial no accept
          password: "",
          role: "MEMBER",
        });
        out.push({ email, status: "ok" });
      } catch (err) {
        const httpErr = err as {
          response?: { status?: number; data?: { message?: string } };
        };
        const status = httpErr?.response?.status;
        const message =
          status === 429
            ? "Limite de convites por minuto atingido — aguarde e tente novamente."
            : status === 409
              ? (httpErr.response?.data?.message ??
                "Email ja eh membro ou ja possui convite pendente.")
              : status === 403
                ? "Voce nao eh admin desta organizacao."
                : (httpErr.response?.data?.message ??
                  "Erro ao enviar convite.");
        out.push({ email, status: "error", errorMessage: message });
      }
    }
    setSubmitting(false);
    setResults(out);

    const okCount = out.filter((r) => r.status === "ok").length;
    if (okCount > 0) {
      toast.success(
        `${okCount} convite${okCount > 1 ? "s" : ""} enviado${okCount > 1 ? "s" : ""}`,
      );
    }
    if (okCount < out.length) {
      toast.warning(`${out.length - okCount} convite(s) falharam`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg p-0 gap-0 overflow-hidden border-border"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-[14px] font-medium">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-cyan-400 to-cyan-600 text-[10px] font-bold text-black">
              {orgInitials}
            </span>
            Convidar para o workspace
          </DialogTitle>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {!results ? (
            <>
              <div className="flex items-start gap-2 rounded-md border border-border bg-card/50 px-3 py-2 text-[11px] text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p>
                  Cada email recebera um link unico de aceite. O usuario define
                  o proprio nome e senha. Convites expiram em 7 dias.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-foreground/90">
                  Emails
                </label>
                <Textarea
                  value={emailsRaw}
                  onChange={(e) => setEmailsRaw(e.target.value)}
                  placeholder="email@empresa.com, email2@empresa.com..."
                  rows={3}
                  autoFocus
                  className="text-[13px] resize-none"
                />
                <p className="text-[11px] text-muted-foreground/70">
                  Separe por virgula, espaco ou quebra de linha. Cada convite
                  cria um membro com role{" "}
                  <code className="text-[10px]">MEMBER</code>.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitting || !emailsRaw.trim()}
                  className="text-[12px] h-8 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar convites"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <ResultsView results={results} onDone={handleClose} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultsView({
  results,
  onDone,
}: {
  results: InviteResult[];
  onDone: () => void;
}) {
  const ok = results.filter((r) => r.status === "ok");
  const failed = results.filter((r) => r.status === "error");

  return (
    <div className="space-y-4">
      {ok.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] font-medium">
            {ok.length} convite{ok.length > 1 ? "s" : ""} enviado
            {ok.length > 1 ? "s" : ""}
          </p>
          <div className="rounded-md border border-border bg-card overflow-hidden divide-y divide-border">
            {ok.map((r) => (
              <div
                key={r.email}
                className="px-3 py-2 text-[12px] font-mono truncate"
              >
                {r.email}
              </div>
            ))}
          </div>
        </div>
      )}

      {failed.length > 0 && (
        <div
          className={cn(
            "rounded-md border border-destructive/30 bg-destructive/10",
            "px-3 py-2 text-[11px] text-destructive space-y-1",
          )}
        >
          <p className="font-medium">
            {failed.length} email{failed.length > 1 ? "s" : ""} falhou:
          </p>
          <ul className="list-disc ml-5">
            {failed.map((r) => (
              <li key={r.email}>
                <span className="font-mono">{r.email}</span>
                {r.errorMessage && (
                  <span className="text-destructive/80">
                    {" "}
                    — {r.errorMessage}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={onDone}
          className="text-[12px] h-8 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Concluir
        </Button>
      </div>
    </div>
  );
}

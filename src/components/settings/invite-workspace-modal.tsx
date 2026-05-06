"use client";

import { useState } from "react";
import { X, Loader2, Copy, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
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
  name: string;
  password: string;
  status: "ok" | "error";
  errorMessage?: string;
}

export function InviteWorkspaceModal({
  open,
  onOpenChange,
}: InviteWorkspaceModalProps) {
  const { user } = useAuth();
  const addMember = useAddOrgMember(user?.orgId);

  const [emailsRaw, setEmailsRaw] = useState("");
  const [results, setResults] = useState<InviteResult[] | null>(null);
  const [copied, setCopied] = useState(false);
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
    setCopied(false);
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

  const generatePassword = (): string => {
    // 16 chars, mistura letras+numeros+simbolos. Forte o suficiente como inicial.
    const charset =
      "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 16; i++) {
      pwd += charset[Math.floor(Math.random() * charset.length)];
    }
    return pwd;
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
      const name = nameFromEmail(email);
      const password = generatePassword();
      try {
        await addMember.mutateAsync({
          name,
          email,
          password,
          role: "MEMBER",
        });
        out.push({ email, name, password, status: "ok" });
      } catch (err) {
        const msg =
          (err as { response?: { status?: number; data?: { message?: string } } })
            ?.response?.data?.message ?? "Erro";
        out.push({
          email,
          name,
          password,
          status: "error",
          errorMessage: msg,
        });
      }
    }
    setSubmitting(false);
    setResults(out);

    const okCount = out.filter((r) => r.status === "ok").length;
    if (okCount > 0) {
      toast.success(
        `${okCount} conta${okCount > 1 ? "s" : ""} criada${okCount > 1 ? "s" : ""}`,
      );
    }
    if (okCount < out.length) {
      toast.warning(
        `${out.length - okCount} falhou (provavelmente email duplicado)`,
      );
    }
  };

  const copyAll = async () => {
    if (!results) return;
    const ok = results.filter((r) => r.status === "ok");
    const lines = ok.map((r) => `${r.email} | ${r.password}`).join("\n");
    try {
      await navigator.clipboard.writeText(lines);
      setCopied(true);
      toast.success("Credenciais copiadas");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Falha ao copiar");
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
            Invite to your workspace
          </DialogTitle>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {!results ? (
            <>
              {/* Gap notice */}
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p>
                  Gap #36 — sem invite por link de email. As contas sao criadas
                  agora com senha temporaria; comunique fora do sistema.
                </p>
              </div>

              {/* Emails input */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-foreground/90">
                  Email
                </label>
                <Textarea
                  value={emailsRaw}
                  onChange={(e) => setEmailsRaw(e.target.value)}
                  placeholder="email@fortalshop.com, email2@fortalshop.com..."
                  rows={3}
                  autoFocus
                  className="text-[13px] resize-none"
                />
                <p className="text-[11px] text-muted-foreground/70">
                  Separe por virgula, espaco ou quebra de linha. Cada conta
                  recebera role <code className="text-[10px]">MEMBER</code>.
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
                      Sending...
                    </>
                  ) : (
                    "Send invites"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <ResultsView
              results={results}
              copied={copied}
              onCopyAll={copyAll}
              onDone={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Results view — credenciais temporarias para distribuir
// ============================================================

function ResultsView({
  results,
  copied,
  onCopyAll,
  onDone,
}: {
  results: InviteResult[];
  copied: boolean;
  onCopyAll: () => void;
  onDone: () => void;
}) {
  const ok = results.filter((r) => r.status === "ok");
  const failed = results.filter((r) => r.status === "error");

  return (
    <div className="space-y-4">
      {ok.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-medium">
              {ok.length} conta{ok.length > 1 ? "s" : ""} criada
              {ok.length > 1 ? "s" : ""} — distribua as credenciais
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onCopyAll}
              className="text-[11px] h-7"
            >
              {copied ? (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3 w-3" />
                  Copy all
                </>
              )}
            </Button>
          </div>

          <div className="rounded-md border border-border bg-card overflow-hidden divide-y divide-border">
            {ok.map((r) => (
              <div
                key={r.email}
                className="grid grid-cols-[1fr_minmax(0,200px)] gap-3 px-3 py-2 text-[12px]"
              >
                <span className="truncate font-mono">{r.email}</span>
                <span className="truncate font-mono text-muted-foreground select-all">
                  {r.password}
                </span>
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
          Done
        </Button>
      </div>
    </div>
  );
}

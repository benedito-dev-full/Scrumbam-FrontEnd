"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AxiosError } from "axios";

import { useAuthStore } from "@/lib/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import type { User } from "@/types/auth";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  usePageTitle("Entrar");
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Informe seu email.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.login({ email, password });

      if (!data.user.entidadeId) {
        setError("Conta com dados incompletos. Contate o administrador.");
        return;
      }

      let onboardingCompleted = false;
      try {
        const me = await authApi.getMe();
        onboardingCompleted = me.onboardingCompleted ?? false;
      } catch {
        // se falhar, assume false
      }

      const user: User = {
        id: data.user.id,
        entidadeId: data.user.entidadeId,
        nome: data.user.name,
        email: data.user.email,
        role: data.user.role || "member",
        orgId: data.user.organizationId || "",
        orgNome: data.user.organizationName || "",
        onboardingCompleted,
      };

      login(user);
      router.replace("/intentions");
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          setError("Email ou senha incorretos.");
        } else {
          setError(err.response?.data?.message || "Erro ao fazer login.");
        }
      } else {
        setError("Erro de conexao. Verifique se o backend esta rodando.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Heading */}
      <div className="space-y-2 text-center">
        <h1 className="text-[28px] font-semibold tracking-tight">
          Entre no Scrumban
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Bem-vindo de volta. Preencha seus dados para continuar.
        </p>
      </div>

      {/* Google OAuth (stub) */}
      <button
        type="button"
        disabled
        title="OAuth ainda nao implementado"
        className={cn(
          "flex w-full h-10 items-center justify-center gap-2 rounded-md border border-border bg-card text-[13px] font-medium",
          "text-muted-foreground cursor-not-allowed",
        )}
      >
        <GoogleIcon />
        Continuar com Google
      </button>

      <Divider label="ou" />

      {/* Email + password */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field id="email" label="Email">
          <Input
            id="email"
            type="email"
            placeholder="voce@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
            className="h-10 text-[14px]"
          />
        </Field>

        <Field id="password" label="Senha" hint={
          <Link
            href="#"
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Esqueceu?
          </Link>
        }>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="h-10 text-[14px]"
          />
        </Field>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            <p className="text-[12px] text-destructive">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full h-10 rounded-md bg-foreground text-background text-[13px] font-medium",
            "hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {/* Footer link */}
      <p className="text-center text-[13px] text-muted-foreground">
        Nao tem uma conta?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground hover:underline underline-offset-4"
        >
          Criar agora
        </Link>
      </p>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className="text-[12px] font-medium text-foreground/90"
        >
          {label}
        </Label>
        {hint}
      </div>
      {children}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

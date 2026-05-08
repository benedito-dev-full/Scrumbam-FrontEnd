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


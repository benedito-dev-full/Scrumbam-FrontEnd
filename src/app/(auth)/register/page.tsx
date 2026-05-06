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

export default function RegisterPage() {
  usePageTitle("Criar workspace");
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [nomeOrganizacao, setNomeOrganizacao] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (nomeOrganizacao.trim().length < 3) {
      setError("Nome da workspace deve ter pelo menos 3 caracteres.");
      return;
    }
    if (nome.trim().length < 3) {
      setError("Seu nome deve ter pelo menos 3 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.register({
        nome: nome.trim(),
        email: email.trim(),
        senha: password,
        nomeOrganizacao: nomeOrganizacao.trim(),
      });

      const user: User = {
        id: data.member.chave,
        entidadeId: data.member.chave,
        nome: data.member.nome,
        email: data.member.email,
        role: "admin",
        orgId: data.organization.chave,
        orgNome: data.organization.nome,
      };

      login(user);
      router.replace("/intentions");
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 409) {
          setError("Este email ja esta em uso.");
        } else if (err.response?.status === 400) {
          const msg = err.response?.data?.message;
          if (Array.isArray(msg)) {
            setError(msg.join(". "));
          } else {
            setError(msg || "Dados invalidos. Verifique os campos.");
          }
        } else {
          setError(err.response?.data?.message || "Erro ao criar conta.");
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
          Crie seu workspace
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Configure seu time em menos de um minuto.
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field id="nomeOrganizacao" label="Nome do workspace">
          <Input
            id="nomeOrganizacao"
            type="text"
            placeholder="Minha Empresa"
            value={nomeOrganizacao}
            onChange={(e) => setNomeOrganizacao(e.target.value)}
            required
            minLength={3}
            className="h-10 text-[14px]"
          />
        </Field>

        <Field id="nome" label="Seu nome">
          <Input
            id="nome"
            type="text"
            placeholder="Joao Silva"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            minLength={3}
            className="h-10 text-[14px]"
          />
        </Field>

        <Field id="email" label="Email">
          <Input
            id="email"
            type="email"
            placeholder="voce@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-10 text-[14px]"
          />
        </Field>

        <Field id="password" label="Senha">
          <Input
            id="password"
            type="password"
            placeholder="Minimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="h-10 text-[14px]"
          />
        </Field>

        <Field id="confirmPassword" label="Confirmar senha">
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Repita sua senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
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
          {loading ? "Criando workspace..." : "Criar workspace"}
        </button>
      </form>

      <p className="text-center text-[13px] text-muted-foreground">
        Ja tem uma conta?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground hover:underline underline-offset-4"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}

// ============================================================
// Sub-components (duplicated from /login for now)
// ============================================================

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-[12px] font-medium text-foreground/90"
      >
        {label}
      </Label>
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

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
        name: nome.trim(),
        email: email.trim(),
        password,
        organizationName: nomeOrganizacao.trim(),
      });

      const user: User = {
        id: data.user.id,
        entidadeId: data.user.entidadeId ?? data.user.id,
        nome: data.user.name,
        email: data.user.email,
        role: data.user.orgRole?.toLowerCase() || data.user.role || "admin",
        orgId: data.user.organizationId || "",
        orgNome: data.user.organizationName || "",
        availableOrgs: data.user.availableOrgs ?? [],
      };

      login(user, data.accessToken, data.refreshToken);
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

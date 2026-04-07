"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrumbanLogo } from "@/components/common/scrumban-logo";
import type { User } from "@/types/auth";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { AxiosError } from "axios";

export default function RegisterPage() {
  usePageTitle("Criar Conta");
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
      setError("Nome da organizacao deve ter pelo menos 3 caracteres.");
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
    <div className="space-y-8">
      {/* Mobile-only logo */}
      <div className="lg:hidden flex justify-center">
        <ScrumbanLogo size="lg" />
      </div>

      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-bold tracking-tight">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Crie sua organizacao e comece a usar o Scrumban
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nomeOrganizacao">Nome da Organizacao</Label>
            <Input
              id="nomeOrganizacao"
              type="text"
              placeholder="Minha Empresa"
              value={nomeOrganizacao}
              onChange={(e) => setNomeOrganizacao(e.target.value)}
              required
              minLength={3}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome">Seu Nome</Label>
            <Input
              id="nome"
              type="text"
              placeholder="Joao Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              minLength={3}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="h-10"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-10 font-semibold"
            disabled={loading}
          >
            {loading ? "Criando conta..." : "Criar Conta"}
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Ja tem uma conta?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}

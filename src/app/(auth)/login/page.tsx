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
        setError(
          "Conta com dados incompletos. Contate o administrador.",
        );
        return;
      }

      const user: User = {
        id: data.user.id,
        entidadeId: data.user.entidadeId,
        nome: data.user.name,
        email: data.user.email,
        role: data.user.role || "member",
        orgId: data.user.organizationId || "",
        orgNome: data.user.organizationName || "",
      };

      login(data.accessToken, "", user);
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
    <div className="space-y-8">
      {/* Mobile-only logo */}
      <div className="lg:hidden flex justify-center">
        <ScrumbanLogo size="lg" />
      </div>

      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-bold tracking-tight">
          Bem-vindo de volta
        </h1>
        <p className="text-sm text-muted-foreground">
          Entre na sua conta para continuar
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoFocus
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <span className="text-xs text-muted-foreground cursor-not-allowed">
                Esqueceu a senha?
              </span>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Nao tem uma conta?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}

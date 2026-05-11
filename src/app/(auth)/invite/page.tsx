"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { useAuthStore } from "@/lib/stores/auth-store";
import { invitesApi, type InviteInfo } from "@/lib/api/invites";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { cn } from "@/lib/utils";
import type { User } from "@/types/auth";

/**
 * Pagina publica de aceite de convite por email (ADR-V2-028).
 *
 * Fluxo:
 *  1. Le `?token=...` da URL (search params).
 *  2. GET /invites/:token — exibe info da org + inviter + email + role.
 *     404 → tela de "convite invalido ou expirado".
 *  3. Form de nome + senha + checkbox de termos.
 *  4. POST /invites/:token/accept — backend cria conta + retorna tokens.
 *  5. Salva tokens no auth-store via `useAuthStore.login(user, access, refresh)`
 *     e redireciona para `/intentions`.
 *
 * Rota e publica (esta sob `(auth)` group — sem middleware de auth).
 */
export default function InvitePage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <InviteContent />
    </Suspense>
  );
}

function InviteContent() {
  usePageTitle("Aceitar convite");
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const inviteQuery = useQuery<InviteInfo>({
    queryKey: ["invite", token],
    queryFn: () => invitesApi.getInfo(token as string),
    enabled: !!token,
    retry: false,
  });

  if (!token) {
    return <InvalidShell message="Token de convite ausente na URL." />;
  }

  if (inviteQuery.isLoading) {
    return <LoadingShell />;
  }

  if (inviteQuery.isError || !inviteQuery.data) {
    return (
      <InvalidShell message="Convite invalido, expirado ou ja utilizado." />
    );
  }

  return <AcceptForm token={token} info={inviteQuery.data} router={router} />;
}

function AcceptForm({
  token,
  info,
  router,
}: {
  token: string;
  info: InviteInfo;
  router: ReturnType<typeof useRouter>;
}) {
  const login = useAuthStore((s) => s.login);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const acceptMutation = useMutation({
    mutationFn: () => invitesApi.accept(token, { name, password }),
    onSuccess: (data) => {
      const user: User = {
        id: data.user.id,
        entidadeId: data.user.entidadeId ?? "",
        nome: data.user.name,
        email: data.user.email,
        role: data.user.role || "member",
        orgId: data.user.organizationId || "",
        orgNome: data.user.organizationName || "",
      };
      login(user, data.accessToken, data.refreshToken);
      router.replace(data.redirectTo || "/intentions");
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        if (status === 404) {
          setError("Convite invalido ou expirou. Peca um novo ao admin.");
        } else if (status === 409) {
          setError("Este email ja possui conta. Faca login normalmente.");
        } else if (status === 400) {
          setError(
            err.response?.data?.message ??
              "Dados invalidos. Verifique nome e senha.",
          );
        } else {
          setError("Erro ao aceitar convite. Tente novamente.");
        }
      } else {
        setError("Erro de conexao. Verifique se o backend esta rodando.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) {
      setError("Informe seu nome completo.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (!agreed) {
      setError("Aceite os termos para continuar.");
      return;
    }
    acceptMutation.mutate();
  };

  const expiresPretty = (() => {
    try {
      return new Date(info.expiresAt).toLocaleDateString();
    } catch {
      return "";
    }
  })();

  return (
    <div className="space-y-7">
      <div className="space-y-2 text-center">
        <h1 className="text-[24px] font-semibold tracking-tight">
          Voce foi convidado para {info.orgName}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground">
            {info.inviterName}
          </span>{" "}
          te convidou como{" "}
          <code className="text-[12px] px-1 rounded bg-muted">{info.role}</code>
          {expiresPretty ? ` — expira em ${expiresPretty}` : ""}
        </p>
        <p className="text-[12px] text-muted-foreground/80">
          Email do convite: <span className="font-mono">{info.email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field id="name" label="Seu nome completo">
          <Input
            id="name"
            type="text"
            placeholder="Maria Souza"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            autoFocus
            className="h-10 text-[14px]"
          />
        </Field>

        <Field id="password" label="Crie uma senha">
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="h-10 text-[14px] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </Field>

        <label className="flex items-start gap-2 text-[12px] text-muted-foreground">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Aceito os termos de uso e politica de privacidade do Scrumban.
          </span>
        </label>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            <p className="text-[12px] text-destructive">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={acceptMutation.isPending}
          className={cn(
            "w-full h-10 rounded-md bg-foreground text-background text-[13px] font-medium",
            "hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed",
            "flex items-center justify-center gap-2",
          )}
        >
          {acceptMutation.isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Aceitar convite e entrar"
          )}
        </button>
      </form>

      <p className="text-center text-[13px] text-muted-foreground">
        Ja tem uma conta?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground hover:underline underline-offset-4"
        >
          Fazer login
        </Link>
      </p>
    </div>
  );
}

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

function LoadingShell() {
  return (
    <div className="space-y-6 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
      <p className="text-[13px] text-muted-foreground">Carregando convite...</p>
    </div>
  );
}

function InvalidShell({ message }: { message: string }) {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="text-[22px] font-semibold tracking-tight">
          Convite indisponivel
        </h1>
        <p className="text-[13px] text-muted-foreground">{message}</p>
      </div>
      <Link
        href="/login"
        className="inline-block text-[13px] text-foreground hover:underline underline-offset-4"
      >
        Voltar para o login
      </Link>
    </div>
  );
}

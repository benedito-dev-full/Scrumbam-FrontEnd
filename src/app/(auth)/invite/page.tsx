"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { LAST_ORG_LS_KEY, useAuthStore } from "@/lib/stores/auth-store";
import { invitesApi, type InviteInfo } from "@/lib/api/invites";
import { authApi } from "@/lib/api/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { cn } from "@/lib/utils";
import type { AuthResponse, User } from "@/types/auth";

/**
 * Pagina publica de aceite de convite por email (ADR-V2-028 + ADR-V2-030).
 *
 * Fluxos suportados:
 *  1. `flow=new_user` (email sem conta): form de nome + senha + termos. Cria
 *     conta + auto-login.
 *  2. `flow=existing_user` (email ja tem conta noutra org): tela "fulano te
 *     adicionou ao workspace X" + botao "Aceitar e entrar". Body vazio.
 *     - Se o usuario NAO esta logado, oferece link para `/login?returnTo=...`.
 *
 * Anti-enumeracao: 404 trata como "convite invalido ou expirado", sem
 * distinguir motivo (mesmo para token usado).
 */
export default function InvitePage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <InviteContent />
    </Suspense>
  );
}

function buildUserFromAuth(data: AuthResponse): User {
  return {
    id: data.user.id,
    entidadeId: data.user.entidadeId ?? "",
    nome: data.user.name,
    email: data.user.email,
    role: data.user.orgRole?.toLowerCase() || data.user.role || "member",
    orgId: data.user.organizationId || "",
    orgNome: data.user.organizationName || "",
    availableOrgs: data.user.availableOrgs ?? [],
    isOrphan: data.user.isOrphan ?? !data.user.organizationId,
  };
}

/**
 * Após accept de convite, garantir que `availableOrgs` no store reflete
 * o estado atual do banco — busca fresh via `/auth/me` e atualiza o user.
 *
 * Defesa contra cenários onde o cache local (Zustand persist) pode ter
 * ficado stale entre abas/navegadores ou onde a response do accept não
 * carregou todas as orgs (race entre transaction commit e re-query).
 */
async function hydrateAvailableOrgsFresh(
  setUser: (u: User) => void,
  currentUser: User,
): Promise<void> {
  try {
    const me = await authApi.getMe();
    setUser({
      ...currentUser,
      entidadeId: me.id,
      nome: me.name,
      email: me.email ?? currentUser.email,
      role: me.orgRole?.toLowerCase() || me.role || currentUser.role,
      orgId: me.organizationId ?? currentUser.orgId,
      orgNome: me.organizationName ?? currentUser.orgNome,
      availableOrgs: me.availableOrgs ?? currentUser.availableOrgs,
      isOrphan: me.isOrphan ?? false,
    });
  } catch {
    // Falha aqui não bloqueia o redirect — o AuthProvider revalida em
    // 5min na pior das hipóteses. Logamos para debug mas seguimos.
    // eslint-disable-next-line no-console
    console.warn(
      "[invite/accept] getMe pós-accept falhou — seguindo com dados do accept",
    );
  }
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

  const info = inviteQuery.data;
  const flow = info.flow ?? "new_user";

  if (flow === "existing_user") {
    return <MergeAcceptForm token={token} info={info} router={router} />;
  }
  return <AcceptForm token={token} info={info} router={router} />;
}

/**
 * Fluxo `new_user`: cria conta + auto-login.
 */
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
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const acceptMutation = useMutation({
    mutationFn: () => invitesApi.accept(token, { name, password }),
    onSuccess: async (data) => {
      const user = buildUserFromAuth(data);
      login(user, data.accessToken, data.refreshToken);
      if (typeof window !== "undefined" && user.orgId) {
        window.localStorage.setItem(LAST_ORG_LS_KEY, user.orgId);
      }
      // Defesa: força refresh de availableOrgs via /auth/me antes do redirect.
      // Cobre cenário onde o user já tinha sessão de outra org e o store
      // local poderia ter ficado stale (multi-tab, multi-invite, etc.).
      await hydrateAvailableOrgsFresh(setUser, user);
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

/**
 * Fluxo `existing_user`: usuário já tem conta — só precisa confirmar o merge.
 *
 * Se o usuário não está logado, mostra link para login com `returnTo` apontando
 * para este convite. Pós-accept, o backend já emite tokens para a org recém-
 * mergeada — o frontend só salva e redireciona.
 */
function MergeAcceptForm({
  token,
  info,
  router,
}: {
  token: string;
  info: InviteInfo;
  router: ReturnType<typeof useRouter>;
}) {
  const login = useAuthStore((s) => s.login);
  const setUser = useAuthStore((s) => s.setUser);
  const currentUser = useAuthStore((s) => s.user);
  const [error, setError] = useState("");

  const isLoggedIn = !!currentUser;
  const sameEmail =
    currentUser?.email?.toLowerCase() === info.email.toLowerCase();

  const acceptMutation = useMutation({
    // Backend ignora name/password no flow existing_user — passamos {} explicitamente.
    mutationFn: () =>
      invitesApi.accept(token, {} as { name: string; password: string }),
    onSuccess: async (data) => {
      const user = buildUserFromAuth(data);
      login(user, data.accessToken, data.refreshToken);
      if (typeof window !== "undefined" && user.orgId) {
        window.localStorage.setItem(LAST_ORG_LS_KEY, user.orgId);
      }
      // Defesa CRÍTICA no flow merge: o user já estava logado em outra org
      // antes de aceitar este convite. Força refresh de `availableOrgs` via
      // /auth/me para garantir que o workspace switcher mostra TODAS as
      // orgs do user (a antiga + a recém-aceita), não apenas a do response
      // do accept. Cobre stale cache do Zustand persist entre abas.
      await hydrateAvailableOrgsFresh(setUser, user);
      // Redireciona para a app: ja estamos na org recem-mergeada (tokens
      // emitidos pelo backend com preferredOrgId=orgMergeada).
      router.replace(data.redirectTo || "/intentions");
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        if (status === 404) {
          setError("Convite invalido ou expirou. Peca um novo ao admin.");
        } else if (status === 409) {
          setError("Voce ja faz parte deste workspace.");
        } else {
          setError("Erro ao aceitar convite. Tente novamente.");
        }
      } else {
        setError("Erro de conexao. Verifique se o backend esta rodando.");
      }
    },
  });

  // Caso 1: usuario nao logado — pedir login antes.
  if (!isLoggedIn) {
    const returnTo = `/invite?token=${encodeURIComponent(token)}`;
    return (
      <div className="space-y-7">
        <div className="space-y-2 text-center">
          <h1 className="text-[24px] font-semibold tracking-tight">
            Voce foi adicionado a {info.orgName}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            <span className="font-medium text-foreground">
              {info.inviterName}
            </span>{" "}
            adicionou este email ao workspace.
          </p>
          <p className="text-[12px] text-muted-foreground/80">
            Email do convite: <span className="font-mono">{info.email}</span>
          </p>
        </div>
        <div className="rounded-md border border-border bg-muted/30 px-3 py-3 text-[12px] text-muted-foreground">
          Voce ja tem uma conta no Scrumban. Faca login com este email para
          aceitar o convite e entrar em <strong>{info.orgName}</strong>.
        </div>
        <Link
          href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
          className={cn(
            "block w-full text-center h-10 leading-10 rounded-md bg-foreground text-background text-[13px] font-medium",
            "hover:opacity-90 transition-opacity",
          )}
        >
          Fazer login para aceitar
        </Link>
      </div>
    );
  }

  // Caso 2: logado, mas com email diferente do convite — alerta.
  if (!sameEmail) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-[22px] font-semibold tracking-tight">
          Email diferente
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Este convite foi enviado para{" "}
          <span className="font-mono">{info.email}</span>, mas voce esta logado
          como <span className="font-mono">{currentUser.email}</span>.
        </p>
        <p className="text-[12px] text-muted-foreground/80">
          Saia da sessao atual e faca login com o email do convite para
          continuar.
        </p>
      </div>
    );
  }

  // Caso 3: logado com o email certo — confirmar merge.
  return (
    <div className="space-y-7">
      <div className="space-y-2 text-center">
        <h1 className="text-[24px] font-semibold tracking-tight">
          Entrar em {info.orgName}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground">
            {info.inviterName}
          </span>{" "}
          te adicionou como{" "}
          <code className="text-[12px] px-1 rounded bg-muted">{info.role}</code>{" "}
          neste workspace.
        </p>
        <p className="text-[12px] text-muted-foreground/80">
          Voce continuara usando seu perfil atual ({currentUser.email}).
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
          <p className="text-[12px] text-destructive">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => acceptMutation.mutate()}
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
            Entrando no workspace...
          </>
        ) : (
          `Aceitar e entrar em ${info.orgName}`
        )}
      </button>

      <p className="text-center text-[13px] text-muted-foreground">
        Nao reconhece este convite?{" "}
        <Link
          href="/intentions"
          className="font-medium text-foreground hover:underline underline-offset-4"
        >
          Voltar ao app
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

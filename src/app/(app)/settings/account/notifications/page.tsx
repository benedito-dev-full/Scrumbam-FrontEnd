"use client";

import Link from "next/link";
import {
  ChevronRight,
  Inbox,
  Mail,
  Monitor,
  Smartphone,
  MessageSquare,
} from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { usePreference } from "@/lib/hooks/use-preference";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ============================================================
// Channel definitions
// ============================================================

interface Channel {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  status: string;
  enabled: boolean;
  href?: string;
  /** Stub significa "depende de feature ausente — gap" */
  stub?: boolean;
  /** Tooltip mostrando o gap correspondente */
  gapNote?: string;
}

const CHANNELS: Channel[] = [
  {
    key: "in-app",
    icon: Inbox,
    label: "No app",
    status: "Sempre ativo — vai para o Inbox",
    enabled: true,
    href: "/intentions/inbox",
  },
  {
    key: "telegram",
    icon: MessageSquare,
    label: "Telegram",
    status: "Configurar canal",
    enabled: true,
    href: "/settings/channels",
  },
  {
    key: "email",
    icon: Mail,
    label: "Email",
    status: "Desativado",
    enabled: false,
    stub: true,
    gapNote: "Gap #26 — confirmar worker SMTP no backend",
  },
  {
    key: "desktop",
    icon: Monitor,
    label: "Desktop",
    status: "Desativado",
    enabled: false,
    stub: true,
    gapNote: "Gap #27 — sem Web Push / Service Worker",
  },
  {
    key: "mobile",
    icon: Smartphone,
    label: "Mobile",
    status: "Desativado",
    enabled: false,
    stub: true,
    gapNote: "Gap #27 — sem app mobile",
  },
];

export default function NotificationsPage() {
  usePageTitle("Notificacoes");

  // Only this single toggle has UI-only effect; rest are stubs (gap #29)
  const [showUpdatesInSidebar, setShowUpdatesInSidebar] = usePreference(
    "showUpdatesInSidebar",
    true,
  );

  return (
    <PageTransition>
      <div className="px-8 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Notificacoes
          </h1>

          {/* ============ NOTIFICATION CHANNELS ============ */}
          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-base font-medium">Canais de notificacao</h2>
              <p className="text-[12px] text-muted-foreground">
                Escolha como ser notificado sobre atividade do workspace.
                Notificacoes sempre vao para seu Inbox.
              </p>
            </div>
            <div className="rounded-md border border-border bg-card overflow-hidden">
              {CHANNELS.map((ch, idx) => (
                <ChannelRow
                  key={ch.key}
                  channel={ch}
                  noBorder={idx === CHANNELS.length - 1}
                />
              ))}
            </div>
          </section>

          {/* ============ UPDATES FROM SCRUMBAN (stub bloco inteiro) ============ */}
          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-base font-medium">Atualizacoes do Scrumban</h2>
              <p className="text-[12px] text-muted-foreground">
                Anuncios e mudancas importantes do produto.
                <span className="ml-1 text-muted-foreground/70">
                  (Bloco em stub — gap #29: sem mailing list ainda.)
                </span>
              </p>
            </div>

            <SubGroup title="Changelog">
              <div className="rounded-md border border-border bg-card overflow-hidden">
                <ToggleRow
                  label="Mostrar novidades na sidebar"
                  description="Destaca novas features e melhorias na sidebar do app"
                  checked={showUpdatesInSidebar}
                  onChange={setShowUpdatesInSidebar}
                />
                <ToggleRow
                  label="Newsletter de changelog"
                  description="Receba um email duas vezes por mes com as novidades"
                  checked={false}
                  stub
                  noBorder
                />
              </div>
            </SubGroup>

            <SubGroup title="Marketing">
              <div className="rounded-md border border-border bg-card overflow-hidden">
                <ToggleRow
                  label="Marketing e onboarding"
                  description="Emails ocasionais para ajudar voce a tirar o maximo do Scrumban"
                  checked={false}
                  stub
                  noBorder
                />
              </div>
            </SubGroup>

            <SubGroup title="Outras atualizacoes">
              <div className="rounded-md border border-border bg-card overflow-hidden">
                <ToggleRow
                  label="Convite aceito"
                  description="Email quando convidados aceitam o convite"
                  checked={false}
                  stub
                />
                <ToggleRow
                  label="Privacidade e atualizacoes legais"
                  description="Email quando politicas de privacidade ou termos de servico mudarem"
                  checked={false}
                  stub
                />
                <ToggleRow
                  label="Acordo de processamento de dados (DPA)"
                  description="Email quando nosso DPA mudar"
                  checked={false}
                  stub
                  noBorder
                />
              </div>
            </SubGroup>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}

// ============================================================
// Sub-components
// ============================================================

function ChannelRow({
  channel: ch,
  noBorder,
}: {
  channel: Channel;
  noBorder?: boolean;
}) {
  const Icon = ch.icon;

  const inner = (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium">{ch.label}</p>
        <p
          className={cn(
            "text-[12px]",
            ch.enabled ? "text-emerald-500" : "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full mr-1.5 align-middle",
              ch.enabled ? "bg-emerald-500" : "bg-muted-foreground",
            )}
          />
          {ch.status}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
    </div>
  );

  const baseClass = cn(
    "flex items-center gap-3 px-4 py-3 transition-colors",
    !noBorder && "border-b border-border",
    ch.stub
      ? "opacity-60 cursor-not-allowed"
      : "hover:bg-accent/40 cursor-pointer",
  );

  if (ch.stub) {
    return (
      <div className={baseClass} title={ch.gapNote}>
        {inner}
      </div>
    );
  }

  if (ch.href) {
    return (
      <Link href={ch.href} className={baseClass}>
        {inner}
      </Link>
    );
  }

  return <div className={baseClass}>{inner}</div>;
}

function SubGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground/80">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  noBorder,
  stub,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  noBorder?: boolean;
  stub?: boolean;
}) {
  return (
    <div
      title={stub ? "Gap #29 — sem mailing list de produto" : undefined}
      className={cn(
        "flex items-center justify-between gap-6 px-4 py-3",
        !noBorder && "border-b border-border",
        stub && "opacity-60",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium">{label}</p>
        {description && (
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {description}
          </p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={stub || !onChange}
      />
    </div>
  );
}

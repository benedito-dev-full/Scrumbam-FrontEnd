"use client";

import Link from "next/link";
import { Bell, Palette, Webhook, Shield } from "lucide-react";
import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { NotificationSettings } from "@/components/settings/notification-settings";

export default function SettingsPage() {
  usePageTitle("Configuracoes");

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracoes</h1>
        <p className="text-sm text-muted-foreground">
          Notificacoes e integracoes tecnicas
        </p>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Notificacoes</h2>
          </div>
          <NotificationSettings />
        </div>

        {/* Quick links to technical settings */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Integracoes
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/settings/branding"
              className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-[var(--scrumban-brand)]/40"
            >
              <div className="rounded-lg bg-[var(--status-review)]/10 p-3">
                <Palette className="h-5 w-5 text-[var(--status-review)]" />
              </div>
              <div>
                <h4 className="font-bold">Branding</h4>
                <p className="text-sm text-muted-foreground">
                  Logo, cores e nome
                </p>
              </div>
            </Link>

            <Link
              href="/settings/webhooks"
              className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-[var(--scrumban-brand)]/40"
            >
              <div className="rounded-lg bg-[var(--status-doing)]/10 p-3">
                <Webhook className="h-5 w-5 text-[var(--status-doing)]" />
              </div>
              <div>
                <h4 className="font-bold">Webhooks</h4>
                <p className="text-sm text-muted-foreground">
                  Notificacoes HTTP
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-4 rounded-lg border bg-card p-4 opacity-50 cursor-not-allowed">
              <div className="rounded-lg bg-muted p-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-bold">Permissoes</h4>
                <p className="text-sm text-muted-foreground">Em breve</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

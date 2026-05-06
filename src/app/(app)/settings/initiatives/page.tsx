"use client";

import { ExternalLink, Slack, Info } from "lucide-react";
import Link from "next/link";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { usePreference } from "@/lib/hooks/use-preference";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function InitiativesSettingsPage() {
  usePageTitle("Initiatives");

  // Local toggle (gap #3 — sem feature flag persistida no backend)
  const [enabled, setEnabled] = usePreference("initiativesEnabled", false);

  return (
    <PageTransition>
      <div className="px-8 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Initiatives
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Initiatives group multiple projects that contribute toward the
              same strategic effort. Use initiatives to plan and coordinate
              larger streams of work and monitor their progress at scale.{" "}
              <Link
                href="#"
                className="text-foreground hover:underline inline-flex items-center gap-0.5"
              >
                Docs
                <ExternalLink className="h-3 w-3" />
              </Link>
            </p>
          </div>

          {/* Gap notice */}
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200 dark:text-amber-300">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>
              Gap #3 — sem modelo <code>DInitiative</code> no schema. Toggle
              abaixo persiste em localStorage como preview; ativar de verdade
              exige migration + endpoint para criar/listar initiatives.
            </p>
          </div>

          {/* Enable toggle */}
          <div className="rounded-md border border-border bg-card overflow-hidden">
            <Row
              label="Enable Initiatives"
              description="Visible to all non-guest workspace members"
              control={
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              }
              noBorder
            />
          </div>

          {/* Initiative updates section */}
          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-base font-medium">Initiative updates</h2>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Short status reports about the progress and health of your
                initiative. Updates are ideally written regularly by the owner.
                Subscribers receive these updates directly in their inbox. You
                can also configure a Slack channel where all initiative
                updates are posted.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-[13px] font-medium">Update schedule</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Configure how often updates are expected on initiatives.
                  Initiative owners will receive reminders to post updates.
                </p>
              </div>
              <div className="rounded-md border border-border bg-card overflow-hidden">
                <Row
                  label="No expectation for updates"
                  control={
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      title="Gap #3 / #10 — sem persistencia"
                      className="text-[12px] h-8"
                    >
                      Edit
                    </Button>
                  }
                  noBorder
                  stub
                />
              </div>
            </div>
          </section>

          {/* Slack notifications */}
          <section className="space-y-3">
            <h2 className="text-base font-medium">Slack notifications</h2>
            <div className="rounded-md border border-border bg-card overflow-hidden">
              <Row
                label={
                  <span className="flex items-center gap-2">
                    <Slack className="h-4 w-4 text-muted-foreground" />
                    Send initiative updates to a Slack channel
                  </span>
                }
                description="Connect a channel to send all initiative updates to"
                control={
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    title="Gap #28 — Slack integration nao existe"
                    className="text-[12px] h-8"
                  >
                    Connect
                    <ExternalLink className="ml-1.5 h-3 w-3" />
                  </Button>
                }
                noBorder
                stub
              />
            </div>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}

// ============================================================
// Row primitive
// ============================================================

function Row({
  label,
  description,
  control,
  noBorder,
  stub,
}: {
  label: React.ReactNode;
  description?: string;
  control: React.ReactNode;
  noBorder?: boolean;
  stub?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-6 px-4 py-3",
        !noBorder && "border-b border-border",
        stub && "opacity-70",
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
      <div className="shrink-0">{control}</div>
    </div>
  );
}

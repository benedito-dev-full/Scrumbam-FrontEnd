"use client";

import { Activity } from "lucide-react";
import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { ActivityTimeline } from "@/components/projects/activity-timeline";

export default function ProjectActivityPage() {
  usePageTitle("Atividade");

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6 text-orange-500" />
          Atividade
        </h1>
        <p className="text-sm text-muted-foreground">
          Timeline de eventos dos projetos conectados
        </p>
      </div>

      <ActivityTimeline />
    </PageTransition>
  );
}

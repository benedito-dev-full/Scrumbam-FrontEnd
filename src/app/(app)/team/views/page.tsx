"use client";

import { Layers } from "lucide-react";
import { SidebarStub } from "@/components/common/sidebar-stub";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function TeamViewsPage() {
  usePageTitle("Team — Views");
  return (
    <SidebarStub
      title="Team views"
      description="Views (filtros salvos) compartilhadas no escopo do team. Depende dos modelos DTeam e DView."
      gapRef="Bloqueado pelos gaps #1 (Teams) e #2 (Views) — ver LINEAR_PIVOT_GAPS.md"
      icon={Layers}
    />
  );
}

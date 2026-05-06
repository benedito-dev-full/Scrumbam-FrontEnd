"use client";

import { Layers } from "lucide-react";
import { SidebarStub } from "@/components/common/sidebar-stub";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function TeamViewsPage() {
  usePageTitle("Time — Visualizacoes");
  return (
    <SidebarStub
      title="Visualizacoes do time"
      description="Visualizacoes (filtros salvos) compartilhadas no escopo do time. Depende dos modelos DTeam e DView."
      gapRef="Bloqueado pelos gaps #1 (Times) e #2 (Visualizacoes) — ver LINEAR_PIVOT_GAPS.md"
      icon={Layers}
    />
  );
}

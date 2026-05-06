"use client";

import { CircleDot } from "lucide-react";
import { SidebarStub } from "@/components/common/sidebar-stub";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function TeamIssuesPage() {
  usePageTitle("Team — Issues");
  return (
    <SidebarStub
      title="Team issues"
      description="Issues filtradas pelo team selecionado. Depende do conceito de Team no schema (DEntidade nao tem nivel intermediario entre Org e Project)."
      gapRef="Bloqueado pelo gap #1 (Teams) — ver LINEAR_PIVOT_GAPS.md"
      icon={CircleDot}
    />
  );
}

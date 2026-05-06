"use client";

import { Box } from "lucide-react";
import { SidebarStub } from "@/components/common/sidebar-stub";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function TeamProjectsPage() {
  usePageTitle("Team — Projects");
  return (
    <SidebarStub
      title="Team projects"
      description="Projects pertencentes ao team selecionado. Por enquanto, todos os projects ficam direto sob a organizacao em /projects."
      gapRef="Bloqueado pelo gap #1 (Teams) — ver LINEAR_PIVOT_GAPS.md"
      icon={Box}
    />
  );
}

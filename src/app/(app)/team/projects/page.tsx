"use client";

import { Box } from "lucide-react";
import { SidebarStub } from "@/components/common/sidebar-stub";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function TeamProjectsPage() {
  usePageTitle("Time — Projetos");
  return (
    <SidebarStub
      title="Projetos do time"
      description="Projetos pertencentes ao time selecionado. Por enquanto, todos os projetos ficam direto sob a organizacao em /projects."
      gapRef="Bloqueado pelo gap #1 (Times) — ver LINEAR_PIVOT_GAPS.md"
      icon={Box}
    />
  );
}

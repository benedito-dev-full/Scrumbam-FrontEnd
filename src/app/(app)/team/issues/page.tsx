"use client";

import { CircleDot } from "lucide-react";
import { SidebarStub } from "@/components/common/sidebar-stub";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function TeamIssuesPage() {
  usePageTitle("Time — Issues");
  return (
    <SidebarStub
      title="Issues do time"
      description="Issues filtradas pelo time selecionado. Depende do conceito de Time no schema (DEntidade nao tem nivel intermediario entre Org e Project)."
      gapRef="Bloqueado pelo gap #1 (Times) — ver LINEAR_PIVOT_GAPS.md"
      icon={CircleDot}
    />
  );
}

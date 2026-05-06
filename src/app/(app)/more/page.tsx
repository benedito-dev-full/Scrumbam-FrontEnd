"use client";

import { MoreHorizontal } from "lucide-react";
import { SidebarStub } from "@/components/common/sidebar-stub";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function MorePage() {
  usePageTitle("More");
  return (
    <SidebarStub
      title="More"
      description="Itens adicionais do workspace (Cycles, Roadmap, Triage, Documents, etc.) virao aqui conforme forem implementados."
      icon={MoreHorizontal}
    />
  );
}

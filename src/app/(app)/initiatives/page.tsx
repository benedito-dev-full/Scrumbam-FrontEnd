"use client";

import { Target } from "lucide-react";
import { SidebarStub } from "@/components/common/sidebar-stub";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function InitiativesListPage() {
  usePageTitle("Initiatives");
  return (
    <SidebarStub
      title="Initiatives"
      description="Lista de initiatives (agrupadores de projects). A tela de configuracao ja existe em Settings > Initiatives, mas a listagem depende do modelo DInitiative."
      gapRef="Bloqueado pelo gap #3 (Initiatives) — ver LINEAR_PIVOT_GAPS.md"
      icon={Target}
    />
  );
}

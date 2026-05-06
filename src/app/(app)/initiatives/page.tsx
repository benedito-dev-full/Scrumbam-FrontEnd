"use client";

import { Target } from "lucide-react";
import { SidebarStub } from "@/components/common/sidebar-stub";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function InitiativesListPage() {
  usePageTitle("Iniciativas");
  return (
    <SidebarStub
      title="Iniciativas"
      description="Lista de iniciativas (agrupadores de projetos). A tela de configuracao ja existe em Configuracoes > Iniciativas, mas a listagem depende do modelo DInitiative."
      gapRef="Bloqueado pelo gap #3 (Iniciativas) — ver LINEAR_PIVOT_GAPS.md"
      icon={Target}
    />
  );
}

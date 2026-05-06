"use client";

import { MoreHorizontal } from "lucide-react";
import { SidebarStub } from "@/components/common/sidebar-stub";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function MorePage() {
  usePageTitle("Mais");
  return (
    <SidebarStub
      title="Mais"
      description="Itens adicionais do workspace (Ciclos, Roadmap, Triagem, Documentos, etc.) virao aqui conforme forem implementados."
      icon={MoreHorizontal}
    />
  );
}

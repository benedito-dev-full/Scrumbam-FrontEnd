"use client";

import { Download } from "lucide-react";
import { SidebarStub } from "@/components/common/sidebar-stub";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function ImportPage() {
  usePageTitle("Importar issues");
  return (
    <SidebarStub
      title="Importar issues"
      description="Importar issues de Jira, Asana, GitHub Issues, CSV, etc. Funcionalidade de migracao ainda nao implementada."
      gapRef="Sem importador no backend — feature de migracao"
      icon={Download}
    />
  );
}

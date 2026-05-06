"use client";

import { Download } from "lucide-react";
import { SidebarStub } from "@/components/common/sidebar-stub";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function ImportPage() {
  usePageTitle("Import issues");
  return (
    <SidebarStub
      title="Import issues"
      description="Importar issues de Jira, Asana, GitHub Issues, CSV, etc. Feature de migracao ainda nao implementada."
      gapRef="Sem importer no backend — feature de migracao"
      icon={Download}
    />
  );
}

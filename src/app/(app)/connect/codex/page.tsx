"use client";

import { Code2 } from "lucide-react";
import { SidebarStub } from "@/components/common/sidebar-stub";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function ConnectCodexPage() {
  usePageTitle("Connect Codex");
  return (
    <SidebarStub
      title="Connect Codex"
      description="Integracao com OpenAI Codex. Usa o mesmo MCP server que Claude (ver Connect Claude). Pagina dedicada ainda nao implementada."
      gapRef="Pode reusar o /integrations atual via MCP — tela detail pendente"
      icon={Code2}
    />
  );
}

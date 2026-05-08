"use client";

import { Layers } from "lucide-react";
import { SidebarStub } from "@/components/common/sidebar-stub";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function TeamViewsPage() {
  usePageTitle("Time — Visualizacoes");
  return (
    <SidebarStub
      title="Views do time"
      description="Views compartilhadas estarao disponiveis em breve."
      icon={Layers}
    />
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";

interface Crumb {
  label: string;
  href?: string;
}

function buildCrumbs(pathname: string, orgNome?: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];

  // Always start with org name if available
  if (orgNome) {
    crumbs.push({ label: orgNome, href: "/intentions" });
  }

  const labelMap: Record<string, string> = {
    intentions: "Intencoes",
    "hill-chart": "Hill Chart",
    new: "Nova Intencao",
    projects: "Projetos",
    activity: "Atividade",
    dashboard: "Dashboard",
    me: "Meu Painel",
    company: "Empresa",
    analytics: "Analytics",
    forecasting: "Forecasting",
    retrospective: "Retrospectiva",
    templates: "Templates",
    settings: "Configuracoes",
    branding: "Branding",
    webhooks: "Webhooks",
    channels: "Canais",
  };

  let path = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    path += `/${segment}`;

    const label = labelMap[segment];
    if (label) {
      const isLast = i === segments.length - 1;
      crumbs.push({ label, href: isLast ? undefined : path });
    }
  }

  return crumbs;
}

export function BreadcrumbNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const crumbs = buildCrumbs(pathname, user?.orgNome);

  if (crumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {crumbs.map((crumb, index) => (
        <span key={index} className="flex items-center gap-1.5">
          {index > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
          )}
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors truncate max-w-[120px]"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium truncate max-w-[140px]">
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

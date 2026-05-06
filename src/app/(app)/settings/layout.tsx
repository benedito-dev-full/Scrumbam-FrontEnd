"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  SlidersHorizontal,
  User as UserIcon,
  Bell,
  Building2,
  Users,
  Hexagon,
  Palette,
  Radio,
  Webhook,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  stub?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: "Conta",
    items: [
      {
        href: "/settings/account/preferences",
        label: "Preferencias",
        icon: SlidersHorizontal,
      },
      {
        href: "/settings/account/profile",
        label: "Perfil",
        icon: UserIcon,
      },
      {
        href: "/settings/account/notifications",
        label: "Notificacoes",
        icon: Bell,
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        href: "/settings/workspace/general",
        label: "Geral",
        icon: Building2,
      },
      {
        href: "/settings/workspace/members",
        label: "Membros",
        icon: Users,
      },
    ],
  },
  {
    label: "Projetos",
    items: [
      {
        href: "/settings/projects/statuses",
        label: "Status",
        icon: Hexagon,
      },
    ],
  },
  {
    label: "Recursos",
    items: [
      {
        href: "/settings/initiatives",
        label: "Iniciativas",
        icon: Target,
      },
    ],
  },
  {
    label: "Workspace (legado)",
    items: [
      { href: "/settings/branding", label: "Branding", icon: Palette },
      { href: "/settings/channels", label: "Canais", icon: Radio },
      { href: "/settings/webhooks", label: "Webhooks", icon: Webhook },
    ],
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full overflow-hidden">
      {/* Inner sidebar (settings nav) */}
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-border bg-sidebar overflow-auto">
        <div className="px-4 pt-4 pb-2">
          <Link
            href="/projects"
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar ao app
          </Link>
        </div>

        <nav className="flex-1 px-2 pb-4 pt-2">
          {GROUPS.map((group) => (
            <div key={group.label} className="mt-4 first:mt-0">
              <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                {group.label}
              </p>
              <ul className="space-y-px">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={item.stub ? "Em breve" : undefined}
                        aria-label={item.label}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1 text-[13px] transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                          item.stub && !active && "opacity-60",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Page content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

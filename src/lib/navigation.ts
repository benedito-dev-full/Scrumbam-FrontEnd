import {
  Inbox,
  ScrollText,
  Plus,
  BarChart3,
  PieChart,
  FolderOpen,
  Activity,
  BookOpen,
  Building2,
  Settings,
  Radio,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badge?: number;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    label: "Intencoes",
    items: [
      {
        href: "/intentions/inbox",
        label: "Inbox",
        icon: Inbox,
        iconColor: "text-muted-foreground",
      },
      {
        href: "/intentions",
        label: "Lista",
        icon: ScrollText,
        iconColor: "text-[var(--scrumban-brand)]",
      },
      {
        href: "/intentions/new",
        label: "Nova",
        icon: Plus,
        iconColor: "text-sky-500 dark:text-sky-400",
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: BarChart3,
        iconColor: "text-blue-500 dark:text-blue-400",
      },
      {
        href: "/analytics",
        label: "Analytics",
        icon: PieChart,
        iconColor: "text-purple-500 dark:text-purple-400",
      },
    ],
  },
  {
    label: "Projetos",
    items: [
      {
        href: "/projects",
        label: "Conectados",
        icon: FolderOpen,
        iconColor: "text-cyan-500 dark:text-cyan-400",
      },
      {
        href: "/projects/activity",
        label: "Atividade",
        icon: Activity,
        iconColor: "text-orange-500 dark:text-orange-400",
      },
      {
        href: "/projects/setup",
        label: "Setup",
        icon: BookOpen,
        iconColor: "text-emerald-500 dark:text-emerald-400",
      },
    ],
  },
  {
    label: "Organizacao",
    items: [
      {
        href: "/organization",
        label: "Organizacao",
        icon: Building2,
        iconColor: "text-indigo-500 dark:text-indigo-400",
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        href: "/settings",
        label: "Configuracoes",
        icon: Settings,
        iconColor: "text-muted-foreground",
      },
      {
        href: "/settings/channels",
        label: "Canais",
        icon: Radio,
        iconColor: "text-green-500 dark:text-green-400",
      },
    ],
  },
];

/**
 * Determines if a nav item should be marked as active based on the current pathname.
 *
 * Special handling for /intentions: does NOT activate for /intentions/new
 * or /intentions/hill-chart (those are separate sidebar items).
 * Activates for /intentions, /intentions/{projectId}, /intentions/{projectId}/{intentionId}.
 *
 * Special handling for /settings: does NOT activate for /settings/channels.
 *
 * Special handling for /projects: does NOT activate for /projects/activity.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;

  // /intentions should NOT match /intentions/new, /intentions/hill-chart, or /intentions/inbox
  if (href === "/intentions") {
    if (pathname.startsWith("/intentions/new")) return false;
    if (pathname.startsWith("/intentions/hill-chart")) return false;
    if (pathname.startsWith("/intentions/inbox")) return false;
    return pathname.startsWith("/intentions/");
  }

  // /settings should NOT match /settings/channels (separate nav item)
  if (href === "/settings") {
    if (pathname.startsWith("/settings/channels")) return false;
    return pathname.startsWith("/settings/");
  }

  // /projects should NOT match /projects/activity or /projects/setup (separate nav items)
  if (href === "/projects") {
    if (pathname.startsWith("/projects/activity")) return false;
    if (pathname.startsWith("/projects/setup")) return false;
    return pathname.startsWith("/projects/");
  }

  return pathname.startsWith(href + "/");
}

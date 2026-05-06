import {
  Inbox,
  CircleDot,
  Box,
  Layers,
  MoreHorizontal,
  Play,
  Download,
  UserPlus,
  Target,
  Zap,
  Code2,
  Plug,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  /** True quando o item depende de feature ainda nao suportada pelo schema */
  stub?: boolean;
}

export interface NavSection {
  /** Vazio = sem header, items aparecem soltos no topo */
  label?: string;
  /** Linear "Your teams" tem header com triangulo expansivel */
  collapsible?: boolean;
  /** Linear "Your teams" tem item-pai (team name) com filhos identados */
  team?: { name: string; icon: React.ComponentType<{ className?: string }>; iconColor?: string };
  items: NavItem[];
}

/**
 * Sidebar items "soltos" no topo (sem secao). Linear: Inbox, My issues.
 */
export const navTopItems: NavItem[] = [
  { href: "/intentions/inbox", label: "Inbox", icon: Inbox },
  { href: "/intentions", label: "My issues", icon: CircleDot },
];

/**
 * Secoes principais da sidebar — espelham Linear (Workspace / Your teams / Try).
 */
export const navSections: NavSection[] = [
  {
    label: "Workspace",
    collapsible: true,
    items: [
      { href: "/projects", label: "Projects", icon: Box },
      { href: "/views", label: "Views", icon: Layers, stub: true },
      { href: "/more", label: "More", icon: MoreHorizontal, stub: true },
    ],
  },
  {
    label: "Your teams",
    collapsible: true,
    team: { name: "Devari Tecnologia", icon: Play, iconColor: "text-emerald-500" },
    items: [
      { href: "/team/issues", label: "Issues", icon: CircleDot, stub: true },
      { href: "/team/projects", label: "Projects", icon: Box, stub: true },
      { href: "/team/views", label: "Views", icon: Layers, stub: true },
    ],
  },
  {
    label: "Try",
    collapsible: true,
    items: [
      { href: "/import", label: "Import issues", icon: Download, stub: true },
      { href: "/invite", label: "Invite people", icon: UserPlus, stub: true },
      { href: "/initiatives", label: "Initiatives", icon: Target, stub: true },
      { href: "/connect/cursor", label: "Connect Cursor", icon: Zap, stub: true },
      { href: "/connect/codex", label: "Connect Codex", icon: Code2, stub: true },
    ],
  },
  {
    label: "Settings",
    collapsible: true,
    items: [
      { href: "/integrations", label: "Integrations", icon: Plug },
    ],
  },
];

/**
 * Active matcher. Linear ativa o item exato do path; subrotas tambem ativam o pai.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/") return false;
  return pathname.startsWith(href + "/");
}

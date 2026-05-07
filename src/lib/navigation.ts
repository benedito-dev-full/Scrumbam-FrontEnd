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
  Users,
  Building2,
  PenSquare,
  Cpu,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PopoverNavItem {
  href?: string;
  /** Acao client-side disparada no clique (alternativa a href) */
  action?: "customize-sidebar";
  label: string;
  icon: LucideIcon;
  /** Adiciona separador acima deste item */
  separator?: boolean;
  /** Item disabled */
  stub?: boolean;
  /** Tooltip do stub */
  hint?: string;
}

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  /** True quando o item depende de feature ainda nao suportada pelo schema */
  stub?: boolean;
  /** Se presente, item se comporta como popover trigger ao inves de link direto */
  popoverItems?: PopoverNavItem[];
  /** Chave usada por useSidebarCustomization para visibility/order */
  customizeKey?:
    | "inbox"
    | "myIssues"
    | "drafts"
    | "projects"
    | "views"
    | "members"
    | "teams";
}

export interface NavSection {
  /** Vazio = sem header, items aparecem soltos no topo */
  label?: string;
  /** Linear "Your teams" tem header com triangulo expansivel */
  collapsible?: boolean;
  /** Linear "Your teams" tem item-pai (team name) com filhos identados */
  team?: { name: string; icon: LucideIcon; iconColor?: string };
  items: NavItem[];
}

/**
 * Sidebar items "soltos" no topo (sem secao). Linear: Inbox, My issues.
 */
export const navTopItems: NavItem[] = [
  {
    href: "/intentions/inbox",
    label: "Inbox",
    icon: Inbox,
    customizeKey: "inbox",
  },
  {
    href: "/intentions",
    label: "Minhas issues",
    icon: CircleDot,
    customizeKey: "myIssues",
  },
];

/**
 * Secoes principais da sidebar — espelham Linear (Workspace / Your teams / Try).
 */
export const navSections: NavSection[] = [
  {
    label: "Workspace",
    collapsible: true,
    items: [
      {
        href: "/projects",
        label: "🚀 Projetos",
        icon: Box,
        customizeKey: "projects",
      },
      {
        href: "/views/issues",
        label: "Views",
        icon: Layers,
        customizeKey: "views",
      },
      {
        href: "/agents",
        label: "Agentes",
        icon: Cpu,
      },
      {
        href: "/more",
        label: "Mais",
        icon: MoreHorizontal,
        popoverItems: [
          {
            href: "/settings/workspace/members",
            label: "Membros",
            icon: Users,
          },
          {
            href: "/team/issues",
            label: "Times",
            icon: Building2,
            stub: true,
            hint: "Gap #1 — Times nao existem no schema",
          },
          {
            label: "Personalizar sidebar",
            icon: PenSquare,
            separator: true,
            action: "customize-sidebar",
          },
        ],
      },
    ],
  },
  {
    label: "Seus times",
    collapsible: true,
    team: { name: "Devari Tecnologia", icon: Play, iconColor: "text-emerald-500" },
    items: [
      { href: "/team/issues", label: "Issues", icon: CircleDot, stub: true },
      { href: "/team/projects", label: "Projetos", icon: Box, stub: true },
      { href: "/team/views", label: "Views", icon: Layers, stub: true },
    ],
  },
  {
    label: "Experimente",
    collapsible: true,
    items: [
      { href: "/import", label: "Importar issues", icon: Download, stub: true },
      { href: "/invite", label: "Convidar pessoas", icon: UserPlus, stub: true },
      { href: "/initiatives", label: "Iniciativas", icon: Target, stub: true },
      {
        href: "/settings/integrations/claude",
        label: "Connect Claude",
        icon: Zap,
      },
      { href: "/connect/codex", label: "Connect Codex", icon: Code2, stub: true },
    ],
  },
  {
    label: "Configuracoes",
    collapsible: true,
    items: [
      { href: "/integrations", label: "Integracoes", icon: Plug },
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

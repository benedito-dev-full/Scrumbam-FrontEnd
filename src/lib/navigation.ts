import {
  Inbox,
  CircleDot,
  Download,
  UserPlus,
  Plug,
  Users,
  Building2,
  Cpu,
  Bot,
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
  /** Rota a navegar. Omitido quando o item dispara `action` ao inves de navegar. */
  href?: string;
  /**
   * Ação client-side disparada no clique. Quando definida, o item vira
   * `<button onClick>` em vez de `<Link>`. O handler vive no `AppSidebar`.
   */
  action?: "invite-people";
  label: string;
  icon: LucideIcon;
  badge?: number;
  /** True quando o item depende de feature ainda nao suportada pelo schema */
  stub?: boolean;
  /** Se presente, item se comporta como popover trigger ao inves de link direto */
  popoverItems?: PopoverNavItem[];
  /** Se true, item so fica ativo no path exato (nao casa subrotas) */
  exact?: boolean;
  /** Chave usada por useSidebarCustomization para visibility/order */
  customizeKey?:
    | "inbox"
    | "myIssues"
    | "drafts"
    | "projects"
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
    exact: true,
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
        href: "/teams",
        label: "Times",
        icon: Building2,
        customizeKey: "teams",
      },
      {
        href: "/settings/workspace/members",
        label: "Membros",
        icon: Users,
      },
    ],
  },
  // Secao "Seus times" e renderizada dinamicamente pelo
  // <TeamSelectorSidebar /> dentro de app-sidebar.tsx — nao definida aqui
  // porque depende de dados do backend (/api/v1/teams/mine).
  {
    label: "Experimente",
    collapsible: true,
    items: [
      { href: "/import", label: "Importar issues", icon: Download, stub: true },
      {
        action: "invite-people",
        label: "Convidar pessoas",
        icon: UserPlus,
      },
    ],
  },
  {
    label: "Conexoes",
    collapsible: true,
    items: [
      { href: "/automation", label: "Automacao", icon: Bot },
      { href: "/integrations", label: "MCP", icon: Plug },
      { href: "/vps", label: "VPS", icon: Cpu },
    ],
  },
];

/**
 * Active matcher. Linear ativa o item exato do path; subrotas tambem ativam o pai,
 * exceto quando item.exact = true (ex.: "Minhas issues" em /intentions nao deve
 * acender quando estamos em /intentions/inbox, que e um item separado).
 */
export function isNavItemActive(
  pathname: string,
  href: string,
  exact = false,
): boolean {
  if (pathname === href) return true;
  if (exact) return false;
  if (href === "/") return false;
  return pathname.startsWith(href + "/");
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState, useCallback, type ReactNode } from "react";
import {
  Search,
  PenSquare,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  LogOut,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  navTopItems,
  navSections,
  isNavItemActive,
  type NavItem,
  type NavSection,
  type PopoverNavItem,
} from "@/lib/navigation";
import {
  useSidebarCustomization,
  shouldShowSidebarItem,
} from "@/lib/hooks/use-sidebar-customization";
import { CustomizeSidebarModal } from "@/components/common/customize-sidebar-modal";
import { WorkspaceSwitcher } from "@/components/common/workspace-switcher";
import { NewIssueModal } from "@/components/intentions/new-issue-modal";
import { ProjectSelectorSidebar } from "@/components/projects/project-selector-sidebar";

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [newIssueOpen, setNewIssueOpen] = useState(false);
  const { state: customization } = useSidebarCustomization();

  // Filtra item conforme customization (badge=0 por padrao — UI puro)
  const visible = (item: NavItem): boolean => {
    if (!item.customizeKey) return true;
    const v = customization.visibility[item.customizeKey];
    return shouldShowSidebarItem(v, item.badge ?? 0);
  };

  const filteredTopItems = navTopItems.filter(visible);
  const filteredSections = navSections.map((s) => ({
    ...s,
    items: s.items.filter(visible),
  }));

  // orgInitials/orgShort agora vivem dentro de WorkspaceSwitcher (ADR-V2-030).
  const userInitials = (user?.nome || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleUpper = (user?.role || "").toUpperCase();
  const roleBadgeClass =
    roleUpper === "ADMIN"
      ? "border-blue-500/30 bg-blue-500/15 text-blue-300"
      : roleUpper === "VIEWER"
        ? "border-border bg-muted/60 text-muted-foreground"
        : "border-border bg-muted text-foreground/80";
  const roleLabel = roleUpper
    ? roleUpper.charAt(0) + roleUpper.slice(1).toLowerCase()
    : null;

  const toggle = useCallback((label: string) => {
    setCollapsed((s) => ({ ...s, [label]: !s[label] }));
  }, []);

  const openCommandPalette = useCallback(() => {
    const isMac =
      typeof navigator !== "undefined" &&
      navigator.platform.toUpperCase().includes("MAC");
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        metaKey: isMac,
        ctrlKey: !isMac,
        bubbles: true,
      }),
    );
  }, []);

  return (
    <aside className="hidden md:flex h-screen w-[232px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Workspace switcher + actions */}
      <div className="flex items-center gap-1 px-3 pt-3 pb-2">
        {/* ADR-V2-030: switcher de workspaces com dropdown de orgs disponiveis. */}
        <WorkspaceSwitcher />
        <button
          type="button"
          onClick={openCommandPalette}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          aria-label="Buscar"
          title="Buscar (Cmd+K)"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setNewIssueOpen(true)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          aria-label="Nova issue"
          title="Nova issue (C)"
        >
          <PenSquare className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Top items (Inbox, My issues) */}
      <nav className="px-2">
        <ul className="space-y-px">
          {filteredTopItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isNavItemActive(pathname, item.href, item.exact)}
              onOpenCustomize={() => setCustomizeOpen(true)}
            />
          ))}
        </ul>
      </nav>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto px-2 pt-3 pb-2">
        {filteredSections.map((section) => (
          <Fragment key={section.label}>
            <Section
              section={section}
              pathname={pathname}
              collapsed={!!collapsed[section.label || ""]}
              onToggle={() => toggle(section.label || "")}
              onOpenCustomize={() => setCustomizeOpen(true)}
              prepend={
                section.label === "Workspace" ? (
                  <ProjectSelectorSidebar />
                ) : null
              }
            />
          </Fragment>
        ))}
      </nav>

      {/* Customize sidebar modal */}
      <CustomizeSidebarModal
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
      />

      {/* New issue modal (compose button + atalho C global) */}
      <NewIssueModal open={newIssueOpen} onOpenChange={setNewIssueOpen} />

      {/* Footer */}
      <div className="border-t border-sidebar-border">
        {/* User info row: avatar + nome + badge de cargo (link p/ perfil) */}
        {user && (
          <Link
            href="/settings/account/profile"
            className="flex items-center gap-2 px-3 py-2 hover:bg-sidebar-accent transition-colors"
            aria-label="Ir para perfil"
          >
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-semibold text-white"
              aria-hidden
            >
              {userInitials}
            </div>
            <span className="flex-1 min-w-0 truncate text-[12px] font-medium">
              {user.nome}
            </span>
            {roleLabel && (
              <span
                className={cn(
                  "shrink-0 rounded border px-1.5 py-px text-[10px] font-medium uppercase tracking-wide",
                  roleBadgeClass,
                )}
                title={`Seu cargo no workspace: ${roleLabel}`}
              >
                {roleLabel}
              </span>
            )}
          </Link>
        )}

        {/* Actions row */}
        <div className="flex items-center justify-between border-t border-sidebar-border/60 px-3 py-2">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              aria-label="Ajuda"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <Link
              href="/settings"
              className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              aria-label="Configuracoes"
              title="Configuracoes"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <span className="text-amber-400">↑</span> Plano gratuito
          </button>
        </div>
      </div>
    </aside>
  );
}

function Section({
  section,
  pathname,
  collapsed,
  onToggle,
  onOpenCustomize,
  prepend,
}: {
  section: NavSection;
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
  onOpenCustomize: () => void;
  prepend?: ReactNode;
}) {
  return (
    <div className="mt-3 first:mt-0">
      {section.label && (
        <button
          type="button"
          onClick={onToggle}
          className="group flex w-full items-center gap-1 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100" />
          ) : (
            <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-100" />
          )}
          <span>{section.label}</span>
        </button>
      )}

      {!collapsed && (
        <div className="ml-3 border-l border-sidebar-border/60 pl-1">
          {prepend}
          <ul className="space-y-px">
            {section.team ? (
            <li>
              <div className="flex items-center gap-2 rounded-md px-2 py-1 text-[14px] font-medium">
                <section.team.icon
                  className={cn(
                    "h-3.5 w-3.5",
                    section.team.iconColor || "text-muted-foreground",
                  )}
                />
                <span className="truncate">{section.team.name}</span>
                <ChevronDown className="ml-auto h-3 w-3 text-muted-foreground/60" />
              </div>
              <ul className="ml-2 mt-px space-y-px border-l border-sidebar-border pl-2">
                {section.items.map((item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    active={isNavItemActive(pathname, item.href, item.exact)}
                    onOpenCustomize={onOpenCustomize}
                  />
                ))}
              </ul>
            </li>
          ) : (
            section.items.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                active={isNavItemActive(pathname, item.href, item.exact)}
                onOpenCustomize={onOpenCustomize}
              />
            ))
          )}
          </ul>
        </div>
      )}
    </div>
  );
}

function SidebarLink({
  item,
  active,
  onOpenCustomize,
}: {
  item: NavItem;
  active: boolean;
  onOpenCustomize?: () => void;
}) {
  // Items com popoverItems renderizam dropdown ao inves de link
  if (item.popoverItems && item.popoverItems.length > 0) {
    return (
      <PopoverLink
        item={item}
        active={active}
        onOpenCustomize={onOpenCustomize}
      />
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-[14px] transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-foreground font-medium"
            : "text-foreground/85 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
}

function PopoverLink({
  item,
  active,
  onOpenCustomize,
}: {
  item: NavItem;
  active: boolean;
  onOpenCustomize?: () => void;
}) {
  return (
    <li>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[14px] transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                : "text-foreground/85 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={8}
          className="w-56 border-border shadow-xl"
        >
          {item.popoverItems!.map((p, idx) => (
            <PopoverItemRow
              key={`${p.label}-${idx}`}
              item={p}
              onOpenCustomize={onOpenCustomize}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function PopoverItemRow({
  item,
  onOpenCustomize,
}: {
  item: PopoverNavItem;
  onOpenCustomize?: () => void;
}) {
  const Icon = item.icon;

  const content = (
    <>
      <Icon className="mr-2 h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
    </>
  );

  return (
    <>
      {item.separator && <DropdownMenuSeparator />}
      {item.action === "customize-sidebar" ? (
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onOpenCustomize?.();
          }}
          className="text-[14px] py-2"
        >
          {content}
        </DropdownMenuItem>
      ) : item.stub || !item.href ? (
        <DropdownMenuItem
          disabled
          title={item.hint}
          className="text-[14px] py-2 cursor-not-allowed"
        >
          {content}
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem asChild className="text-[14px] py-2">
          <Link href={item.href}>{content}</Link>
        </DropdownMenuItem>
      )}
    </>
  );
}

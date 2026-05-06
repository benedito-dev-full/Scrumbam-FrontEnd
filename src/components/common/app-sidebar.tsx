"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import {
  Search,
  PenSquare,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  LogOut,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [customizeOpen, setCustomizeOpen] = useState(false);
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

  const orgInitials = (user?.orgNome || "DT")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const orgShort =
    user?.orgNome && user.orgNome.length > 16
      ? user.orgNome.slice(0, 14) + ".."
      : user?.orgNome || "Workspace";

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex flex-1 min-w-0 items-center gap-2 rounded-md px-1.5 py-1 hover:bg-sidebar-accent transition-colors"
              aria-label="Menu do workspace"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gradient-to-br from-cyan-400 to-cyan-600 text-[10px] font-bold text-black">
                {orgInitials}
              </span>
              <span className="truncate text-[14px] font-medium">
                {orgShort}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium">
                  {user?.nome || "Usuario"}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {user?.email || ""}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-[13px]">
              <UserIcon className="mr-2 h-3.5 w-3.5" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-[13px]">
              <Settings className="mr-2 h-3.5 w-3.5" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-[13px] text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          onClick={openCommandPalette}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          aria-label="Buscar"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          aria-label="Compor"
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
              active={isNavItemActive(pathname, item.href)}
              onOpenCustomize={() => setCustomizeOpen(true)}
            />
          ))}
        </ul>
      </nav>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto px-2 pt-3 pb-2">
        {filteredSections.map((section) => (
          <Section
            key={section.label}
            section={section}
            pathname={pathname}
            collapsed={!!collapsed[section.label || ""]}
            onToggle={() => toggle(section.label || "")}
            onOpenCustomize={() => setCustomizeOpen(true)}
          />
        ))}
      </nav>

      {/* Customize sidebar modal */}
      <CustomizeSidebarModal
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
      />

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-sidebar-border px-3 py-2">
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          aria-label="Ajuda"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <span className="text-amber-400">↑</span> Free plan
        </button>
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
}: {
  section: NavSection;
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
  onOpenCustomize: () => void;
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
                    active={isNavItemActive(pathname, item.href)}
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
                active={isNavItemActive(pathname, item.href)}
                onOpenCustomize={onOpenCustomize}
              />
            ))
          )}
        </ul>
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

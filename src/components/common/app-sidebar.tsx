"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrumbanLogo } from "./scrumban-logo";
import { navSections, isNavItemActive } from "@/lib/navigation";

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.nome
    ? user.nome
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <aside className="hidden md:flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo section */}
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <ScrumbanLogo size="sm" />
        {user?.orgNome && (
          <span className="ml-auto text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5 truncate max-w-[80px]">
            Free
          </span>
        )}
      </div>

      {/* Org name */}
      {user?.orgNome && (
        <div className="px-4 py-2 border-b border-sidebar-border">
          <p className="text-xs font-medium text-sidebar-foreground truncate">
            {user.orgNome}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3">
        {navSections.map((section, sectionIdx) => (
          <div key={section.label} className={cn(sectionIdx > 0 && "mt-4")}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = isNavItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors relative",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--scrumban-brand)]" />
                    )}
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? item.iconColor : "text-muted-foreground",
                      )}
                    />
                    {item.label}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto text-[10px] font-bold tabular-nums bg-amber-500/15 text-amber-700 dark:text-amber-300 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Avatar className="h-8 w-8 ring-2 ring-sidebar-border">
              <AvatarFallback className="text-xs bg-[var(--scrumban-brand-muted)] text-[var(--scrumban-brand)] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Online dot */}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {user?.nome || "Usuario"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate capitalize">
              {user?.role || ""}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-muted-foreground/40 hover:text-sidebar-foreground transition-colors p-1 rounded-md hover:bg-sidebar-accent"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

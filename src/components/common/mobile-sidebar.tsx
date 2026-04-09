"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrumbanLogo } from "./scrumban-logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { navSections, isNavItemActive } from "@/lib/navigation";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[280px] p-0"
        showCloseButton={false}
      >
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="flex items-center gap-2 text-left">
            <ScrumbanLogo size="sm" />
          </SheetTitle>
        </SheetHeader>

        {/* Org name */}
        {user?.orgNome && (
          <div className="px-4 py-2 border-b">
            <p className="text-xs font-medium truncate">{user.orgNome}</p>
          </div>
        )}

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
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors relative min-h-[44px]",
                        isActive
                          ? "bg-accent text-accent-foreground font-semibold"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
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

        <div className="border-t p-3 mt-auto">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {user?.nome || "Usuario"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate capitalize">
                {user?.role || ""}
              </p>
            </div>
            <button
              onClick={() => {
                onOpenChange(false);
                logout();
              }}
              className="text-muted-foreground/60 hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

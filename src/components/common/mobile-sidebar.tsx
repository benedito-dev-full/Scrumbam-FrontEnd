"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  navTopItems,
  navSections,
  isNavItemActive,
  type NavItem,
} from "@/lib/navigation";

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

  const orgInitials = (user?.orgNome || "DT")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[280px] p-0 bg-sidebar text-sidebar-foreground"
        showCloseButton={false}
      >
        <SheetHeader className="px-3 py-3 border-b border-sidebar-border">
          <SheetTitle className="flex items-center gap-2 text-left text-[13px] font-medium">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-cyan-400 to-cyan-600 text-[10px] font-bold text-black">
              {orgInitials}
            </span>
            <span className="truncate">{user?.orgNome || "Workspace"}</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="px-2 pt-2">
          <ul className="space-y-px">
            {navTopItems.map((item) => (
              <MobileLink
                key={item.href}
                item={item}
                active={isNavItemActive(pathname, item.href)}
                onClose={close}
              />
            ))}
          </ul>
        </nav>

        <nav className="flex-1 overflow-y-auto px-2 pt-3 pb-2">
          {navSections.map((section) => (
            <div key={section.label} className="mt-3 first:mt-0">
              {section.label && (
                <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                  {section.label}
                </p>
              )}
              {section.team ? (
                <>
                  <div className="flex items-center gap-2 rounded-md px-2 py-1 text-[13px] font-medium">
                    <section.team.icon
                      className={cn(
                        "h-3.5 w-3.5",
                        section.team.iconColor || "text-muted-foreground",
                      )}
                    />
                    <span className="truncate">{section.team.name}</span>
                  </div>
                  <ul className="ml-2 space-y-px border-l border-sidebar-border pl-2">
                    {section.items.map((item) => (
                      <MobileLink
                        key={item.href}
                        item={item}
                        active={isNavItemActive(pathname, item.href)}
                        onClose={close}
                      />
                    ))}
                  </ul>
                </>
              ) : (
                <ul className="space-y-px">
                  {section.items.map((item) => (
                    <MobileLink
                      key={item.href}
                      item={item}
                      active={isNavItemActive(pathname, item.href)}
                      onClose={close}
                    />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3 mt-auto">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-muted text-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {user?.nome || "Usuario"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {user?.email || ""}
              </p>
            </div>
            <button
              onClick={() => {
                close();
                logout();
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-sidebar-accent"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileLink({
  item,
  active,
  onClose,
}: {
  item: NavItem;
  active: boolean;
  onClose: () => void;
}) {
  return (
    <li>
      <Link
        href={item.href}
        onClick={onClose}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-2 text-[13px] transition-colors min-h-[40px]",
          active
            ? "bg-sidebar-accent text-sidebar-foreground font-medium"
            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        )}
      >
        <item.icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    </li>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { LogOut, User, Menu, Search } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./theme-toggle";
import { BreadcrumbNav } from "./breadcrumb-nav";
import { NotificationBell } from "./notification-bell";

interface AppHeaderProps {
  onMenuToggle?: () => void;
}

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  const openCommandPalette = useCallback(() => {
    // Dispatch the same keyboard event that CommandPalette listens to
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }, [isMac]);

  const initials = user?.nome
    ? user.nome
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <header className="flex h-12 sm:h-14 items-center justify-between border-b border-border bg-background px-3 sm:px-4 md:px-8">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 md:hidden"
            onClick={onMenuToggle}
            aria-label="Abrir menu de navegacao"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        )}
        <BreadcrumbNav />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Mobile search icon */}
        <Button
          variant="ghost"
          size="sm"
          className="flex sm:hidden h-9 w-9 p-0"
          onClick={openCommandPalette}
          aria-label="Buscar"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Desktop search button — opens CommandPalette */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 h-8 px-3 text-muted-foreground font-normal w-48 justify-start"
          onClick={openCommandPalette}
          aria-label="Buscar no sistema"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Buscar...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">{isMac ? "\u2318" : "Ctrl"}</span>K
          </kbd>
        </Button>

        <NotificationBell />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="Menu do usuario">
              <Avatar className="h-8 w-8 ring-2 ring-border">
                <AvatarFallback className="text-xs bg-[var(--scrumban-brand-muted)] text-[var(--scrumban-brand)] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.nome || "Usuario"}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || ""}
                </p>
                {user?.role && (
                  <Badge
                    variant="outline"
                    className="w-fit text-xs mt-1 capitalize"
                  >
                    {user.role}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

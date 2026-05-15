"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/common/app-sidebar";
import { MobileSidebar } from "@/components/common/mobile-sidebar";
import { CommandPalette } from "@/components/common/command-palette";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Mobile top bar — substitui o botão fixo para evitar sobreposição com headers de página */}
      <div className="flex h-11 shrink-0 items-center px-3 border-b border-border bg-background md:hidden">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* Linha principal: sidebar (desktop) + conteúdo */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      <MobileSidebar
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
      />
      <CommandPalette />
    </div>
  );
}

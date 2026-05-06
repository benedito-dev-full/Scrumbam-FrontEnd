"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/common/app-sidebar";
import { MobileSidebar } from "@/components/common/mobile-sidebar";
import { CommandPalette } from "@/components/common/command-palette";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar />
      <MobileSidebar
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
      />

      {/* Mobile menu trigger (only visible on small screens) */}
      <button
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed top-3 left-3 z-30 flex h-9 w-9 items-center justify-center rounded-md bg-card border border-border md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      <main className="flex-1 overflow-hidden">{children}</main>

      <CommandPalette />
      <OnboardingWizard />
    </div>
  );
}

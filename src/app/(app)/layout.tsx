"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/common/app-sidebar";
import { AppHeader } from "@/components/common/app-header";
import { MobileSidebar } from "@/components/common/mobile-sidebar";
import { CommandPalette } from "@/components/common/command-palette";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <MobileSidebar
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader onMenuToggle={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
      <CommandPalette />
      <OnboardingWizard />
    </div>
  );
}

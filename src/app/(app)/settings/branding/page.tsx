"use client";

import { Palette } from "lucide-react";
import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { ComingSoon } from "@/components/common/coming-soon";

export default function BrandingPage() {
  usePageTitle("Branding");

  return (
    <PageTransition className="space-y-6 px-8 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Palette className="h-6 w-6 text-indigo-500" />
          Branding
        </h1>
        <p className="text-sm text-muted-foreground">
          Personalize a aparencia da plataforma para sua organizacao
        </p>
      </div>

      <ComingSoon
        icon={Palette}
        title="Branding (White Label)"
        description="Personalize cores, logo e nome do app para sua organizacao. Configure a identidade visual que seus usuarios verao ao acessar a plataforma."
      />
    </PageTransition>
  );
}

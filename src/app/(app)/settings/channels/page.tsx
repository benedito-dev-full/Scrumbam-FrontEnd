"use client";

import { Radio } from "lucide-react";
import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { ChannelsConfig } from "@/components/settings/channels-config";

export default function ChannelsPage() {
  usePageTitle("Canais");

  return (
    <PageTransition className="space-y-6 px-8 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Radio className="h-6 w-6 text-green-500" />
          Canais
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure canais de entrada de intencoes
        </p>
      </div>

      <ChannelsConfig />
    </PageTransition>
  );
}

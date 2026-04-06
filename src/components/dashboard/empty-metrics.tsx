"use client";

import type { LucideIcon } from "lucide-react";
import { BarChart3 } from "lucide-react";

interface EmptyMetricsProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

export function EmptyMetrics({
  title = "Sem dados suficientes",
  description = "Comece a criar intencoes para gerar metricas!",
  icon: Icon = BarChart3,
}: EmptyMetricsProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
      <div className="rounded-full bg-muted p-3">
        <Icon className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h4 className="mt-3 text-sm font-semibold text-foreground">{title}</h4>
      <p className="mt-1 text-xs text-muted-foreground max-w-[280px]">
        {description}
      </p>
    </div>
  );
}

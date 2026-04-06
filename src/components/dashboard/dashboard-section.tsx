"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function DashboardSection({
  icon: Icon,
  title,
  subtitle,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        {subtitle && (
          <span className="text-xs text-muted-foreground/60">— {subtitle}</span>
        )}
        <div className="flex-1 border-t border-border/40 ml-2" />
      </div>
      {children}
    </section>
  );
}

"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/common/animated-number";
import { cn } from "@/lib/utils";

type KpiVariant = "blue" | "amber" | "green" | "red" | "purple" | "default";

interface KpiCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  variant?: KpiVariant;
  isLoading?: boolean;
  className?: string;
}

const VARIANT_STYLES: Record<
  KpiVariant,
  { iconBg: string; iconText: string; cardAccent: string }
> = {
  blue: {
    iconBg: "bg-[var(--status-doing)]/10 dark:bg-[var(--status-doing)]/15",
    iconText: "text-[var(--status-doing)]",
    cardAccent: "border-l-[3px] border-l-[var(--status-doing)]",
  },
  amber: {
    iconBg: "bg-[var(--status-review)]/10 dark:bg-[var(--status-review)]/15",
    iconText: "text-[var(--status-review)]",
    cardAccent: "border-l-[3px] border-l-[var(--status-review)]",
  },
  green: {
    iconBg: "bg-[var(--status-done)]/10 dark:bg-[var(--status-done)]/15",
    iconText: "text-[var(--status-done)]",
    cardAccent: "border-l-[3px] border-l-[var(--status-done)]",
  },
  red: {
    iconBg: "bg-[var(--priority-high)]/10 dark:bg-[var(--priority-high)]/15",
    iconText: "text-[var(--priority-high)]",
    cardAccent: "border-l-[3px] border-l-[var(--priority-high)]",
  },
  purple: {
    iconBg: "bg-[var(--ai-accent)]/10 dark:bg-[var(--ai-accent)]/15",
    iconText: "text-[var(--ai-accent)]",
    cardAccent: "border-l-[3px] border-l-[var(--ai-accent)]",
  },
  default: {
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    cardAccent: "",
  },
};

function parseNumericValue(value: string | number): {
  num: number;
  suffix: string;
  decimals: number;
} | null {
  if (typeof value === "number") {
    return {
      num: value,
      suffix: "",
      decimals: Number.isInteger(value) ? 0 : 1,
    };
  }
  // Try to parse patterns like "2.5 dias", "3.2/sem", "0"
  const match = value.match(/^([\d.]+)\s*(.*)$/);
  if (match) {
    const num = parseFloat(match[1]);
    if (!isNaN(num)) {
      const suffix = match[2] ? ` ${match[2]}` : "";
      const decimals = match[1].includes(".")
        ? (match[1].split(".")[1]?.length ?? 1)
        : 0;
      return { num, suffix, decimals };
    }
  }
  return null;
}

export function KpiCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  variant = "default",
  isLoading,
  className,
}: KpiCardProps) {
  const styles = VARIANT_STYLES[variant];

  if (isLoading) {
    return (
      <Card className={cn(styles.cardAccent, className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const parsed = parseNumericValue(value);

  return (
    <Card className={cn(styles.cardAccent, className)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              styles.iconBg,
            )}
          >
            <Icon className={cn("h-5 w-5", styles.iconText)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold tracking-tight">
                {parsed ? (
                  <AnimatedNumber
                    value={parsed.num}
                    decimals={parsed.decimals}
                    suffix={parsed.suffix}
                  />
                ) : (
                  value
                )}
              </p>
              {trend && <TrendIndicator trend={trend} />}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrendIndicator({ trend }: { trend: "up" | "down" | "neutral" }) {
  if (trend === "up") {
    return <TrendingUp className="h-4 w-4 text-[var(--status-done)]" />;
  }
  if (trend === "down") {
    return <TrendingDown className="h-4 w-4 text-[var(--priority-high)]" />;
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

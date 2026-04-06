"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriodComparison } from "@/lib/hooks/use-analytics";

interface PeriodComparisonProps {
  projectId: string;
}

export function PeriodComparison({ projectId }: PeriodComparisonProps) {
  const { data, isLoading } = usePeriodComparison(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparativo de Throughput</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const trendIcon =
    data.trend === "melhoria" ? (
      <TrendingUp className="h-5 w-5 text-[var(--status-done)]" />
    ) : data.trend === "piora" ? (
      <TrendingDown className="h-5 w-5 text-[var(--priority-high)]" />
    ) : (
      <Minus className="h-5 w-5 text-muted-foreground" />
    );

  const trendColor =
    data.trend === "melhoria"
      ? "text-[var(--status-done)]"
      : data.trend === "piora"
        ? "text-[var(--priority-high)]"
        : "text-muted-foreground";

  const trendLabel =
    data.trend === "melhoria"
      ? "Melhoria"
      : data.trend === "piora"
        ? "Piora"
        : "Estavel";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comparativo de Throughput</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{data.throughputPeriod1}</p>
            <p className="text-xs text-muted-foreground">
              Ultimos {data.period1Days}d
            </p>
          </div>
          <div className="flex flex-col items-center justify-center">
            {trendIcon}
            <span className={`text-sm font-semibold ${trendColor}`}>
              {data.variationPercent > 0 ? "+" : ""}
              {data.variationPercent.toFixed(0)}%
            </span>
            <span className="text-xs text-muted-foreground">{trendLabel}</span>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{data.throughputPeriod2}</p>
            <p className="text-xs text-muted-foreground">
              {data.period1Days + 1}-{data.period2Days}d atras
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyMetrics } from "./empty-metrics";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import type { ThroughputResponse } from "@/types";

interface ThroughputChartProps {
  data: ThroughputResponse | undefined;
  isLoading?: boolean;
}

function formatWeekLabel(week: string): string {
  // '2026-W12' -> 'Sem 12'
  const match = week.match(/W(\d+)/);
  return match ? `Sem ${match[1]}` : week;
}

export function ThroughputChart({ data, isLoading }: ThroughputChartProps) {
  const isMobile = useIsMobile();
  const chartHeight = isMobile ? 180 : 250;
  const fontSize = isMobile ? 10 : 12;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.weeks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Throughput Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyMetrics description="Conclua intencoes para ver o throughput por semana" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.weeks.map((w) => ({
    week: formatWeekLabel(w.week),
    count: w.count,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Throughput Semanal
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Media: {data.averagePerWeek.toFixed(1)} intencoes/sem
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="week"
              fontSize={fontSize}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              interval={isMobile ? "preserveStartEnd" : 0}
            />
            <YAxis
              allowDecimals={false}
              fontSize={fontSize}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              width={isMobile ? 30 : undefined}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [
                `${value} intencoes concluidas`,
                "Throughput",
              ]}
            />
            <ReferenceLine
              y={data.averagePerWeek}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              label={{
                value: "Media",
                position: "right",
                fill: "hsl(var(--muted-foreground))",
                fontSize: 10,
              }}
            />
            <Bar
              dataKey="count"
              fill="var(--status-done)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

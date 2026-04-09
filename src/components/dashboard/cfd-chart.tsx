"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyMetrics } from "./empty-metrics";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import type { CfdResponse } from "@/types";

/**
 * Maps column names to semantic CSS variables for consistent coloring.
 * Falls back to a generic palette for unexpected column names.
 */
function getColumnColor(name: string, index: number): string {
  const lower = name.toLowerCase();
  if (
    lower.includes("todo") ||
    lower.includes("backlog") ||
    lower.includes("to do")
  ) {
    return "var(--status-todo)";
  }
  if (
    lower.includes("doing") ||
    lower.includes("progress") ||
    lower.includes("wip")
  ) {
    return "var(--status-doing)";
  }
  if (
    lower.includes("review") ||
    lower.includes("test") ||
    lower.includes("qa")
  ) {
    return "var(--status-review)";
  }
  if (
    lower.includes("done") ||
    lower.includes("complete") ||
    lower.includes("closed")
  ) {
    return "var(--status-done)";
  }
  // Fallback palette for custom columns
  const FALLBACK = [
    "#94a3b8",
    "#60a5fa",
    "#fbbf24",
    "#a78bfa",
    "#4ade80",
    "#f472b6",
    "#22d3ee",
    "#fb923c",
  ];
  return FALLBACK[index % FALLBACK.length];
}

interface CfdChartProps {
  data: CfdResponse | undefined;
  isLoading?: boolean;
}

function formatDateLabel(date: string): string {
  // '2026-03-15' -> '15/03'
  const parts = date.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
}

export function CfdChart({ data, isLoading }: CfdChartProps) {
  const isMobile = useIsMobile();

  // Transform nested data into flat format for Recharts
  const { chartData, columnNames } = useMemo(() => {
    if (!data || data.days.length === 0) {
      return { chartData: [], columnNames: [] };
    }

    // Extract unique column names from first day (preserves order from backend)
    const names = data.days[0].columns.map((c) => c.name);

    // Flatten: { date, 'To Do': 5, 'In Progress': 3, 'Done': 8 }
    const flat = data.days.map((day) => {
      const row: Record<string, string | number> = {
        date: formatDateLabel(day.date),
      };
      for (const col of day.columns) {
        row[col.name] = col.count;
      }
      return row;
    });

    return { chartData: flat, columnNames: names };
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Cumulative Flow Diagram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyMetrics description="Crie e mova intencoes para gerar o CFD" />
        </CardContent>
      </Card>
    );
  }

  const chartHeight = isMobile ? 200 : 280;
  const fontSize = isMobile ? 10 : 12;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Cumulative Flow Diagram
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={chartData}>
            <XAxis
              dataKey="date"
              fontSize={fontSize}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              interval={isMobile ? Math.ceil(chartData.length / 5) : "preserveStartEnd"}
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
            />
            <Legend
              wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
              iconType="rect"
              iconSize={isMobile ? 8 : 10}
            />
            {columnNames.map((name, index) => {
              const color = getColumnColor(name, index);
              return (
                <Area
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stackId="cfd"
                  fill={color}
                  stroke={color}
                  fillOpacity={0.6}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

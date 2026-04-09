"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyMetrics } from "./empty-metrics";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import type { StatusCount } from "@/types";
import { STATUS } from "@/lib/constants";

const STATUS_COLORS: Record<string, string> = {
  [STATUS.TODO]: "var(--status-todo)",
  [STATUS.DOING]: "var(--status-doing)",
  [STATUS.DONE]: "var(--status-done)",
};

const DEFAULT_COLOR = "var(--status-review)";

interface StatusDistributionProps {
  data: StatusCount[] | undefined;
  isLoading?: boolean;
}

export function StatusDistribution({
  data,
  isLoading,
}: StatusDistributionProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Intencoes por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyMetrics description="Nenhuma intencao criada ainda" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((s) => ({
    name: s.statusNome,
    count: s.count,
    statusId: s.statusId,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Intencoes por Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" allowDecimals={false} fontSize={isMobile ? 10 : 12} />
            <YAxis
              type="category"
              dataKey="name"
              width={isMobile ? 60 : 80}
              fontSize={isMobile ? 10 : 12}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value} intencoes`, "Quantidade"]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.statusId}
                  fill={STATUS_COLORS[entry.statusId] || DEFAULT_COLOR}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

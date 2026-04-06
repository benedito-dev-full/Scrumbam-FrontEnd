"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyMetrics } from "./empty-metrics";
import type { MemberCount } from "@/types";

interface MemberDistributionProps {
  data: MemberCount[] | undefined;
  isLoading?: boolean;
}

export function MemberDistribution({
  data,
  isLoading,
}: MemberDistributionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
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
            Intencoes por Membro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyMetrics description="Nenhuma intencao atribuida ainda" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((m) => ({
    name: m.memberNome,
    count: m.count,
  }));

  const chartHeight = Math.max(160, chartData.length * 40);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Intencoes por Membro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" allowDecimals={false} fontSize={12} />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              fontSize={12}
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
              formatter={(value: any) => [`${value} intencoes`, "Atribuidas"]}
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              radius={[0, 4, 4, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

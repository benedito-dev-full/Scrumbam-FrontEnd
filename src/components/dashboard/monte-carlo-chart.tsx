"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyMetrics } from "./empty-metrics";
import { useForecast } from "@/lib/hooks/use-forecast";
import { TrendingUp, Calendar, Target } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonteCarloChartProps {
  projectId: string;
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd MMM yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function MonteCarloChart({ projectId }: MonteCarloChartProps) {
  const [items, setItems] = useState(10);
  const [confidence, setConfidence] = useState(85);

  const { data, isLoading, isError } = useForecast(
    projectId,
    items,
    confidence,
  );

  // Build distribution chart data from percentiles
  const chartData = data
    ? [
        {
          label: "Otimista (50%)",
          date: data.simulations.p50,
          percentile: 50,
          fill: "hsl(var(--chart-1))",
        },
        {
          label: "Provavel (75%)",
          date: data.simulations.p75,
          percentile: 75,
          fill: "hsl(var(--chart-2))",
        },
        {
          label: "Confiavel (85%)",
          date: data.simulations.p85,
          percentile: 85,
          fill: "hsl(var(--chart-3))",
        },
        {
          label: "Conservador (95%)",
          date: data.simulations.p95,
          percentile: 95,
          fill: "hsl(var(--chart-4))",
        },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">
              Monte Carlo Forecasting
            </CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="mc-items" className="text-xs whitespace-nowrap">
                Items:
              </Label>
              <Input
                id="mc-items"
                type="number"
                min={1}
                max={500}
                value={items}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (v >= 1 && v <= 500) setItems(v);
                }}
                className="h-7 w-16 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="mc-confidence"
                className="text-xs whitespace-nowrap"
              >
                Confianca:
              </Label>
              <Input
                id="mc-confidence"
                type="number"
                min={50}
                max={99}
                value={confidence}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (v >= 50 && v <= 99) setConfidence(v);
                }}
                className="h-7 w-16 text-xs"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        )}

        {isError && (
          <EmptyMetrics description="Sem dados historicos suficientes para previsao. Conclua intencoes para gerar historico." />
        )}

        {data && (
          <div className="space-y-4">
            {/* KPI Banner */}
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-primary/5 p-3">
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {confidence}% de chance de entregar {items} items ate
                </span>
                <Badge variant="secondary" className="font-semibold">
                  <Calendar className="mr-1 h-3 w-3" />
                  {formatDate(data.estimatedDate)}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                ({data.simulationCount} simulacoes | media{" "}
                {data.averageThroughputPerWeek.toFixed(1)} items/sem |{" "}
                {data.historicalWeeks} sem historico)
              </span>
            </div>

            {/* Percentile Bars */}
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} layout="vertical">
                <XAxis type="category" dataKey="date" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={140}
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
                  formatter={(
                    _value: unknown,
                    _name: unknown,
                    props: { payload?: { date?: string; percentile?: number } },
                  ) => {
                    const payload = props.payload;
                    return [
                      `${formatDate(payload?.date ?? "")} (${payload?.percentile ?? 0}% confianca)`,
                      "Previsao",
                    ];
                  }}
                />
                <ReferenceLine
                  x={data.estimatedDate}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="3 3"
                />
                <Bar dataKey="percentile" radius={[0, 4, 4, 0]} maxBarSize={32}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Date summary table */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {chartData.map((entry) => (
                <div
                  key={entry.percentile}
                  className="rounded-lg border p-2 text-center"
                >
                  <p className="text-[10px] text-muted-foreground">
                    {entry.label}
                  </p>
                  <p className="text-xs font-semibold">
                    {formatDate(entry.date)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

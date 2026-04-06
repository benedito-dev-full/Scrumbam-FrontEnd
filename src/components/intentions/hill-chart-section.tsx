"use client";

import { Mountain } from "lucide-react";
import type { IntentionDocument } from "@/types/intention";
import { HillChart } from "./hill-chart";

// Priority color -> label for legend
const PRIORITY_LEGEND = [
  { key: "urgent", label: "Urgente", color: "var(--priority-urgent)" },
  { key: "high", label: "Alta", color: "var(--priority-high)" },
  { key: "medium", label: "Media", color: "var(--priority-medium)" },
  { key: "low", label: "Baixa", color: "var(--priority-low)" },
];

interface HillChartSectionProps {
  intentions: IntentionDocument[];
  onUpdatePosition: (intentionId: string, newPosition: number) => void;
  compact?: boolean;
}

export function HillChartSection({
  intentions,
  onUpdatePosition,
  compact = false,
}: HillChartSectionProps) {
  // V3: Count intentions by zone (Refinamento vs Execucao)
  const inboxCount = intentions.filter((i) => i.status === "inbox").length;
  const readyCount = intentions.filter((i) => i.status === "ready").length;
  const executingCount = intentions.filter(
    (i) => i.status === "executing",
  ).length;
  const doneCount = intentions.filter(
    (i) =>
      i.status === "done" ||
      i.status === "validated" ||
      i.status === "validating" ||
      i.status === "failed",
  ).length;

  const refinementCount = inboxCount + readyCount;
  const executionCount = executingCount + doneCount;
  const totalActive = refinementCount + executionCount;

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mountain className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Hill Chart</h3>
          <span className="text-xs text-muted-foreground">
            {totalActive} intencoes
          </span>
        </div>

        {/* V3: Zone counts — Refinamento | Execucao */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span title="INBOX + READY">
            <span className="font-medium text-foreground">
              {refinementCount}
            </span>{" "}
            refinando
          </span>
          <span className="text-border">|</span>
          <span title="EXECUTING + DONE + VALIDATING + VALIDATED + FAILED">
            <span className="font-medium text-foreground">
              {executionCount}
            </span>{" "}
            executando
          </span>
        </div>
      </div>

      {/* Chart */}
      <HillChart
        intentions={intentions}
        onUpdatePosition={onUpdatePosition}
        compact={compact}
      />

      {/* Legend */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-4">
          {PRIORITY_LEGEND.map((item) => (
            <div key={item.key} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10px] text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/60 italic">
          Arraste pontos INBOX/READY para refinar
        </p>
      </div>
    </div>
  );
}

"use client";
import { CheckCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RISK_LEVEL_CONFIG } from "@/lib/constants";
import type { RiskLevel } from "@/types/execution";

interface RiskBadgeProps {
  level: RiskLevel;
  explanation?: string;
  size?: "sm" | "default";
}

const ICONS = {
  LOW: CheckCircle,
  MEDIUM: AlertTriangle,
  HIGH: ShieldAlert,
};

export function RiskBadge({
  level,
  explanation,
  size = "default",
}: RiskBadgeProps) {
  const normalized = (
    typeof level === "string" ? level.toUpperCase() : "LOW"
  ) as RiskLevel;
  const config = RISK_LEVEL_CONFIG[normalized] ?? RISK_LEVEL_CONFIG.LOW;
  const Icon = ICONS[normalized] ?? ICONS.LOW;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  const textSize = size === "sm" ? "text-[10px]" : "text-[11px]";

  const badge = (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${textSize} ${config.className}`}
    >
      <Icon className={`${iconSize} ${config.iconColor}`} />
      {config.label}
    </span>
  );

  if (!explanation) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px] text-[11px]">
          {explanation}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

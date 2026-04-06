import { ArrowUp, Minus, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PRIORITY, PRIORITY_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priorityId: string;
  className?: string;
}

const PRIORITY_ICONS: Record<string, React.ElementType> = {
  [PRIORITY.HIGH]: ArrowUp,
  [PRIORITY.MEDIUM]: Minus,
  [PRIORITY.LOW]: ArrowDown,
};

export function PriorityBadge({ priorityId, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priorityId];
  if (!config) return null;

  const Icon = PRIORITY_ICONS[priorityId];

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] px-1.5 py-0 font-medium gap-1 border-transparent",
        config.bgClass,
        className,
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}

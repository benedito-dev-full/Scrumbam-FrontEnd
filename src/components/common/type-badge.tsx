import { Code2, Bug, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TASK_TYPE, TYPE_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TypeBadgeProps {
  typeId: string;
  className?: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  [TASK_TYPE.FEATURE]: Code2,
  [TASK_TYPE.BUG]: Bug,
  [TASK_TYPE.IMPROVEMENT]: Sparkles,
};

export function TypeBadge({ typeId, className }: TypeBadgeProps) {
  const config = TYPE_CONFIG[typeId];
  if (!config) return null;

  const Icon = TYPE_ICONS[typeId];

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

import { Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrumbanLogoProps {
  variant?: "full" | "icon" | "mono";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { icon: "h-5 w-5", text: "text-sm" },
  md: { icon: "h-6 w-6", text: "text-lg" },
  lg: { icon: "h-8 w-8", text: "text-2xl" },
};

export function ScrumbanLogo({
  variant = "full",
  size = "md",
  className,
}: ScrumbanLogoProps) {
  const s = sizeMap[size];

  if (variant === "icon") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Columns3
          className={cn(s.icon, "text-[var(--scrumban-brand)]")}
          strokeWidth={2.5}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Columns3
        className={cn(
          s.icon,
          variant === "mono" ? "text-current" : "text-[var(--scrumban-brand)]",
        )}
        strokeWidth={2.5}
      />
      <span
        className={cn(
          s.text,
          "font-bold tracking-tight",
          variant === "mono" ? "text-current" : "text-foreground",
        )}
      >
        Scrumban
      </span>
    </div>
  );
}

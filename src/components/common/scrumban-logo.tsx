import { cn } from "@/lib/utils";

interface ScrumbanLogoProps {
  variant?: "full" | "icon" | "mono";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { box: "h-5 w-5", text: "text-[14px]" },
  md: { box: "h-7 w-7", text: "text-[15px]" },
  lg: { box: "h-9 w-9", text: "text-[20px]" },
};

/**
 * Scrumban logo — SVG kanban-board mark inside a rounded square.
 * Three vertical bars represent To Do / In Progress / Done columns.
 */
function LogoMark({ className, mono }: { className?: string; mono?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="scrumban-grad" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      <rect
        width="24"
        height="24"
        rx="6"
        fill={mono ? "currentColor" : "url(#scrumban-grad)"}
      />
      {/* 3 kanban columns (To Do / Doing / Done with progress) */}
      <rect x="5.5" y="6" width="2.5" height="12" rx="0.8" fill="white" opacity="0.95" />
      <rect x="10.75" y="6" width="2.5" height="8" rx="0.8" fill="white" opacity="0.85" />
      <rect x="16" y="6" width="2.5" height="14" rx="0.8" fill="white" opacity="0.95" />
    </svg>
  );
}

export function ScrumbanLogo({
  variant = "full",
  size = "md",
  className,
}: ScrumbanLogoProps) {
  const s = sizeMap[size];
  const mono = variant === "mono";

  if (variant === "icon") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <LogoMark className={s.box} mono={mono} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark className={s.box} mono={mono} />
      <span
        className={cn(
          s.text,
          "font-semibold tracking-tight",
          mono ? "text-current" : "text-foreground",
        )}
      >
        Scrumban
      </span>
    </div>
  );
}

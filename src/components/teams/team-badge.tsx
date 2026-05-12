import { cn } from "@/lib/utils";
import { resolveTeamIcon } from "@/lib/team-icons";

const FALLBACK_COLOR = "#64748b";

const SIZE_CLASSES = {
  xs: "h-5 w-5 rounded-[5px] text-[9px] [&_svg]:h-3 [&_svg]:w-3",
  sm: "h-6 w-6 rounded-md text-[10px] [&_svg]:h-3.5 [&_svg]:w-3.5",
  md: "h-7 w-7 rounded-md text-[11px] [&_svg]:h-4 [&_svg]:w-4",
  lg: "h-9 w-9 rounded-md text-[14px] [&_svg]:h-5 [&_svg]:w-5",
} as const;

export type TeamBadgeSize = keyof typeof SIZE_CLASSES;

/**
 * Avatar quadrado do time: cor de fundo + (icone do registry) OR (inicial do nome).
 *
 * Usado em listas de times, sidebar, project cards, member lists — qualquer
 * lugar onde precisamos representar um time visualmente. Mantem o conceito
 * de "time de funcao" claro: icone reforca o proposito (Code = Dev, etc.).
 */
export function TeamBadge({
  name,
  color,
  icon,
  size = "md",
  className,
}: {
  name: string;
  color: string | null;
  icon: string | null;
  size?: TeamBadgeSize;
  className?: string;
}) {
  const bg = color || FALLBACK_COLOR;
  const Icon = icon ? resolveTeamIcon(icon) : null;
  const initial = name.charAt(0).toUpperCase() || "?";

  return (
    <span
      aria-hidden
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-bold text-white",
        SIZE_CLASSES[size],
        className,
      )}
      style={{ backgroundColor: bg }}
    >
      {Icon ? <Icon /> : initial}
    </span>
  );
}

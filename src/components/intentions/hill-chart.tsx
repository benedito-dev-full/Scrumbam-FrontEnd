"use client";

import { useRef, useCallback, useMemo } from "react";
import type { IntentionDocument, IntentionStatus } from "@/types/intention";
import { HillChartDot } from "./hill-chart-dot";

// ============================================================
// Hill curve math
// ============================================================

// SVG viewBox dimensions
const VB_WIDTH = 600;
const VB_HEIGHT = 220;

// Hill area (padded within viewBox)
const PADDING_X = 40;
const PADDING_TOP = 30;
const PADDING_BOTTOM = 40;

const HILL_LEFT = PADDING_X;
const HILL_RIGHT = VB_WIDTH - PADDING_X;
const HILL_WIDTH = HILL_RIGHT - HILL_LEFT;
const HILL_TOP = PADDING_TOP;
const HILL_BOTTOM = VB_HEIGHT - PADDING_BOTTOM;
const HILL_HEIGHT = HILL_BOTTOM - HILL_TOP;

// Convert position (0-100) to X coordinate
function positionToX(position: number): number {
  return HILL_LEFT + (position / 100) * HILL_WIDTH;
}

// Convert X coordinate to position (0-100)
function xToPosition(x: number): number {
  return ((x - HILL_LEFT) / HILL_WIDTH) * 100;
}

// Hill curve: bell-shaped sine curve
// position 0 -> bottom left, position 50 -> top, position 100 -> bottom right
function getYForPosition(position: number): number {
  // Sine curve: 0->0, 50->1, 100->0
  const t = position / 100;
  const height = Math.sin(t * Math.PI);
  return HILL_BOTTOM - height * HILL_HEIGHT;
}

// Generate SVG path for the hill curve
function generateHillPath(): string {
  const points: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const x = positionToX(i);
    const y = getYForPosition(i);
    points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join(" ");
}

// Generate SVG path for the filled area under the hill
function generateFillPath(): string {
  const hillPath = generateHillPath();
  const rightBottom = `L ${HILL_RIGHT.toFixed(1)} ${HILL_BOTTOM.toFixed(1)}`;
  const leftBottom = `L ${HILL_LEFT.toFixed(1)} ${HILL_BOTTOM.toFixed(1)}`;
  return `${hillPath} ${rightBottom} ${leftBottom} Z`;
}

// ============================================================
// V3 Atomic Model: Fixed positions by status
// ============================================================

// Status that should NOT appear on the hill chart at all
const HIDDEN_STATUSES = new Set<IntentionStatus>(["cancelled", "discarded"]);

// Fixed positions for statuses beyond the refinement zone (downhill)
const FIXED_POSITIONS: Partial<Record<IntentionStatus, number>> = {
  executing: 70,
  done: 100,
  failed: 85,
  validating: 90,
  validated: 100,
};

/**
 * V3 Atomic Model: Get effective hill position for an intention.
 *
 * - INBOX: uses stored hillPosition (0-25% range, default 10%)
 * - READY: uses stored hillPosition (25-50% range, default 40%)
 * - EXECUTING/DONE/FAILED/VALIDATING/VALIDATED: fixed positions (system-controlled)
 */
function getEffectiveHillPosition(intention: IntentionDocument): number {
  const fixed = FIXED_POSITIONS[intention.status];
  if (fixed !== undefined) return fixed;

  // For inbox/ready, use the stored position but clamp to safe defaults
  if (intention.status === "inbox") {
    const pos = intention.hillPosition;
    // Default to 10% if no position set, clamp to 0-25%
    return pos > 0 ? Math.min(pos, 25) : 10;
  }
  if (intention.status === "ready") {
    const pos = intention.hillPosition;
    // Default to 40% if no position set or too low, clamp to 25-50%
    return pos >= 25 ? Math.min(pos, 50) : 40;
  }

  // Fallback
  return intention.hillPosition;
}

// ============================================================
// Component
// ============================================================

interface HillChartProps {
  intentions: IntentionDocument[];
  onUpdatePosition: (intentionId: string, newPosition: number) => void;
  compact?: boolean;
}

export function HillChart({
  intentions,
  onUpdatePosition,
  compact = false,
}: HillChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const hillPath = useMemo(() => generateHillPath(), []);
  const fillPath = useMemo(() => generateFillPath(), []);

  const handleDrag = useCallback(
    (intentionId: string, newPosition: number) => {
      onUpdatePosition(intentionId, newPosition);
    },
    [onUpdatePosition],
  );

  // V3: Filter out cancelled/discarded — they never appear on the hill
  // For compact mode, also filter done/failed/validating/validated
  const visibleIntentions = useMemo(() => {
    return intentions.filter((i) => {
      if (HIDDEN_STATUSES.has(i.status)) return false;
      if (compact) {
        return (
          i.status !== "done" &&
          i.status !== "failed" &&
          i.status !== "validated"
        );
      }
      return true;
    });
  }, [intentions, compact]);

  // Generate previous positions (simulated as -10 to -20 from current)
  // Only for draggable (inbox/ready) dots — fixed dots don't have trails
  const previousPositions = useMemo(() => {
    const map: Record<string, number> = {};
    for (const intention of visibleIntentions) {
      const isDraggable =
        intention.status === "inbox" || intention.status === "ready";
      if (!isDraggable) continue;

      const effectivePos = getEffectiveHillPosition(intention);
      // Only show trail if position > 15 (has moved from start)
      if (effectivePos > 15) {
        map[intention.id] = Math.max(0, effectivePos - 10 - Math.random() * 10);
      }
    }
    return map;
  }, [visibleIntentions]);

  const midX = positionToX(50);
  const quarterX = positionToX(25);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
      className="w-full h-auto select-none"
      style={{ touchAction: "none" }}
    >
      <defs>
        {/* Gradient for the fill under the hill */}
        <linearGradient id="hillFillGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop
            offset="0%"
            stopColor="var(--status-doing)"
            stopOpacity="0.06"
          />
          <stop offset="50%" stopColor="var(--ai-accent)" stopOpacity="0.08" />
          <stop
            offset="100%"
            stopColor="var(--status-done)"
            stopOpacity="0.06"
          />
        </linearGradient>

        {/* Subtle grid pattern */}
        <pattern
          id="hillGrid"
          width="30"
          height="30"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 30 0 L 0 0 0 30"
            fill="none"
            stroke="var(--border)"
            strokeWidth="0.3"
            opacity="0.4"
          />
        </pattern>
      </defs>

      {/* Background grid (subtle) */}
      <rect
        x={HILL_LEFT}
        y={HILL_TOP}
        width={HILL_WIDTH}
        height={HILL_HEIGHT}
        fill="url(#hillGrid)"
        rx={4}
      />

      {/* Filled area under hill */}
      <path d={fillPath} fill="url(#hillFillGradient)" />

      {/* Hill curve line */}
      <path
        d={hillPath}
        fill="none"
        stroke="var(--border)"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* V3 Zone marker: vertical dashed line at 25% (INBOX | READY boundary) */}
      <line
        x1={quarterX}
        y1={HILL_TOP}
        x2={quarterX}
        y2={HILL_BOTTOM}
        stroke="var(--border)"
        strokeWidth={0.5}
        strokeDasharray="3 3"
        opacity={0.3}
      />

      {/* Vertical divider at 50% — Refinamento | Execucao boundary */}
      <line
        x1={midX}
        y1={HILL_TOP}
        x2={midX}
        y2={HILL_BOTTOM}
        stroke="var(--border)"
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.5}
      />

      {/* Phase labels */}
      {/* Left: Descoberta */}
      <text
        x={HILL_LEFT + HILL_WIDTH * 0.25}
        y={HILL_BOTTOM + 16}
        textAnchor="middle"
        fill="var(--muted-foreground)"
        fontSize={11}
        fontFamily="var(--font-sans)"
        fontWeight={500}
        opacity={0.7}
      >
        Descoberta
      </text>

      {/* Right: Entregue */}
      <text
        x={HILL_LEFT + HILL_WIDTH * 0.75}
        y={HILL_BOTTOM + 16}
        textAnchor="middle"
        fill="var(--muted-foreground)"
        fontSize={11}
        fontFamily="var(--font-sans)"
        fontWeight={500}
        opacity={0.7}
      >
        Entregue
      </text>

      {/* Top label: Clareza */}
      <text
        x={midX}
        y={HILL_TOP - 8}
        textAnchor="middle"
        fill="var(--muted-foreground)"
        fontSize={10}
        fontFamily="var(--font-sans)"
        fontWeight={600}
        opacity={0.6}
      >
        Clareza
      </text>

      {/* V3 Zone labels (small, at the base of the curve) */}
      <text
        x={positionToX(12.5)}
        y={HILL_BOTTOM + 28}
        textAnchor="middle"
        fill="var(--muted-foreground)"
        fontSize={8}
        fontFamily="var(--font-sans)"
        fontWeight={500}
        opacity={0.4}
        letterSpacing="0.5"
      >
        INBOX
      </text>
      <text
        x={positionToX(37.5)}
        y={HILL_BOTTOM + 28}
        textAnchor="middle"
        fill="var(--muted-foreground)"
        fontSize={8}
        fontFamily="var(--font-sans)"
        fontWeight={500}
        opacity={0.4}
        letterSpacing="0.5"
      >
        READY
      </text>
      <text
        x={positionToX(70)}
        y={HILL_BOTTOM + 28}
        textAnchor="middle"
        fill="var(--muted-foreground)"
        fontSize={8}
        fontFamily="var(--font-sans)"
        fontWeight={500}
        opacity={0.4}
        letterSpacing="0.5"
      >
        EXEC
      </text>
      <text
        x={positionToX(95)}
        y={HILL_BOTTOM + 28}
        textAnchor="middle"
        fill="var(--muted-foreground)"
        fontSize={8}
        fontFamily="var(--font-sans)"
        fontWeight={500}
        opacity={0.4}
        letterSpacing="0.5"
      >
        DONE
      </text>

      {/* Uphill arrow (left side) */}
      <text
        x={HILL_LEFT + 12}
        y={HILL_BOTTOM - 8}
        fill="var(--muted-foreground)"
        fontSize={14}
        opacity={0.35}
      >
        {"\u2197"}
      </text>

      {/* Downhill arrow (right side) */}
      <text
        x={HILL_RIGHT - 22}
        y={HILL_BOTTOM - 8}
        fill="var(--muted-foreground)"
        fontSize={14}
        opacity={0.35}
      >
        {"\u2198"}
      </text>

      {/* Dots for each intention — V3: use effective position */}
      {visibleIntentions.map((intention) => {
        const effectivePos = getEffectiveHillPosition(intention);
        const x = positionToX(effectivePos);
        const y = getYForPosition(effectivePos);

        const prevPos = previousPositions[intention.id];
        const prevX = prevPos !== undefined ? positionToX(prevPos) : undefined;
        const prevY =
          prevPos !== undefined ? getYForPosition(prevPos) : undefined;

        // V3: only inbox/ready are draggable by PO (0-50%)
        // executing/done/failed/validating/validated are fixed (system-controlled)
        const isDraggable =
          intention.status === "inbox" || intention.status === "ready";

        return (
          <HillChartDot
            key={intention.id}
            intention={intention}
            cx={x}
            cy={y}
            previousCx={prevX}
            previousCy={prevY}
            onDrag={handleDrag}
            positionToX={positionToX}
            xToPosition={xToPosition}
            getYForPosition={getYForPosition}
            svgRef={svgRef}
            isDraggable={isDraggable}
          />
        );
      })}
    </svg>
  );
}

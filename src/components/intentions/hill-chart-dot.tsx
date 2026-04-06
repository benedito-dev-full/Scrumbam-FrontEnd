"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import type { IntentionDocument, IntentionStatus } from "@/types/intention";

// Priority -> color mapping using CSS variables
const PRIORITY_COLORS: Record<string, string> = {
  urgent: "var(--priority-urgent)",
  high: "var(--priority-high)",
  medium: "var(--priority-medium)",
  low: "var(--priority-low)",
};

// Status that have fixed (non-draggable) positions on the hill
const FIXED_STATUS_SET = new Set<IntentionStatus>([
  "executing",
  "done",
  "failed",
  "validating",
  "validated",
]);

// SVG icon paths for fixed-status dots (rendered inside the dot circle)
function StatusIcon({
  status,
  x,
  y,
}: {
  status: IntentionStatus;
  x: number;
  y: number;
}) {
  const iconSize = 5;

  switch (status) {
    case "executing":
      // Pulsing border handled via CSS; no inner icon needed
      return null;
    case "done":
      // Checkmark
      return (
        <polyline
          points={`${x - iconSize * 0.6},${y} ${x - iconSize * 0.15},${y + iconSize * 0.45} ${x + iconSize * 0.6},${y - iconSize * 0.4}`}
          fill="none"
          stroke="var(--card)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pointerEvents: "none" }}
        />
      );
    case "failed":
      // X mark
      return (
        <g style={{ pointerEvents: "none" }}>
          <line
            x1={x - iconSize * 0.4}
            y1={y - iconSize * 0.4}
            x2={x + iconSize * 0.4}
            y2={y + iconSize * 0.4}
            stroke="var(--card)"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <line
            x1={x + iconSize * 0.4}
            y1={y - iconSize * 0.4}
            x2={x - iconSize * 0.4}
            y2={y + iconSize * 0.4}
            stroke="var(--card)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>
      );
    case "validating":
      // Eye icon (simplified circle with inner dot)
      return (
        <g style={{ pointerEvents: "none" }}>
          <circle
            cx={x}
            cy={y}
            r={iconSize * 0.35}
            fill="var(--card)"
            stroke="none"
          />
        </g>
      );
    case "validated":
      // Double check
      return (
        <g style={{ pointerEvents: "none" }}>
          <polyline
            points={`${x - iconSize * 0.7},${y} ${x - iconSize * 0.25},${y + iconSize * 0.4} ${x + iconSize * 0.3},${y - iconSize * 0.35}`}
            fill="none"
            stroke="var(--card)"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={`${x - iconSize * 0.35},${y} ${x + iconSize * 0.1},${y + iconSize * 0.4} ${x + iconSize * 0.65},${y - iconSize * 0.35}`}
            fill="none"
            stroke="var(--card)"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    default:
      return null;
  }
}

// Tooltip label for the status phase
function getPhaseLabel(status: IntentionStatus, position: number): string {
  if (FIXED_STATUS_SET.has(status)) {
    const labels: Partial<Record<IntentionStatus, string>> = {
      executing: "Executando",
      done: "Concluido",
      failed: "Falhou",
      validating: "Validando",
      validated: "Validado",
    };
    return labels[status] ?? "Entregue";
  }
  if (position < 50) return "Descoberta";
  if (position === 50) return "Clareza";
  return "Entregue";
}

interface HillChartDotProps {
  intention: IntentionDocument;
  cx: number;
  cy: number;
  previousCx?: number;
  previousCy?: number;
  onDrag: (intentionId: string, newPosition: number) => void;
  positionToX: (position: number) => number;
  xToPosition: (x: number) => number;
  getYForPosition: (position: number) => number;
  svgRef: React.RefObject<SVGSVGElement | null>;
  isDraggable?: boolean;
}

export function HillChartDot({
  intention,
  cx,
  cy,
  previousCx,
  previousCy,
  onDrag,
  xToPosition,
  getYForPosition,
  positionToX,
  svgRef,
  isDraggable = true,
}: HillChartDotProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(cx);
  const [dragY, setDragY] = useState(cy);
  const [isHovered, setIsHovered] = useState(false);
  const dotRef = useRef<SVGGElement>(null);

  const isFixed = FIXED_STATUS_SET.has(intention.status);
  const color = PRIORITY_COLORS[intention.priority] ?? PRIORITY_COLORS.medium;

  // Sync position when not dragging — animate fixed dots via CSS transition
  useEffect(() => {
    if (!isDragging) {
      setDragX(cx);
      setDragY(cy);
    }
  }, [cx, cy, isDragging]);

  const getSvgPoint = useCallback(
    (clientX: number): number => {
      const svg = svgRef.current;
      if (!svg) return cx;
      const rect = svg.getBoundingClientRect();
      const svgWidth = svg.viewBox.baseVal.width || rect.width;
      const scale = svgWidth / rect.width;
      return (clientX - rect.left) * scale;
    },
    [svgRef, cx],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggable) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      (e.target as SVGElement).setPointerCapture(e.pointerId);
    },
    [isDraggable],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const svgX = getSvgPoint(e.clientX);
      const newPosition = xToPosition(svgX);
      // V3: PO can only drag within 0-50% (uphill = refinement zone)
      const maxDrag = 50;
      const clampedPosition = Math.max(0, Math.min(maxDrag, newPosition));
      const newX = positionToX(clampedPosition);
      const newY = getYForPosition(clampedPosition);
      setDragX(newX);
      setDragY(newY);
    },
    [isDragging, getSvgPoint, xToPosition, positionToX, getYForPosition],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      setIsDragging(false);
      (e.target as SVGElement).releasePointerCapture(e.pointerId);
      const svgX = getSvgPoint(e.clientX);
      // V3: clamp to 0-50% on release as well
      const maxDrag = 50;
      const newPosition = Math.max(0, Math.min(maxDrag, xToPosition(svgX)));
      onDrag(intention.id, newPosition);
    },
    [isDragging, getSvgPoint, xToPosition, onDrag, intention.id],
  );

  const displayX = isDragging ? dragX : cx;
  const displayY = isDragging ? dragY : cy;
  const dotRadius = isHovered || isDragging ? 9 : 7;

  // Phase label for tooltip
  const position = intention.hillPosition;
  const phaseLabel = getPhaseLabel(intention.status, position);

  // Tooltip suffix
  const tooltipSuffix = isFixed ? " (automatico)" : "";

  return (
    <g ref={dotRef}>
      {/* CSS animation for pulsing executing dots */}
      {intention.status === "executing" && (
        <circle
          cx={displayX}
          cy={displayY}
          r={dotRadius + 4}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          opacity={0.4}
          style={{ pointerEvents: "none" }}
        >
          <animate
            attributeName="r"
            values={`${dotRadius + 2};${dotRadius + 7};${dotRadius + 2}`}
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.4;0.1;0.4"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Previous position ghost (dashed trail) — only for draggable dots */}
      {isDraggable && previousCx !== undefined && previousCy !== undefined && (
        <>
          <circle
            cx={previousCx}
            cy={previousCy}
            r={5}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeDasharray="3 2"
            opacity={0.35}
          />
          <line
            x1={previousCx}
            y1={previousCy}
            x2={displayX}
            y2={displayY}
            stroke={color}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.3}
          />
        </>
      )}

      {/* Drag guide line */}
      {isDragging && (
        <line
          x1={displayX}
          y1={displayY}
          x2={displayX}
          y2={displayY + 30}
          stroke={color}
          strokeWidth={1}
          strokeDasharray="2 2"
          opacity={0.5}
        />
      )}

      {/* Main dot — with smooth CSS transition for fixed-status position changes */}
      <circle
        cx={displayX}
        cy={displayY}
        r={dotRadius}
        fill={color}
        stroke="var(--card)"
        strokeWidth={2.5}
        opacity={isDraggable ? 1 : 0.85}
        style={{
          cursor: isDraggable ? "grab" : "default",
          filter: isDragging
            ? "drop-shadow(0 4px 8px rgba(0,0,0,0.3))"
            : "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
          transition: isDragging
            ? "none"
            : isFixed
              ? "r 0.15s ease, filter 0.15s ease, cx 0.5s ease, cy 0.5s ease"
              : "r 0.15s ease, filter 0.15s ease",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => {
          if (!isDragging) setIsHovered(false);
        }}
      />

      {/* Status icon inside dot for fixed-status dots */}
      {isFixed && (
        <StatusIcon status={intention.status} x={displayX} y={displayY} />
      )}

      {/* Tooltip */}
      {(isHovered || isDragging) && (
        <g style={{ pointerEvents: "none" }}>
          {/* Tooltip background */}
          <rect
            x={displayX - 90}
            y={displayY - 52}
            width={180}
            height={38}
            rx={6}
            fill="var(--popover)"
            stroke="var(--border)"
            strokeWidth={1}
            style={{
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.12))",
            }}
          />
          {/* Tooltip arrow */}
          <polygon
            points={`${displayX - 5},${displayY - 14} ${displayX + 5},${displayY - 14} ${displayX},${displayY - 8}`}
            fill="var(--popover)"
            stroke="var(--border)"
            strokeWidth={1}
            strokeLinejoin="round"
          />
          {/* Cover the arrow's top border */}
          <line
            x1={displayX - 5}
            y1={displayY - 14.5}
            x2={displayX + 5}
            y2={displayY - 14.5}
            stroke="var(--popover)"
            strokeWidth={2}
          />
          {/* Title */}
          <text
            x={displayX}
            y={displayY - 36}
            textAnchor="middle"
            fill="var(--popover-foreground)"
            fontSize={11}
            fontWeight={600}
            fontFamily="var(--font-sans)"
          >
            {intention.title.length > 28
              ? intention.title.slice(0, 26) + "..."
              : intention.title}
          </text>
          {/* Phase + position */}
          <text
            x={displayX}
            y={displayY - 22}
            textAnchor="middle"
            fill="var(--muted-foreground)"
            fontSize={10}
            fontFamily="var(--font-sans)"
          >
            {phaseLabel} - {Math.round(position)}%{tooltipSuffix}
          </text>
        </g>
      )}
    </g>
  );
}

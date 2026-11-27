"use client";

import { useId, type PointerEvent as ReactPointerEvent } from "react";
import type {
  DiagramLine,
  DiagramObject,
  SoccerDiagram,
} from "../lib/diagram-data";

import { DiagramField } from "./diagram-field";
import { EquipmentGraphic } from "./diagram-equipment";

type Props = {
  diagram: SoccerDiagram;
  selectedId?: string | null;
  interactive?: boolean;
  onPointerDown?: (event: ReactPointerEvent<SVGElement>, id?: string) => void;
  onPointerMove?: (event: ReactPointerEvent<SVGElement>) => void;
  onPointerUp?: (event: ReactPointerEvent<SVGElement>) => void;
};

export function DiagramCanvas({
  diagram,
  selectedId,
  interactive,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: Props) {
  const rawId = useId();
  const markerId = `arrow-${rawId.replace(/:/g, "")}`;
  const horizontal = diagram.orientation === "horizontal";
  return (
    <svg
      viewBox={horizontal ? "0 0 1000 650" : "0 0 650 1000"}
      role="img"
      aria-label="Soccer drill diagram"
      className={
        interactive
          ? `block h-auto w-full touch-none select-none rounded-lg shadow-xl ${horizontal ? "md:w-[min(100%,153.846cqh)]" : "md:w-[min(100%,65cqh)]"}`
          : "block h-auto w-full rounded-lg"
      }
      onPointerDown={(e) => onPointerDown?.(e)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={onPointerUp}
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
        </marker>
      </defs>
      <DiagramField
        template={diagram.field}
        horizontal={horizontal}
        id={markerId}
      />
      {diagram.lines.map((line) => (
        <Line
          key={line.id}
          line={line}
          width={horizontal ? 1000 : 650}
          height={horizontal ? 650 : 1000}
          markerId={markerId}
          selected={selectedId === line.id}
          onDown={(e) => {
            e.stopPropagation();
            onPointerDown?.(e, line.id);
          }}
        />
      ))}
      {diagram.objects.map((object) => (
        <ObjectMark
          key={object.id}
          object={object}
          width={horizontal ? 1000 : 650}
          height={horizontal ? 650 : 1000}
          selected={selectedId === object.id}
          onDown={(e) => {
            e.stopPropagation();
            onPointerDown?.(e, object.id);
          }}
        />
      ))}
    </svg>
  );
}

function Line({
  line,
  width,
  height,
  markerId,
  selected,
  onDown,
}: {
  line: DiagramLine;
  width: number;
  height: number;
  markerId: string;
  selected: boolean;
  onDown: (e: ReactPointerEvent<SVGElement>) => void;
}) {
  const x1 = line.x1 * width,
    y1 = line.y1 * height,
    x2 = line.x2 * width,
    y2 = line.y2 * height;
  const arrow = line.kind === "movement" || line.kind === "passing";
  const dash = line.kind === "dashed" || line.kind === "passing";
  const common = {
    stroke: line.color,
    strokeWidth: Math.max(4, line.width * 650),
    strokeDasharray: dash ? "16 12" : undefined,
    markerEnd: arrow ? `url(#${markerId})` : undefined,
    fill: "none",
    strokeLinecap: "round" as const,
  };
  const d =
    line.kind === "dribbling"
      ? `M${x1} ${y1} Q${(x1 + x2) / 2 - 35} ${(y1 + y2) / 2 - 35} ${(x1 + x2) / 2} ${(y1 + y2) / 2} T${x2} ${y2}`
      : undefined;
  return (
    <g onPointerDown={onDown} transform="scale(1 1)">
      <path d={d || `M${x1} ${y1}L${x2} ${y2}`} {...common} />
      <path
        d={d || `M${x1} ${y1}L${x2} ${y2}`}
        stroke="transparent"
        strokeWidth="28"
        fill="none"
      />
      {selected && (
        <path
          d={d || `M${x1} ${y1}L${x2} ${y2}`}
          stroke="#34d399"
          strokeWidth="12"
          strokeDasharray="4 10"
          fill="none"
          opacity=".8"
        />
      )}
    </g>
  );
}

function ObjectMark({
  object,
  width,
  height,
  selected,
  onDown,
}: {
  object: DiagramObject;
  width: number;
  height: number;
  selected: boolean;
  onDown: (e: ReactPointerEvent<SVGElement>) => void;
}) {
  const x = object.x * width;
  const y = object.y * height;
  const size = object.size * Math.min(width, height);
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${object.rotation})`}
      onPointerDown={onDown}
      className="cursor-grab"
    >
      {selected && (
        <circle
          r={Math.max(size * 0.78, 19)}
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeDasharray="4 5"
        />
      )}
      <g transform={`scale(${size / (object.kind === "text" ? 29 : 36)})`}>
        {object.kind !== "text" && (
          <rect x="-26" y="-23" width="52" height="46" fill="transparent" />
        )}
        <EquipmentGraphic
          kind={object.kind}
          color={object.color}
          label={object.label}
          playerShape={object.playerShape}
        />
      </g>
    </g>
  );
}

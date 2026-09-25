import { createId, type DrillDiagram } from "./training-data";

export const DIAGRAM_VERSION = 1;
export const fieldTemplates = ["full", "half", "final-third", "grid"] as const;
export const diagramOrientations = ["horizontal", "vertical"] as const;
export const objectKinds = ["player", "ball", "cone", "pole", "flag", "goal", "mini-goal", "text"] as const;
export const lineKinds = ["straight", "dashed", "movement", "passing", "dribbling"] as const;
export const diagramColors = ["#ffffff", "#22c55e", "#38bdf8", "#facc15", "#fb923c", "#f43f5e", "#a78bfa", "#0f172a"] as const;

export type FieldTemplate = (typeof fieldTemplates)[number];
export type DiagramOrientation = (typeof diagramOrientations)[number];
export type DiagramObjectKind = (typeof objectKinds)[number];
export type DiagramLineKind = (typeof lineKinds)[number];
export type PlayerShape = "circle" | "x" | "triangle";
export type DiagramObject = {
  id: string; kind: DiagramObjectKind; x: number; y: number; size: number; color: string;
  label: string; rotation: number; playerShape?: PlayerShape;
};
export type DiagramLine = {
  id: string; kind: DiagramLineKind; x1: number; y1: number; x2: number; y2: number;
  color: string; width: number;
};
export type SoccerDiagram = {
  version: typeof DIAGRAM_VERSION; field: FieldTemplate; orientation: DiagramOrientation;
  objects: DiagramObject[]; lines: DiagramLine[];
};

export function emptyDiagram(): SoccerDiagram {
  return { version: DIAGRAM_VERSION, field: "full", orientation: "horizontal", objects: [], lines: [] };
}
export function createDiagramObject(kind: DiagramObjectKind): DiagramObject {
  return { id: createId(), kind, x: .5, y: .5, size: kind === "text" ? .09 : .06, color: kind === "ball" ? "#ffffff" : "#facc15", label: kind === "text" ? "Label" : "", rotation: 0, ...(kind === "player" ? { playerShape: "circle" as const, color: "#38bdf8" } : {}) };
}
export function createDiagramLine(kind: DiagramLineKind, x1: number, y1: number, x2: number, y2: number): DiagramLine {
  return { id: createId(), kind, x1, y1, x2, y2, color: "#ffffff", width: .008 };
}
export function packDiagram(data: SoccerDiagram): DrillDiagram { return { version: DIAGRAM_VERSION, data: structuredClone(data) }; }
export function unpackDiagram(value: DrillDiagram | null): SoccerDiagram {
  if (!value || value.version !== DIAGRAM_VERSION || !value.data || typeof value.data !== "object") return emptyDiagram();
  const data = value.data as Partial<SoccerDiagram>;
  if (!fieldTemplates.includes(data.field as FieldTemplate) || !diagramOrientations.includes(data.orientation as DiagramOrientation) || !Array.isArray(data.objects) || !Array.isArray(data.lines)) return emptyDiagram();
  return structuredClone(data as SoccerDiagram);
}

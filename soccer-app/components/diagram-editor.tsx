"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  createDiagramLine,
  createDiagramObject,
  diagramColors,
  diagramOrientations,
  fieldTemplates,
  lineKinds,
  equipmentColors,
  type DiagramLine,
  type DiagramLineKind,
  type DiagramObjectKind,
  type SoccerDiagram,
} from "../lib/diagram-data";
import { DiagramCanvas } from "./diagram-canvas";
import {
  EquipmentGraphic,
  equipmentGroups,
  equipmentNames,
  isPlayer,
} from "./diagram-equipment";

type Props = {
  initial: SoccerDiagram;
  drillName: string;
  onSave: (diagram: SoccerDiagram) => void;
  onClose: () => void;
};
type Drag = {
  id?: string;
  pointerId: number;
  startX: number;
  startY: number;
  original: SoccerDiagram;
  drawing?: DiagramLineKind;
};
const lineNames: Record<DiagramLineKind, string> = {
  straight: "Straight",
  dashed: "Dashed",
  movement: "Movement arrow",
  passing: "Passing arrow",
  dribbling: "Dribbling path",
};
const fieldNames: Record<SoccerDiagram["field"], string> = {
  full: "Full field",
  half: "Half field",
  "final-third": "Final third",
  blank: "Blank training area",
  grid: "Training grid",
  "11v11": "11v11",
  "9v9": "9v9",
  "7v7": "7v7",
  "5v5": "5v5",
  futsal: "Futsal",
};

const control =
  "rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold hover:border-emerald-400 disabled:opacity-40";
const input =
  "mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100";
const heading =
  "text-[11px] font-semibold uppercase tracking-wider text-slate-400";

export function DiagramEditor({ initial, drillName, onSave, onClose }: Props) {
  const [diagram, setDiagram] = useState(() => structuredClone(initial));
  const [selected, setSelected] = useState<string | null>(null);
  const [drawTool, setDrawTool] = useState<DiagramLineKind | null>(null);
  const [past, setPast] = useState<SoccerDiagram[]>([]);
  const [future, setFuture] = useState<SoccerDiagram[]>([]);
  const [initialJson] = useState(() => JSON.stringify(initial));
  const drag = useRef<Drag | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const dirty = JSON.stringify(diagram) !== initialJson;
  const selectedObject = diagram.objects.find((o) => o.id === selected);
  const selectedLine = diagram.lines.find((l) => l.id === selected);
  const apply = (change: (current: SoccerDiagram) => SoccerDiagram) => {
    setPast((items) => [...items, structuredClone(diagram)].slice(-50));
    setFuture([]);
    setDiagram(change(diagram));
  };
  const close = () => {
    if (!dirty || window.confirm("Discard unsaved diagram changes?")) onClose();
  };
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selected &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault();
        setPast((items) => [...items, structuredClone(diagram)].slice(-50));
        setFuture([]);
        setDiagram((d) => ({
          ...d,
          objects: d.objects.filter((o) => o.id !== selected),
          lines: d.lines.filter((l) => l.id !== selected),
        }));
        setSelected(null);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [diagram, selected]);
  function addObject(kind: DiagramObjectKind) {
    const object = createDiagramObject(kind);
    apply((d) => ({ ...d, objects: [...d.objects, object] }));
    setSelected(object.id);
    setDrawTool(null);
  }
  function point(event: ReactPointerEvent<SVGElement>) {
    const svg =
      event.currentTarget instanceof SVGSVGElement
        ? event.currentTarget
        : event.currentTarget.ownerSVGElement!;
    const transform = svg.getScreenCTM();
    const viewBox = svg.viewBox.baseVal;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      transform!.inverse(),
    );
    return {
      x: Math.max(0, Math.min(1, point.x / viewBox.width)),
      y: Math.max(0, Math.min(1, point.y / viewBox.height)),
    };
  }
  function pointerDown(e: ReactPointerEvent<SVGElement>, id?: string) {
    if (drag.current || e.button !== 0) return;
    const target =
      e.currentTarget instanceof SVGSVGElement
        ? e.currentTarget
        : e.currentTarget.ownerSVGElement!;
    const p = point(e);
    if (drawTool && !id) {
      const line = createDiagramLine(drawTool, p.x, p.y, p.x, p.y);
      const original = structuredClone(diagram);
      drag.current = {
        pointerId: e.pointerId,
        startX: p.x,
        startY: p.y,
        original,
        drawing: drawTool,
        id: line.id,
      };
      target.setPointerCapture(e.pointerId);
      setDiagram((d) => ({ ...d, lines: [...d.lines, line] }));
      setSelected(line.id);
      return;
    }
    setSelected(id || null);
    if (id) {
      drag.current = {
        id,
        pointerId: e.pointerId,
        startX: p.x,
        startY: p.y,
        original: structuredClone(diagram),
      };
      target.setPointerCapture(e.pointerId);
    }
  }
  function pointerMove(event: ReactPointerEvent<SVGElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const { x, y } = point(event);
    const dx = x - active.startX;
    const dy = y - active.startY;
    if (active.drawing) {
      setDiagram((d) => ({
        ...d,
        lines: d.lines.map((line) =>
          line.id === active.id ? { ...line, x2: x, y2: y } : line,
        ),
      }));
      return;
    }
    if (!dx && !dy) {
      setDiagram(active.original);
      return;
    }
    setDiagram({
      ...active.original,
      objects: active.original.objects.map((object) =>
        object.id === active.id
          ? { ...object, x: clamp(object.x + dx), y: clamp(object.y + dy) }
          : object,
      ),
      lines: active.original.lines.map((line) =>
        line.id === active.id ? shiftLine(line, dx, dy) : line,
      ),
    });
  }

  function pointerUp(event: ReactPointerEvent<SVGElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.type !== "pointerup") {
      setDiagram(active.original);
      if (active.drawing) setSelected(null);
      return;
    }
    if (JSON.stringify(diagram) !== JSON.stringify(active.original)) {
      setPast((items) => [...items, active.original].slice(-50));
      setFuture([]);
    }
    if (active.drawing) setDrawTool(null);
  }
  function undo() {
    if (!past.length) return;
    const previous = past[past.length - 1];
    setFuture((f) => [structuredClone(diagram), ...f].slice(0, 50));
    setDiagram(previous);
    setPast((p) => p.slice(0, -1));
    setSelected(null);
  }
  function redo() {
    if (!future.length) return;
    const next = future[0];
    setPast((p) => [...p, structuredClone(diagram)]);
    setDiagram(next);
    setFuture((f) => f.slice(1));
    setSelected(null);
  }
  function remove() {
    if (!selected) return;
    apply((d) => ({
      ...d,
      objects: d.objects.filter((o) => o.id !== selected),
      lines: d.lines.filter((l) => l.id !== selected),
    }));
    setSelected(null);
  }
  function duplicate() {
    if (selectedObject) {
      const copy = {
        ...selectedObject,
        id: crypto.randomUUID(),
        x: clamp(selectedObject.x + 0.04),
        y: clamp(selectedObject.y + 0.04),
      };
      apply((d) => ({ ...d, objects: [...d.objects, copy] }));
      setSelected(copy.id);
    } else if (selectedLine) {
      const copy = {
        ...shiftLine(selectedLine, 0.04, 0.04),
        id: crypto.randomUUID(),
      };
      apply((d) => ({ ...d, lines: [...d.lines, copy] }));
      setSelected(copy.id);
    }
  }
  function updateSelected(values: Record<string, string | number | undefined>) {
    apply((d) => ({
      ...d,
      objects: d.objects.map((o) =>
        o.id === selected ? { ...o, ...values } : o,
      ),
      lines: d.lines.map((l) => (l.id === selected ? { ...l, ...values } : l)),
    }));
  }
  function layer(direction: -1 | 1) {
    if (selectedObject)
      apply((d) => {
        const a = [...d.objects],
          i = a.findIndex((o) => o.id === selected),
          to = direction < 0 ? 0 : a.length - 1;
        const [item] = a.splice(i, 1);
        a.splice(to, 0, item);
        return { ...d, objects: a };
      });
    else if (selectedLine)
      apply((d) => {
        const a = [...d.lines],
          i = a.findIndex((l) => l.id === selected),
          to = direction < 0 ? 0 : a.length - 1;
        const [item] = a.splice(i, 1);
        a.splice(to, 0, item);
        return { ...d, lines: a };
      });
  }
  const selection = selectedObject ?? selectedLine;
  const playerSelected = selectedObject && isPlayer(selectedObject.kind);

  return (
    <dialog
      ref={dialog}
      aria-label="Soccer diagram editor"
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-auto overscroll-contain bg-[#0b1322] text-slate-100 backdrop:bg-slate-950"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="flex min-h-full flex-col md:h-full">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-[#101b2e] px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
              Diagram builder
            </p>
            <h2 className="truncate text-lg font-semibold">
              {drillName || "Untitled drill"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button className={control} onClick={close}>
              Cancel
            </button>
            <button
              className="rounded-md bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-300"
              onClick={() => onSave(diagram)}
            >
              Save &amp; Done
            </button>
          </div>
        </header>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-800 px-4 py-2 sm:px-6">
          <button className={control} disabled={!past.length} onClick={undo}>
            Undo
          </button>
          <button className={control} disabled={!future.length} onClick={redo}>
            Redo
          </button>
          <label className="ml-1 flex items-center gap-2 text-xs text-slate-300">
            Template
            <select
              className={control}
              value={diagram.field}
              onChange={(event) =>
                apply((d) => ({
                  ...d,
                  field: event.target.value as SoccerDiagram["field"],
                }))
              }
            >
              {fieldTemplates.map((field) => (
                <option key={field} value={field}>
                  {fieldNames[field]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            Orientation
            <select
              className={`${control} capitalize`}
              value={diagram.orientation}
              onChange={(event) =>
                apply((d) => ({
                  ...d,
                  orientation: event.target
                    .value as SoccerDiagram["orientation"],
                }))
              }
            >
              {diagramOrientations.map((orientation) => (
                <option key={orientation} value={orientation}>
                  {orientation === "horizontal" ? "Horizontal" : "Vertical"}
                </option>
              ))}
            </select>
          </label>
          {dirty && (
            <span role="status" className="ml-auto text-xs text-amber-200">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="grid min-h-0 flex-1 md:grid-cols-[172px_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)_140px] lg:grid-cols-[172px_minmax(0,1fr)_210px] lg:grid-rows-[minmax(0,1fr)]">
          <aside
            aria-label="Equipment and drawing tools"
            className="border-b border-slate-800 bg-[#101b2e] p-3 md:overflow-y-auto md:border-r md:border-b-0"
          >
            <div className="flex flex-wrap gap-x-4 gap-y-3 md:block md:space-y-3">
              {equipmentGroups.map((group) => (
                <section key={group.name}>
                  <h3 className={heading}>{group.name}</h3>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {group.kinds.map((kind) => (
                      <button
                        key={kind}
                        aria-label={`Add ${equipmentNames[kind]}`}
                        title={equipmentNames[kind]}
                        onClick={() => addObject(kind)}
                        className="grid size-11 place-items-center rounded-md border border-slate-700 bg-slate-800 hover:border-emerald-400 hover:bg-slate-700"
                      >
                        <svg
                          viewBox="-28 -26 56 52"
                          width="34"
                          height="34"
                          aria-hidden="true"
                        >
                          <EquipmentGraphic
                            kind={kind}
                            color={equipmentColors[kind]}
                          />
                        </svg>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
              <section>
                <h3 className={heading}>Draw</h3>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {lineKinds.map((kind) => (
                    <button
                      key={kind}
                      aria-pressed={drawTool === kind}
                      aria-label={lineNames[kind]}
                      title={lineNames[kind]}
                      className={`grid size-11 place-items-center rounded-md border bg-slate-800 hover:border-emerald-400 ${drawTool === kind ? "border-emerald-400 text-emerald-300" : "border-slate-700"}`}
                      onClick={() =>
                        setDrawTool(drawTool === kind ? null : kind)
                      }
                    >
                      <svg
                        viewBox="0 0 28 28"
                        width="24"
                        height="24"
                        aria-hidden="true"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d={
                            kind === "dribbling"
                              ? "M4 22Q3 13 12 15T23 5"
                              : "M5 23L23 5"
                          }
                          strokeDasharray={
                            kind === "dashed" || kind === "passing"
                              ? "3 3"
                              : undefined
                          }
                        />
                        {(kind === "movement" || kind === "passing") && (
                          <path d="M15 5H23V13" />
                        )}
                      </svg>
                    </button>
                  ))}
                  <button
                    className={control}
                    title="Add text"
                    aria-label="Add text"
                    onClick={() => addObject("text")}
                  >
                    Aa
                  </button>
                </div>
              </section>
            </div>
          </aside>

          <section
            aria-label="Tactical field"
            className="flex min-h-0 min-w-0 flex-col items-center justify-center gap-2 bg-[#0b1322] p-3 sm:p-4"
          >
            <div className="flex min-h-0 w-full flex-1 items-center justify-center md:[container-type:size]">
              <DiagramCanvas
                diagram={diagram}
                selectedId={selected}
                interactive
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={pointerUp}
              />
            </div>
            {drawTool && (
              <p role="status" className="text-xs text-emerald-200">
                Drag on the field to draw a {lineNames[drawTool].toLowerCase()}.
              </p>
            )}
          </section>

          <aside
            aria-label="Selection properties"
            className="border-t border-slate-800 bg-[#101b2e] p-3 md:col-span-2 md:overflow-y-auto lg:col-span-1 lg:border-t-0 lg:border-l"
          >
            <h3 className={heading}>Selection</h3>
            {selection ? (
              <>
                <p className="mt-1 text-sm font-semibold">
                  {selectedObject
                    ? equipmentNames[selectedObject.kind]
                    : lineNames[selectedLine!.kind]}
                </p>
                <div className="mt-3 grid gap-3 sm:max-lg:grid-cols-3">
                  <div>
                    <label className="flex items-center justify-between text-xs text-slate-300">
                      Color
                      <input
                        type="color"
                        className="h-7 w-9 cursor-pointer"
                        value={selection.color}
                        onChange={(event) =>
                          updateSelected({ color: event.target.value })
                        }
                      />
                    </label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {diagramColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => updateSelected({ color })}
                          aria-label={`Set color ${color}`}
                          aria-pressed={selection.color === color}
                          className="size-7 rounded border-2"
                          style={{
                            backgroundColor: color,
                            borderColor:
                              selection.color === color ? "#34d399" : "#64748b",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  {selectedObject &&
                    (playerSelected || selectedObject.kind === "text") && (
                      <label className="text-xs text-slate-300">
                        {playerSelected ? "Jersey number / label" : "Label"}
                        <input
                          className={input}
                          maxLength={playerSelected ? 3 : 30}
                          value={selectedObject.label}
                          onChange={(event) =>
                            updateSelected({ label: event.target.value })
                          }
                        />
                      </label>
                    )}
                  {playerSelected && (
                    <label className="text-xs text-slate-300">
                      Player shape
                      <select
                        className={input}
                        value={selectedObject.playerShape ?? "jersey"}
                        onChange={(event) =>
                          updateSelected({
                            playerShape:
                              event.target.value === "jersey"
                                ? undefined
                                : event.target.value,
                          })
                        }
                      >
                        <option value="jersey">Jersey</option>
                        <option value="circle">Circle</option>
                        <option value="x">X</option>
                        <option value="triangle">Triangle</option>
                      </select>
                    </label>
                  )}
                  {selectedObject && (
                    <>
                      <label className="text-xs text-slate-300">
                        Size · {Math.round(selectedObject.size * 100)}%
                        <input
                          className="block w-full accent-emerald-400"
                          type="range"
                          min=".025"
                          max=".20"
                          step=".005"
                          value={selectedObject.size}
                          onChange={(event) =>
                            updateSelected({ size: Number(event.target.value) })
                          }
                        />
                      </label>
                      <label className="text-xs text-slate-300">
                        Rotation · {selectedObject.rotation}°
                        <input
                          className="block w-full accent-emerald-400"
                          type="range"
                          min="0"
                          max="359"
                          step="1"
                          value={selectedObject.rotation}
                          onChange={(event) =>
                            updateSelected({
                              rotation: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                    </>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-1.5">
                  <button className={control} onClick={duplicate}>
                    Duplicate
                  </button>
                  <button className={control} onClick={() => layer(1)}>
                    Bring front
                  </button>
                  <button className={control} onClick={() => layer(-1)}>
                    Send back
                  </button>
                  <button
                    className={`${control} text-rose-300`}
                    onClick={remove}
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-2 text-xs text-slate-400">
                Select an object or line to edit it.
              </p>
            )}
          </aside>
        </div>
      </div>
    </dialog>
  );
}

function clamp(value: number) {
  return Math.max(0.02, Math.min(0.98, value));
}

function shiftLine(line: DiagramLine, dx: number, dy: number): DiagramLine {
  const x = Math.max(
    -Math.min(line.x1, line.x2),
    Math.min(1 - Math.max(line.x1, line.x2), dx),
  );
  const y = Math.max(
    -Math.min(line.y1, line.y2),
    Math.min(1 - Math.max(line.y1, line.y2), dy),
  );
  return {
    ...line,
    x1: line.x1 + x,
    x2: line.x2 + x,
    y1: line.y1 + y,
    y2: line.y2 + y,
  };
}

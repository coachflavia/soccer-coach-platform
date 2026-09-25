"use client";

import { useRef, useState } from "react";
import { getUserLocale, translate } from "../lib/i18n";
import { LocalImageAsset, prepareLocalImage } from "../lib/media";
import { LocalImage } from "./local-image";

export function ImageUpload({ value, onChange, label, initials, shape = "rounded" }: {
  value: LocalImageAsset | null;
  onChange: (image: LocalImageAsset | null) => void;
  label: string;
  initials: string;
  shape?: "rounded" | "circle";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const locale = getUserLocale();

  async function select(file?: File) {
    if (!file) return;
    setError("");
    try { onChange(await prepareLocalImage(file)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The image could not be processed."); }
  }

  return <div>
    <span className="text-sm font-semibold text-slate-300">{label}</span>
    <div className="mt-2 flex items-center gap-4">
      <div className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border border-slate-700 bg-slate-800 text-xl font-bold text-emerald-300 ${shape === "circle" ? "rounded-full" : "rounded-2xl"}`}>
        {value ? <LocalImage src={value.dataUrl} alt="" /> : initials || "⚽"}
      </div>
      <div>
        <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void select(event.target.files?.[0])} />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-white hover:border-emerald-500">{translate(value ? "media.change" : "media.choose", locale)}</button>
          {value && <button type="button" onClick={() => onChange(null)} className="px-3 py-2 text-sm font-semibold text-slate-400 hover:text-white">{translate("media.remove", locale)}</button>}
        </div>
        <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">{translate("media.prototypeHelp", locale)}</p>
      </div>
    </div>
    {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
  </div>;
}

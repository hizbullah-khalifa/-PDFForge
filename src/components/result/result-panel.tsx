"use client";

import { useMemo, useState } from "react";
import type { EngineResult } from "@/lib/engines/base";
import { downloadBlob, formatBytes } from "@/lib/utils";
import { buildXlsxFromTables } from "@/lib/engines/sheets";
import { downloadAllImages } from "@/lib/engines/optimize-images";

interface Props {
  toolName: string;
  result: EngineResult;
  onReset: () => void;
}

export function ResultPanel({ toolName, result, onReset }: Props) {
  const [editedText, setEditedText] = useState<string | null>(null);
  const [selectedTables, setSelectedTables] = useState<Set<number>>(
    () => new Set(result.preview?.type === "tables" ? result.preview.tables.map((_, i) => i) : [])
  );
  const [exporting, setExporting] = useState(false);
  const totalOut = useMemo(() => result.outputs.reduce((s, o) => s + o.blob.size, 0), [result]);

  const exportSelectedTables = async () => {
    if (result.preview?.type !== "tables") return;
    setExporting(true);
    try {
      const all = await fetchAllTables(result);
      const chosen = all.filter((_, i) => selectedTables.has(i));
      const blob = await buildXlsxFromTables(chosen.length ? chosen : all);
      downloadBlob(blob, "tables.xlsx");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="animate-fadeUp rounded-2xl border border-emerald-500/40 bg-[var(--card)] p-6 shadow-soft sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-lg text-white" aria-hidden>✓</span>
        <div>
          <h2 className="text-lg font-extrabold">Your file is ready!</h2>
          {result.message && <p className="text-sm text-slate-500 dark:text-slate-400">{result.message}</p>}
        </div>
      </div>

      {result.preview?.type === "images" && result.preview.images.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold">Image preview ({result.preview.images.length})</p>
            <button
              onClick={() => {
                const p = result.preview;
                if (p?.type === "images") downloadAllImages(p.images);
              }}
              className="btn-ghost !py-1.5 text-xs"
            >
              ⬇ Download each
            </button>
          </div>
          <div className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto rounded-xl bg-slate-100 p-3 sm:grid-cols-4 dark:bg-slate-800/60">
            {result.preview.images.map((img) => (
              <a key={img.url} href={img.url} download={img.name} className="group relative overflow-hidden rounded-lg border border-[var(--border)] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.name} className="aspect-[3/4] w-full object-contain p-1 transition group-hover:scale-105" loading="lazy" />
                <span className="absolute inset-x-1 bottom-1 truncate rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">{img.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {result.preview?.type === "tables" && (
        <div className="mt-6 space-y-4">
          <p className="text-sm font-bold">
            {result.preview.tables.length} table{result.preview.tables.length !== 1 ? "s" : ""} detected — select the ones to export:
          </p>
          {result.preview.tables.map((t, i) => (
            <label key={t.name} className={`block cursor-pointer overflow-hidden rounded-xl border transition ${selectedTables.has(i) ? "border-brand-500 ring-2 ring-brand-500/25" : "border-[var(--border)] opacity-70 hover:opacity-100"}`}>
              <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-500"
                  checked={selectedTables.has(i)}
                  onChange={(e) => {
                    const next = new Set(selectedTables);
                    e.target.checked ? next.add(i) : next.delete(i);
                    setSelectedTables(next);
                  }}
                />
                {t.name}
                <span className="ml-auto text-xs font-normal text-slate-400">{t.rows.length} preview rows</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <tbody>
                    {t.rows.map((row, r) => (
                      <tr key={r} className={r === 0 ? "bg-brand-500/10 font-semibold" : "border-t border-[var(--border)]"}>
                        {row.slice(0, 8).map((cell, c) => (
                          <td key={c} className="max-w-40 truncate px-3 py-1.5">{cell || "\u00A0"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </label>
          ))}
          <button onClick={exportSelectedTables} disabled={exporting || selectedTables.size === 0} className="btn-primary w-full sm:w-auto">
            {exporting ? "Exporting..." : `⬇ Export ${selectedTables.size} table${selectedTables.size !== 1 ? "s" : ""} as XLSX`}
          </button>
        </div>
      )}

      {result.preview?.type === "text" && (
        <div className="mt-6">
          <label htmlFor="ocr-text" className="mb-1.5 block text-sm font-bold">Recognized / extracted text (editable)</label>
          <textarea
            id="ocr-text"
            value={editedText ?? result.preview.text}
            onChange={(e) => setEditedText(e.target.value)}
            rows={12}
            className="input-p font-mono !text-xs leading-relaxed"
          />
          <button
            onClick={() => {
              const p = result.preview;
              if (p?.type !== "text") return;
              downloadBlob(
                new Blob([editedText ?? p.text], { type: "text/plain;charset=utf-8" }),
                result.outputs[0]?.name || "text.txt"
              );
            }}
            className="btn-primary mt-3"
          >
            ⬇ Download edited text
          </button>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {result.outputs.map((out) => (
          <li key={out.name} className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
            <span className="text-xl" aria-hidden>📄</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{out.name}</span>
              <span className="text-xs text-slate-400">{formatBytes(out.blob.size)}</span>
            </span>
            <button onClick={() => downloadBlob(out.blob, out.name)} className="btn-primary !py-2">
              ⬇ Download
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-slate-400">
        {toolName} · output size {formatBytes(totalOut)} · files stay on your device unless you save them.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={onReset} className="btn-ghost">↻ Convert another file</button>
      </div>
    </section>
  );
}

async function fetchAllTables(result: EngineResult) {
  const metaTables = (result.meta?.allTables as Array<{ name: string; rows: string[][] }> | undefined) || null;
  if (metaTables) return metaTables;
  const preview = result.preview?.type === "tables" ? result.preview.tables : [];
  return preview.map((t) => ({ name: t.name, rows: t.rows }));
}

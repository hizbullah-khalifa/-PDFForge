"use client";

import { useRef, useState } from "react";
import { formatBytes } from "@/lib/utils";
import type { ValidationIssue } from "@/lib/validators";

interface Props {
  accept: string[];
  multiple?: boolean;
  maxFiles?: number;
  files: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  onMove?: (index: number, dir: -1 | 1) => void;
  issues: ValidationIssue[];
  compact?: boolean;
}

function extIcon(name: string): string {
  if (/\.pdf$/i.test(name)) return "\u{1F4D5}";
  if (/\.docx$/i.test(name)) return "\u{1F4DD}";
  if (/\.pptx$/i.test(name)) return "\u{1F4CA}";
  if (/\.xlsx?$|\.csv$/i.test(name)) return "\u{1F4C8}";
  if (/\.(png|jpe?g)$/i.test(name)) return "\u{1F5BC}\uFE0F";
  if (/\.html?$/i.test(name)) return "\u{1F310}";
  if (/\.txt$/i.test(name)) return "\u{1F4DC}";
  return "\u{1F4C4}";
}

export function Dropzone({ accept, multiple, maxFiles = 20, files, onAdd, onRemove, onMove, issues, compact }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    onAdd(Array.from(e.dataTransfer.files));
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAdd(Array.from(e.target.files || []));
    e.target.value = "";
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="File upload area. Press Enter to browse files."
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`group relative cursor-pointer rounded-2xl border-2 border-dashed transition-all ${
          dragging
            ? "scale-[1.01] border-brand-500 bg-brand-500/10"
            : "border-[var(--border)] hover:border-brand-400 hover:bg-brand-500/5"
        } ${compact ? "px-6 py-8" : "px-6 py-14"}`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept.join(",")}
          multiple={multiple}
          onChange={handleSelect}
        />
        <div className="pointer-events-none flex flex-col items-center gap-3 text-center">
          <span
            className={`grid place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 text-white shadow-lg shadow-brand-500/30 transition-transform group-hover:scale-110 ${
              compact ? "h-12 w-12 text-2xl" : "h-16 w-16 text-3xl"
            }`}
          >
            ?
          </span>
          {!compact && (
            <p className="text-lg font-bold">{dragging ? "Release to upload" : "Drop your file here"}</p>
          )}
          {compact && <p className="font-bold">{dragging ? "Release to upload" : "Drop your file here"}</p>}
          <p className="text-sm text-slate-500 dark:text-slate-400">
            or{" "}
            <span className="font-semibold text-brand-500 underline underline-offset-4">Choose File</span>
            {multiple ? ` \u00B7 up to ${maxFiles} files` : ""}
          </p>
          {!compact && (
            <p className="mt-1 text-xs font-medium tracking-wide text-slate-400 dark:text-slate-500">
              {accept.length > 1 ? accept.map((a) => a.replace(".", "").toUpperCase()).join(" \u2022 ") : accept[0]?.replace(".", "").toUpperCase()}
            </p>
          )}
        </div>
      </div>

      {issues.length > 0 && (
        <ul className="mt-3 space-y-2" role="alert">
          {issues.map((issue, i) => (
            <li key={i} className="flex items-start gap-2 rounded-xl border border-red-300/50 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              <span aria-hidden>??</span>
              <span>
                <strong>{issue.file.name}:</strong> {issue.reason}
              </span>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
              {onMove && (
                <span className="flex flex-col">
                  <button
                    onClick={() => onMove(i, -1)}
                    disabled={i === 0}
                    className="px-1 text-xs text-slate-400 hover:text-brand-500 disabled:opacity-25"
                    aria-label={`Move ${f.name} up`}
                  >
                    ?
                  </button>
                  <button
                    onClick={() => onMove(i, 1)}
                    disabled={i === files.length - 1}
                    className="px-1 text-xs text-slate-400 hover:text-brand-500 disabled:opacity-25"
                    aria-label={`Move ${f.name} down`}
                  >
                    ?
                  </button>
                </span>
              )}
              <span className="text-xl" aria-hidden>{extIcon(f.name)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{f.name}</span>
                <span className="text-xs text-slate-400">{formatBytes(f.size)}</span>
              </span>
              <button
                onClick={() => onRemove(i)}
                className="rounded-lg px-2 py-1 text-sm font-bold text-slate-400 transition hover:bg-red-500/10 hover:text-red-500"
                aria-label={`Remove ${f.name}`}
              >
                ?
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

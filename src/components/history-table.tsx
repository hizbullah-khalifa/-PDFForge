"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  clearHistory,
  deleteHistory,
  getHistorySnapshot,
  loadBlobFromHistory,
  renameHistory,
  subscribeHistory,
  type HistoryEntry,
} from "@/lib/stores/history";
import { downloadBlob, formatBytes } from "@/lib/utils";

export function HistoryTable() {
  const entries = useSyncExternalStore(subscribeHistory, getHistorySnapshot, () => [] as HistoryEntry[]);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const grouped = useMemo(() => entries.slice(0, 100), [entries]);

  const share = async (e: HistoryEntry) => {
    const text = `${e.outName} — created with PDFForge ${e.tool} on ${new Date(e.date).toLocaleDateString()}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: e.outName, text });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied file summary to clipboard. Files stay private on your device — share the document itself through your own channel.");
    } catch {}
  };

  if (!entries.length) {
    return (
      <div className="card-p mx-auto max-w-lg p-10 text-center">
        <span className="text-5xl" aria-hidden>🗂️</span>
        <h2 className="mt-4 text-xl font-extrabold">No files yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Everything you process appears here — name, tool, date and status — stored only on this device.
        </p>
        <Link href="/tools" className="btn-primary mt-5">Browse tools</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {entries.length} record{entries.length !== 1 ? "s" : ""} · stored locally on this device
        </p>
        {confirmClear ? (
          <span className="flex items-center gap-2 text-sm">
            Delete everything?
            <button onClick={() => { clearHistory(); setConfirmClear(false); }} className="font-bold text-red-500 hover:underline">Yes</button>
            <button onClick={() => setConfirmClear(false)} className="text-slate-400 hover:underline">Cancel</button>
          </span>
        ) : (
          <button onClick={() => setConfirmClear(true)} className="text-sm font-semibold text-red-500 hover:underline">
            Delete All History
          </button>
        )}
      </div>

      <div className="card-p overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3 font-bold">File</th>
              <th className="px-4 py-3 font-bold">Tool</th>
              <th className="px-4 py-3 font-bold">Date</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((e) => (
              <tr key={e.id} className="border-b border-[var(--border)] last:border-0 hover:bg-brand-500/5">
                <td className="max-w-56 px-4 py-3">
                  <p className="truncate font-semibold" title={e.fileName}>{e.fileName}</p>
                  <p className="text-xs text-slate-400">→ {formatBytes(e.sizeOut)}</p>
                </td>
                <td className="px-4 py-3"><Link href={`/tools/${e.toolSlug}`} className="font-medium text-brand-500 hover:underline">{e.tool}</Link></td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                  {new Date(e.date).toLocaleDateString()}{" "}
                  <span className="text-xs text-slate-400">{new Date(e.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${e.status === "done" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-red-500/15 text-red-500"}`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <ActionButton label="Download" onClick={async () => {
                      const blob = await loadBlobFromHistory(e.id);
                      if (blob) downloadBlob(blob, e.outName);
                      else alert("This output is no longer cached on this device. Re-run the tool to regenerate it instantly.");
                    }} />
                    <ActionButton label="Rename" onClick={() => { setRenaming(e.id); setRenameValue(e.outName); }} />
                    <ActionButton label="Share" onClick={() => share(e)} />
                    <ActionButton label="Delete" danger onClick={() => deleteHistory(e.id)} />
                  </div>
                  {renaming === e.id && (
                    <form
                      onSubmit={(ev) => {
                        ev.preventDefault();
                        renameHistory(e.id, renameValue.trim() || e.outName);
                        setRenaming(null);
                      }}
                      className="mt-2 flex gap-1"
                    >
                      <input autoFocus className="input-p !py-1 !text-xs" value={renameValue} onChange={(ev) => setRenameValue(ev.target.value)} aria-label="New file name" />
                      <button type="submit" className="rounded-lg bg-brand-500 px-2.5 text-xs font-bold text-white">Save</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2 py-1 text-xs font-bold transition ${
        danger ? "text-red-400 hover:bg-red-500/10 hover:text-red-500" : "text-slate-400 hover:bg-brand-500/10 hover:text-brand-500"
      }`}
    >
      {label}
    </button>
  );
}

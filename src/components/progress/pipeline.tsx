"use client";

const STAGES = ["Uploading...", "Analyzing document...", "Processing pages...", "Generating output...", "Almost done..."];

function stageIndex(label: string): number {
  const l = label.toLowerCase();
  if (l.includes("upload")) return 0;
  if (l.includes("analyz") || l.includes("loading") || l.includes("verifying") || l.includes("reading") || l.includes("extract") || l.includes("detect")) return 1;
  if (l.includes("process") || l.includes("render") || l.includes("convert") || l.includes("encrypt") || l.includes("decrypt") || l.includes("rebuild") || l.includes("applying") || l.includes("scanning") || l.includes("recogniz") || l.includes("optimiz") || l.includes("re-encod") || l.includes("packag") || l.includes("add") || l.includes("merg")) return 2;
  if (l.includes("generat") || l.includes("building") || l.includes("writing")) return 3;
  if (l.includes("almost")) return 4;
  if (l.includes("ready")) return 5;
  return 2;
}

interface Props {
  stage: string;
  pct: number;
}

export function Pipeline({ stage, pct }: Props) {
  const active = stageIndex(stage);
  const done = active >= 5;

  return (
    <div aria-live="polite" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3">
          {!done ? (
            <span className="h-8 w-8 shrink-0 animate-spin rounded-full border-[3px] border-brand-500/25 border-t-brand-500" aria-hidden />
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-white" aria-hidden>✓</span>
          )}
          <div>
            <p className={`font-bold ${done ? "text-emerald-500" : ""}`}>{done ? "Your file is ready!" : stage}</p>
            <p className="text-xs text-slate-400">Processing locally on your device</p>
          </div>
          {!done && <span className="ml-auto text-sm font-bold text-brand-500">{Math.round(pct)}%</span>}
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/60" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-300"
            style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
          />
        </div>

        <ol className="mt-6 space-y-2.5">
          {STAGES.map((s, i) => {
            const state = done || i < active ? "done" : i === active ? "active" : "pending";
            return (
              <li key={s} className="flex items-center gap-2.5 text-sm">
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold transition ${
                    state === "done"
                      ? "bg-emerald-500 text-white"
                      : state === "active"
                      ? "bg-brand-500 text-white"
                      : "border border-[var(--border)] text-slate-400"
                  }`}
                  aria-hidden
                >
                  {state === "done" ? "✓" : i + 1}
                </span>
                <span className={`${state === "pending" ? "text-slate-400 dark:text-slate-600" : "font-medium"}`}>{s}</span>
                {state === "active" && !done && <span className="sr-only">(in progress)</span>}
              </li>
            );
          })}
          <li className="flex items-center gap-2.5 text-sm">
            <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${done ? "bg-emerald-500 text-white" : "border border-dashed border-[var(--border)] text-slate-400"}`} aria-hidden>
              ★
            </span>
            <span className={done ? "font-bold text-emerald-500" : "text-slate-400 dark:text-slate-600"}>Your file is ready!</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

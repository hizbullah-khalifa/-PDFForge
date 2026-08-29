"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ToolDef } from "@/lib/tools/types";
import type { EngineResult } from "@/lib/engines/base";
import { Dropzone } from "@/components/uploader/dropzone";
import { OptionsForm, defaultOptionValues } from "@/components/options/options-form";
import { Pipeline } from "@/components/progress/pipeline";
import { ResultPanel } from "@/components/result/result-panel";
import { validateFiles, friendlyEngineError, type ValidationIssue } from "@/lib/validators";
import { stageHandoff, consumeHandoff } from "@/lib/handoff";
import { addHistory, saveBlobForHistory } from "@/lib/stores/history";

type Status = "idle" | "running" | "done" | "error";

export function ToolWorkspace({ tool }: { tool: ToolDef }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [values, setValues] = useState<Record<string, any>>(() => defaultOptionValues(tool.options));
  const [status, setStatus] = useState<Status>("idle");
  const [stage, setStage] = useState({ label: "", pct: 0 });
  const [result, setResult] = useState<EngineResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const consumedRef = useRef(false);

  const isRedirectTool = tool.mode === "editor" || tool.mode === "signature" || tool.mode === "viewer";
  const minFiles = tool.minFiles ?? 1;
  const maxFiles = tool.maxFiles ?? (tool.multiple ? 20 : 1);

  useEffect(() => {
    if (consumedRef.current) return;
    consumedRef.current = true;
    const pending = consumeHandoff();
    if (pending.length) {
      setFiles(pending);
      setIssues([]);
    }
  }, []);

  const handleAdd = (incoming: File[]) => {
    const { accepted, issues: newIssues } = validateFiles(incoming, tool.accept, !!tool.multiple, files.length, maxFiles);
    if (accepted.length) setFiles((prev) => [...prev, ...accepted].slice(0, maxFiles));
    setIssues(newIssues);
    setStatus("idle");
    setResult(null);
  };

  const removeAt = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setResult(null);
    setStatus("idle");
  };

  const move = (i: number, dir: -1 | 1) => {
    setFiles((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const canRun =
    files.length >= minFiles &&
    !isRedirectTool &&
    status !== "running" &&
    (tool.engine !== "protect" || (String(values.password || "").length >= 4 && values.confirm === values.password));

  async function run() {
    if (!tool.engine) return;

    if (isRedirectTool) {
      stageHandoff(files);
      const preset = tool.editorPreset ? `?t=${tool.editorPreset}` : "";
      const target =
        tool.mode === "editor"
          ? `/tools/pdf-editor${preset}`
          : tool.mode === "signature"
          ? "/tools/sign-pdf"
          : "/tools/pdf-viewer";
      router.push(target);
      return;
    }

    setStatus("running");
    setResult(null);
    setStage({ label: "Uploading...", pct: 4 });

    try {
      const { ENGINES } = await import("@/lib/engines");
      const engine = ENGINES[tool.engine!];
      if (!engine) throw new Error("This tool is not available yet.");

      const pulse = setInterval(() => {
        setStage((s) => ({ ...s, pct: Math.min(s.pct + 2, 93) }));
      }, 900);

      try {
        const out = await engine(files, values, {
          report: (label, pct) =>
            setStage((s) => ({ label, pct: typeof pct === "number" ? pct : s.pct })),
        });

        clearInterval(pulse);
        setStage({ label: "Your file is ready!", pct: 100 });
        setResult(out);
        setStatus("done");

        const entry = addHistory({
          fileName: files.map((f) => f.name).join(", "),
          outName: out.outputs[0]?.name || "output",
          tool: tool.name,
          toolSlug: tool.slug,
          status: "done",
          sizeIn: files.reduce((s, f) => s + f.size, 0),
          sizeOut: out.outputs.reduce((s, o) => s + o.blob.size, 0),
        });
        if (out.outputs[0]) saveBlobForHistory(entry.id, out.outputs[0].blob).catch(() => {});
      } finally {
        clearInterval(pulse);
      }
    } catch (err) {
      setStatus("error");
      setStage({ label: err instanceof Error ? err.message : String(err), pct: 100 });
    }

    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }

  function reset() {
    setFiles([]);
    setIssues([]);
    setResult(null);
    setStatus("idle");
    setValues(defaultOptionValues(tool.options));
  }

  const formatsLine = useMemo(() => tool.accept.map((a) => a.replace(".", "").toUpperCase()).join(" \u00B7 "), [tool.accept]);

  return (
    <div className="space-y-6">
      <div className="card-p p-5 sm:p-7">
        {status !== "running" && (
          <>
            <Dropzone
              accept={tool.accept}
              multiple={tool.multiple || maxFiles > 1}
              maxFiles={maxFiles}
              files={files}
              onAdd={handleAdd}
              onRemove={removeAt}
              onMove={tool.multiple ? move : undefined}
              issues={issues}
            />
            <p className="mt-3 text-center text-xs text-slate-400">
              Supported: {formatsLine} · Max 150 MB per file · Processed privately in your browser
            </p>
          </>
        )}

        {status === "running" && (
          <div className="py-4">
            <Pipeline stage={stage.label} pct={stage.pct} />
            <p className="mt-4 text-center text-xs text-slate-400">Keep this tab open — large files take longer.</p>
          </div>
        )}
      </div>

      {status === "error" && (
        <div role="alert" className="rounded-2xl border border-red-300/60 bg-red-500/10 p-5">
          <p className="font-bold text-red-600 dark:text-red-400">Something went wrong</p>
          <p className="mt-1 text-sm text-red-500 dark:text-red-300">{friendlyEngineError(stage.label)}</p>
          <button onClick={() => setStatus("idle")} className="btn-ghost mt-3 !py-2">
            Try again
          </button>
        </div>
      )}

      {status === "done" && result && (
        <div ref={resultRef}>
          <ResultPanel toolName={tool.name} result={result} onReset={reset} />
        </div>
      )}

      {!isRedirectTool && tool.options && tool.options.some((o) => o.type !== "hidden") && status !== "running" && status !== "done" && (
        <div className="card-p p-5 sm:p-7">
          <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Settings</h2>
          <OptionsForm fields={tool.options} values={values} onChange={(k, v) => setValues((prev) => ({ ...prev, [k]: v }))} />
        </div>
      )}

      {!isRedirectTool && (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button onClick={run} disabled={!canRun} className="btn-primary btn w-full px-10 py-3.5 text-base disabled:from-slate-400 disabled:to-slate-400 disabled:shadow-none sm:w-auto">
            {isRedirectTool ? "Open Editor" : `${tool.name.replace(/ PDF$/, "")} — Free`}
          </button>
          {files.length > 0 && status !== "running" && (
            <button onClick={reset} className="btn-ghost w-full sm:w-auto">Clear files</button>
          )}
        </div>
      )}

      {isRedirectTool && files.length > 0 && (
        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            onClick={() => {
              stageHandoff(files);
              const preset = tool.editorPreset ? `?t=${tool.editorPreset}` : "";
              router.push(tool.mode === "signature" ? "/tools/sign-pdf" : `/tools/pdf-editor${preset}`);
            }}
            className="btn-primary w-full px-10 py-3.5 text-base sm:w-auto"
          >
            Continue to {tool.mode === "signature" ? "Signing Workspace" : "Editor"} →
          </button>
          <p className="text-xs text-slate-400">{files.length} file(s) ready for handoff</p>
        </div>
      )}
    </div>
  );
}

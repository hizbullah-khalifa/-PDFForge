"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dropzone } from "@/components/uploader/dropzone";
import { consumeHandoff } from "@/lib/handoff";
import { getPdfjs, type PdfDoc } from "@/lib/pdf/pdfjs";
import { downloadBlob } from "@/lib/utils";

type SigMode = "draw" | "type" | "upload";

export function SignWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [numPages, setNumPages] = useState(1);
  const [page, setPage] = useState(1);
  const [sigDataUrl, setSigDataUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<SigMode>("draw");
  const [typedName, setTypedName] = useState("");
  const [pos, setPos] = useState({ xr: 0.58, yr: 0.8 });
  const [widthRatio, setWidthRatio] = useState(0.25);
  const [opacity, setOpacity] = useState(1);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pending = consumeHandoff();
    if (pending.length) load(pending[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("pf-signature");
    if (stored) {
      setSigDataUrl(stored);
      setMode("draw");
    }
  }, []);

  const load = async (f: File) => {
    setError("");
    try {
      const pdfjs = await getPdfjs();
      const bytes = new Uint8Array(await f.arrayBuffer());
      const d = await pdfjs.getDocument({ data: bytes.slice(0), isEvalSupported: false }).promise;
      setFile(f);
      setDoc(d);
      setNumPages(d.numPages);
      setPage(1);
    } catch {
      setError("This file appears to be corrupted or is password protected.");
    }
  };

  const renderBase = useCallback(async () => {
    if (!doc || !baseCanvasRef.current) return;
    try {
      const p = await doc.getPage(page);
      const vp = p.getViewport({ scale: 1.5 });
      const canvas = baseCanvasRef.current;
      canvas.width = vp.width;
      canvas.height = vp.height;
      await p.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
    } catch {}
  }, [doc, page]);

  useEffect(() => {
    renderBase();
  }, [renderBase]);

  const saveSignature = (dataUrl: string) => {
    setSigDataUrl(dataUrl);
    localStorage.setItem("pf-signature", dataUrl);
  };

  const makeTypedSignature = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 300;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "italic 130px 'Segoe Script', 'Brush Script MT', cursive";
    ctx.fillStyle = "#111827";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName.trim(), canvas.width / 2, canvas.height / 2 + 10);
    saveSignature(canvas.toDataURL("image/png"));
  };

  const applySignature = async () => {
    if (!file || !sigDataUrl) return;
    setApplying(true);
    setError("");
    try {
      const { flattenSignatureEngine } = await import("@/lib/engines/annotate");
      const result = await flattenSignatureEngine(
        [file],
        { signatureDataUrl: sigDataUrl, page, widthRatio, xRatio: pos.xr, yRatio: pos.yr - widthRatio * 0.18, opacity },
        { report: () => {} }
      );
      downloadBlob(result.outputs[0].blob, result.outputs[0].name);
      const { addHistory, saveBlobForHistory } = await import("@/lib/stores/history");
      const entry = addHistory({
        fileName: file.name,
        outName: result.outputs[0].name,
        tool: "Add Signature",
        toolSlug: "sign-pdf",
        status: "done",
        sizeIn: file.size,
        sizeOut: result.outputs[0].blob.size,
      });
      saveBlobForHistory(entry.id, result.outputs[0].blob).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not apply the signature.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-4">
        {!file && (
          <div className="card-p p-5">
            <Dropzone accept={[".pdf"]} files={[]} onAdd={(fs) => fs[0] && load(fs[0])} onRemove={() => {}} issues={[]} />
          </div>
        )}

        <div className="card-p p-5">
          <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-slate-400">1 · Create signature</h3>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {(["draw", "type", "upload"] as SigMode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`rounded-xl border px-2 py-2 text-xs font-bold capitalize transition ${mode === m ? "border-brand-500 bg-brand-500/10 text-brand-500" : "border-[var(--border)]"}`}>
                {m}
              </button>
            ))}
          </div>

          {mode === "type" && (
            <div className="space-y-2">
              <input
                className="input-p"
                placeholder="Type your full name"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                aria-label="Type your name"
              />
              <button onClick={makeTypedSignature} disabled={!typedName.trim()} className="btn-primary w-full !py-2 text-sm">
                Create typed signature
              </button>
            </div>
          )}

          {mode === "upload" && (
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="input-p file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500/15 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-brand-500"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = () => saveSignature(r.result as string);
                r.readAsDataURL(f);
              }}
              aria-label="Upload signature image"
            />
          )}

          {mode === "draw" && (
            <DrawPad onSave={saveSignature} />
          )}

          {sigDataUrl && (
            <div className="mt-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Your signature</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sigDataUrl} alt="Your signature" className="mx-auto max-h-16 rounded bg-white p-1" />
              <p className="mt-2 text-center text-[11px] text-slate-400">Saved for next time on this device</p>
            </div>
          )}
        </div>

        {file && (
          <div className="card-p p-5">
            <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-slate-400">2 · Place &amp; style</h3>
            <label className="mb-3 block text-xs font-semibold text-slate-500 dark:text-slate-400">
              Page
              <select className="input-p mt-1" value={page} onChange={(e) => setPage(+e.target.value)}>
                {Array.from({ length: numPages }, (_, i) => (
                  <option key={i} value={i + 1}>Page {i + 1}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
              Size ({Math.round(widthRatio * 100)}% of page width)
              <input type="range" min={0.12} max={0.5} step={0.01} value={widthRatio} onChange={(e) => setWidthRatio(+e.target.value)} className="mt-1 w-full accent-brand-500" />
            </label>
            <label className="mt-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
              Opacity ({Math.round(opacity * 100)}%)
              <input type="range" min={0.3} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(+e.target.value)} className="mt-1 w-full accent-brand-500" />
            </label>
          </div>
        )}
      </div>

      <div>
        {!file ? (
          <div className="grid h-full min-h-72 place-items-center rounded-2xl border border-dashed border-[var(--border)] text-center text-sm text-slate-400">
            Upload a PDF to start signing.
            <br />
            You can also send one from any tool page.
          </div>
        ) : (
          <>
            <div ref={previewRef} className="card-p relative mx-auto w-fit overflow-auto p-3" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setPos({
                xr: Math.min(0.95, Math.max(0, ((e.clientX - rect.left) / rect.width) * 1.08)),
                yr: Math.min(0.98, Math.max(0.02, ((e.clientY - rect.top) / rect.height) * 1.06)),
              });
            }}>
              <canvas ref={baseCanvasRef} className="max-w-full rounded bg-white shadow-lift" />
              {sigDataUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={sigDataUrl}
                  alt="Signature placement preview"
                  className="pointer-events-none absolute"
                  style={{
                    left: `${pos.xr * 100}%`,
                    top: `${pos.yr * 100}%`,
                    width: `${widthRatio * 100}%`,
                    opacity,
                  }}
                />
              )}
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">Click anywhere on the page to move your signature.</p>
            <div className="mt-4 flex justify-center gap-3">
              <button onClick={applySignature} disabled={!sigDataUrl || applying} className="btn-primary px-8">
                {applying ? "Applying…" : "✓ Apply Signature"}
              </button>
              {applying && <span className="sr-only">Processing</span>}
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-300/60 bg-red-500/10 px-4 py-3 text-center text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}

function DrawPad({ onSave }: { onSave: (dataUrl: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const pos = (e: React.PointerEvent): [number, number] => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return [(e.clientX - r.left) * (c.width / r.width), (e.clientY - r.top) * (c.height / r.height)];
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={(c) => {
          if (c && !c.dataset.init) {
            c.dataset.init = "1";
            c.width = 800;
            c.height = 280;
            const ctx = c.getContext("2d")!;
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, c.width, c.height);
          }
          (ref as any).current = c;
        }}
        className="w-full touch-none rounded-xl border-2 border-dashed border-[var(--border)] bg-white"
        style={{ aspectRatio: "800/280", cursor: "crosshair" }}
        aria-label="Signature drawing area"
        onPointerDown={(e) => {
          drawing.current = true;
          const ctx = ref.current!.getContext("2d")!;
          const [x, y] = pos(e);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.strokeStyle = "#111827";
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = ref.current!.getContext("2d")!;
          const [x, y] = pos(e);
          ctx.lineTo(x, y);
          ctx.stroke();
        }}
        onPointerUp={() => (drawing.current = false)}
        onPointerLeave={() => (drawing.current = false)}
      />
      <div className="flex gap-2">
        <button
          onClick={() => {
            const c = ref.current!;
            const ctx = c.getContext("2d")!;
            ctx.clearRect(0, 0, c.width, c.height);
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, c.width, c.height);
          }}
          className="btn-ghost flex-1 !py-2 text-sm"
        >
          Clear
        </button>
        <button onClick={() => onSave(ref.current!.toDataURL("image/png"))} className="btn-primary flex-1 !py-2 text-sm">
          Save signature
        </button>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { rgb, LineCapStyle } from "@cantoo/pdf-lib";
import type { PdfDoc } from "@/lib/pdf/pdfjs";
import { getPdfjs } from "@/lib/pdf/pdfjs";
import { Dropzone } from "@/components/uploader/dropzone";
import { consumeHandoff } from "@/lib/handoff";
import { readFileBuffer } from "@/lib/utils";

type ToolId = "select" | "text" | "pen" | "highlight" | "rect" | "ellipse" | "image" | "signature" | "eraser";

interface BaseAnno {
  id: string;
  page: number;
  color: string;
}
interface TextAnno extends BaseAnno { type: "text"; x: number; y: number; text: string; size: number }
interface PenAnno extends BaseAnno { type: "pen"; points: Array<[number, number]>; width: number }
interface RectAnno extends BaseAnno { type: "rect" | "highlight" | "ellipse"; x1: number; y1: number; x2: number; y2: number }
interface ImageAnno extends BaseAnno { type: "image"; x: number; y: number; w: number; h: number; src: string }

type Anno = TextAnno | PenAnno | RectAnno | ImageAnno;

const TOOLS: Array<{ id: ToolId; icon: string; label: string }> = [
  { id: "select", icon: "↖", label: "Select" },
  { id: "text", icon: "T", label: "Text" },
  { id: "pen", icon: "✏️", label: "Draw" },
  { id: "highlight", icon: "🖍️", label: "Highlight" },
  { id: "rect", icon: "▭", label: "Rectangle" },
  { id: "ellipse", icon: "◯", label: "Circle" },
  { id: "image", icon: "🖼️", label: "Image" },
  { id: "signature", icon: "🖋️", label: "Signature" },
  { id: "eraser", icon: "🧽", label: "Eraser" },
];

const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#6366f1", "#111827"];

export function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [tool, setTool] = useState<ToolId>("select");
  const [color, setColor] = useState("#ef4444");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(16);
  const [annotations, setAnnotations] = useState<Anno[]>([]);
  const [redoStack, setRedoStack] = useState<Anno[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ x: number; y: number; dx: number; dy: number; value: string } | null>(null);
  const imgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<Anno | null>(null);
  const drawingRef = useRef(false);
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const undoStackRef = useRef<Anno[][]>([]);

  useEffect(() => {
    const pending = consumeHandoff();
    if (pending.length) load(pending[0]);
    const params = new URLSearchParams(window.location.search);
    const t = params.get("t");
    if (t && ["text", "pen", "highlight", "shape", "image"].includes(t)) {
      setTool(t === "shape" ? "rect" : (t as ToolId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setAnnotations([]);
      undoStackRef.current = [];
      setRedoStack([]);
    } catch {
      setError("This file appears to be corrupted or is password protected. Please try another PDF.");
    }
  };

  const renderPage = useCallback(async () => {
    if (!doc || !canvasRef.current) return;
    try {
      const p = await doc.getPage(page);
      const viewport = p.getViewport({ scale: 1.6 });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await p.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
    } catch {}
  }, [doc, page]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  const pushUndo = useCallback(() => {
    undoStackRef.current.push([...annotations]);
    if (undoStackRef.current.length > 60) undoStackRef.current.shift();
    setRedoStack([]);
  }, [annotations]);

  const undo = () => {
    const prev = undoStackRef.current.pop();
    if (!prev) return;
    setRedoStack((r) => [...r, [...annotations]]);
    setAnnotations(prev);
  };

  const redo = () => {
    const next = redoStack[redoStack.length - 1];
    if (!next) return;
    setRedoStack((r) => r.slice(0, -1));
    undoStackRef.current.push([...annotations]);
    setAnnotations(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/input|textarea/i.test((e.target as HTMLElement).tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "Delete" && selectedId) {
        pushUndo();
        setAnnotations((a) => a.filter((x) => x.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const localPos = (e: React.PointerEvent): [number, number] => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [(e.clientX - rect.left) * (canvasRef.current!.width / rect.width), (e.clientY - rect.top) * (canvasRef.current!.height / rect.height)];
  };

  const hitTest = (x: number, y: number): Anno | null => {
    for (let i = annotations.length - 1; i >= 0; i--) {
      const a = annotations[i];
      if (a.page !== page) continue;
      if (a.type === "text" && Math.abs(x - a.x) < a.text.length * a.size * 0.4 + 20 && Math.abs(y - a.y - a.size) < a.size * 1.5) return a;
      if (a.type === "pen") {
        if (a.points.some(([px, py]) => Math.abs(px - x) < 14 && Math.abs(py - y) < 14)) return a;
      }
      if (a.type === "rect" || a.type === "highlight" || a.type === "ellipse") {
        const [x1, x2] = [Math.min(a.x1, a.x2), Math.max(a.x1, a.x2)];
        const [y1, y2] = [Math.min(a.y1, a.y2), Math.max(a.y1, a.y2)];
        if (x >= x1 - 6 && x <= x2 + 6 && y >= y1 - 6 && y <= y2 + 6) return a;
      }
      if (a.type === "image" && x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) return a;
    }
    return null;
  };

  const onPointerDown = async (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const [x, y] = localPos(e);
    const id = () => Math.random().toString(36).slice(2);

    if (tool === "select") {
      const hit = hitTest(x, y);
      setSelectedId(hit?.id ?? null);
      if (hit) {
        pushUndo();
        let ox = 0;
        let oy = 0;
        if (hit.type === "text") { ox = x - hit.x; oy = y - hit.y; }
        else if (hit.type === "image") { ox = x - hit.x; oy = y - hit.y; }
        else if (hit.type === "pen") { ox = x - hit.points[0][0]; oy = y - hit.points[0][1]; }
        else { ox = x - hit.x1; oy = y - hit.y1; }
        dragRef.current = { id: hit.id, ox, oy };
      }
      return;
    }

    if (tool === "eraser") {
      const hit = hitTest(x, y);
      if (hit) {
        pushUndo();
        setAnnotations((a) => a.filter((n) => n.id !== hit.id));
      }
      return;
    }

    if (tool === "text") {
      const rect = canvasRef.current.getBoundingClientRect();
      setEditing({ x, y, dx: (e.clientX - rect.left) - 4, dy: (e.clientY - rect.top) - 4, value: "" });
      return;
    }

    if (tool === "image") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/png,image/jpeg";
      input.onchange = async () => {
        const imgFile = input.files?.[0];
        if (!imgFile) return;
        const dataUrl = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.readAsDataURL(imgFile);
        });
        pushUndo();
        setAnnotations((a) => [
          ...a,
          { id: id(), page, type: "image", src: dataUrl, x: x - 80, y: y - 60, w: 160, h: 120, color },
        ]);
      };
      input.click();
      return;
    }

    if (tool === "signature") {
      const sig = await openSignaturePad();
      if (!sig) return;
      pushUndo();
      const img = new Image();
      img.src = sig;
      await new Promise((r) => (img.onload = r));
      const w = Math.min(220, canvasRef.current.width / 3);
      setAnnotations((a) => [...a, { id: id(), page, type: "image", src: sig, x: x - w / 2, y: y - 40, w, h: (w * img.height) / img.width, color }]);
      return;
    }

    drawingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (tool === "pen") {
      draftRef.current = { id: id(), page, type: "pen", points: [[x, y]], color, width: strokeWidth };
    } else {
      draftRef.current = { id: id(), page, type: tool === "highlight" ? "highlight" : tool, x1: x, y1: y, x2: x, y2: y, color: tool === "highlight" ? "#fde047" : color };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const [x, y] = localPos(e);

    if (dragRef.current) {
      const { id, ox, oy } = dragRef.current;
      setAnnotations((annos) =>
        annos.map((a) => {
          if (a.id !== id) return a;
          if (a.type === "text") return { ...a, x: x - ox, y: y - oy };
          if (a.type === "image") return { ...a, x: x - ox, y: y - oy };
          if (a.type === "pen") {
            const dx = x - ox - a.points[0][0];
            const dy = y - oy - a.points[0][1];
            return { ...a, points: a.points.map(([px, py]) => [px + dx, py + dy]) as Array<[number, number]> };
          }
          const dx = x - ox - a.x1;
          const dy = y - oy - a.y1;
          return { ...a, x1: a.x1 + dx, y1: a.y1 + dy, x2: a.x2 + dx, y2: a.y2 + dy };
        })
      );
      return;
    }

    if (!drawingRef.current || !draftRef.current) return;
    const d = draftRef.current;
    if (d.type === "pen") {
      d.points.push([x, y]);
    } else if (d.type === "rect" || d.type === "highlight" || d.type === "ellipse") {
      d.x2 = x;
      d.y2 = y;
    }
    drawDraft();
  };

  const onPointerUp = () => {
    dragRef.current = null;
    if (!drawingRef.current || !draftRef.current) return;
    const d = draftRef.current;
    drawingRef.current = false;
    draftRef.current = null;

    const tiny =
      d.type === "pen"
        ? d.points.length < 2
        : d.type === "rect" || d.type === "highlight" || d.type === "ellipse"
        ? Math.abs(d.x2 - d.x1) < 4 && Math.abs(d.y2 - d.y1) < 4
        : false;
    if (tiny) return;

    pushUndo();
    setAnnotations((a) => [...a, d]);
  };

  const [sigPadOpen, setSigPadOpen] = useState(false);

  const openSignaturePad = (): Promise<string | null> =>
    new Promise((resolve) => {
      sigResolveRef.current = resolve;
      setSigPadOpen(true);
    });
  const sigResolveRef = useRef<((v: string | null) => void) | null>(null);

  const drawDraft = () => {
    setRenderTick((t) => t + 1);
  };
  const [renderTick, setRenderTick] = useState(0);

  const commitEditing = () => {
    if (!editing) return;
    const text = editing.value.trim();
    setEditing(null);
    if (!text) return;
    pushUndo();
    setAnnotations((a) => [
      ...a,
      { id: Math.random().toString(36).slice(2), page, type: "text", x: editing.x, y: editing.y, text, size: fontSize * 1.6, color },
    ]);
  };

  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    const base = canvasRef.current;
    if (!canvas || !base) return;
    canvas.width = base.width;
    canvas.height = base.height;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const all = [...annotations.filter((a) => a.page === page), ...(draftRef.current && draftRef.current.page === page ? [draftRef.current] : [])];
    for (const a of all) {
      ctx.save();
      const selected = a.id === selectedId && tool === "select";
      if (selected) {
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(boundsOf(a).x - 6, boundsOf(a).y - 6, boundsOf(a).w + 12, boundsOf(a).h + 12);
        ctx.setLineDash([]);
      }
      if (a.type === "pen") {
        ctx.strokeStyle = a.color;
        ctx.lineWidth = a.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        a.points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        ctx.stroke();
      } else if (a.type === "highlight") {
        ctx.fillStyle = "rgba(253, 224, 71, 0.45)";
        ctx.fillRect(Math.min(a.x1, a.x2), Math.min(a.y1, a.y2), Math.abs(a.x2 - a.x1), Math.abs(a.y2 - a.y1));
      } else if (a.type === "rect") {
        ctx.strokeStyle = a.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(Math.min(a.x1, a.x2), Math.min(a.y1, a.y2), Math.abs(a.x2 - a.x1), Math.abs(a.y2 - a.y1));
      } else if (a.type === "ellipse") {
        ctx.strokeStyle = a.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(
          (a.x1 + a.x2) / 2,
          (a.y1 + a.y2) / 2,
          Math.abs(a.x2 - a.x1) / 2,
          Math.abs(a.y2 - a.y1) / 2,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      } else if (a.type === "image") {
        const img = imgCache.get(a.src);
        if (img?.complete) ctx.drawImage(img, a.x, a.y, a.w, a.h);
        else {
          const im = new Image();
          im.onload = () => {
            imgCache.set(a.src, im);
            setRenderTick((t) => t + 1);
          };
          im.src = a.src;
        }
      } else if (a.type === "text") {
        ctx.fillStyle = a.color;
        ctx.font = `${a.size}px Helvetica, Arial, sans-serif`;
        ctx.textBaseline = "top";
        a.text.split("\n").forEach((line, i) => ctx.fillText(line, a.x, a.y + i * a.size * 1.2));
      }
      ctx.restore();
    }
  }, [annotations, page, renderTick, selectedId, tool]);

  const imgCache = imgCacheRef.current;

  function boundsOf(a: Anno): { x: number; y: number; w: number; h: number } {
    if (a.type === "text") return { x: a.x, y: a.y, w: a.text.length * a.size * 0.55, h: a.size * 1.3 };
    if (a.type === "image") return { x: a.x, y: a.y, w: a.w, h: a.h };
    if (a.type === "pen") {
      const xs = a.points.map((p) => p[0]);
      const ys = a.points.map((p) => p[1]);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    }
    return { x: Math.min(a.x1, a.x2), y: Math.min(a.y1, a.y2), w: Math.abs(a.x2 - a.x1), h: Math.abs(a.y2 - a.y1) };
  }

  const exportPdf = async () => {
    if (!file || !doc) return;
    setExporting(true);
    setError("");
    try {
      const { PDFDocument, StandardFonts } = await import("@cantoo/pdf-lib");
      const bytes = await readFileBuffer(file);
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();

      for (let i = 0; i < pages.length; i++) {
        const annos = annotations.filter((a) => a.page === i + 1);
        if (!annos.length) continue;
        const p = await doc.getPage(i + 1);
        const vp = p.getViewport({ scale: 1 });
        const kx = pages[i].getWidth() / vp.width;
        const ky = pages[i].getHeight() / vp.height;
        const ph = pages[i].getHeight();

        for (const a of annos) {
          if (a.type === "pen") {
            for (let j = 1; j < a.points.length; j++) {
              const [x1, y1] = a.points[j - 1];
              const [x2, y2] = a.points[j];
              pages[i].drawLine({
                start: { x: x1 * kx, y: ph - y1 * ky },
                end: { x: x2 * kx, y: ph - y2 * ky },
                thickness: Math.max(0.5, a.width * ((kx + ky) / 2)),
                color: hexToRgb(a.color),
                lineCap: LineCapStyle.Round,
              });
            }
          } else if (a.type === "highlight") {
            pages[i].drawRectangle({
              x: Math.min(a.x1, a.x2) * kx,
              y: ph - Math.max(a.y1, a.y2) * ky,
              width: Math.abs(a.x2 - a.x1) * kx,
              height: Math.abs(a.y2 - a.y1) * ky,
              color: rgb(0.99, 0.88, 0.28),
              opacity: 0.45,
            });
          } else if (a.type === "rect") {
            pages[i].drawRectangle({
              x: Math.min(a.x1, a.x2) * kx,
              y: ph - Math.max(a.y1, a.y2) * ky,
              width: Math.abs(a.x2 - a.x1) * kx,
              height: Math.abs(a.y2 - a.y1) * ky,
              borderColor: hexToRgb(a.color),
              borderWidth: 2.5 * kx,
            });
          } else if (a.type === "ellipse") {
            pages[i].drawEllipse({
              x: ((a.x1 + a.x2) / 2) * kx,
              y: ph - ((a.y1 + a.y2) / 2) * ky,
              xScale: (Math.abs(a.x2 - a.x1) / 2) * kx,
              yScale: (Math.abs(a.y2 - a.y1) / 2) * ky,
              borderColor: hexToRgb(a.color),
              borderWidth: 2.5 * kx,
            });
          } else if (a.type === "text") {
            let ty = ph - (a.y + a.size) * ky;
            for (const line of a.text.split("\n")) {
              pages[i].drawText(line, {
                x: a.x * kx,
                y: ty,
                size: a.size * ky,
                font,
                color: hexToRgb(a.color),
              });
              ty -= a.size * ky * 1.2;
            }
          } else if (a.type === "image") {
            const res = await fetch(a.src);
            const buf = new Uint8Array(await res.arrayBuffer());
            const isPng = a.src.includes("image/png");
            const img = isPng ? await pdf.embedPng(buf) : await pdf.embedJpg(buf);
            pages[i].drawImage(img, {
              x: a.x * kx,
              y: ph - (a.y + a.h) * ky,
              width: a.w * kx,
              height: a.h * ky,
            });
          }
        }
      }

      const outBytes = await pdf.save({ useObjectStreams: true });
      const blob = new Blob([outBytes as unknown as BlobPart], { type: "application/pdf" });
      const name = file.name.replace(/\.pdf$/i, "") + "-edited.pdf";
      const { downloadBlob } = await import("@/lib/utils");
      downloadBlob(blob, name);
      const { addHistory, saveBlobForHistory } = await import("@/lib/stores/history");
      const entry = addHistory({
        fileName: file.name,
        outName: name,
        tool: "Edit PDF",
        toolSlug: "pdf-editor",
        status: "done",
        sizeIn: file.size,
        sizeOut: blob.size,
      });
      saveBlobForHistory(entry.id, blob).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  function hexToRgb(hex: string) {
    const v = parseInt(hex.slice(1), 16);
    return rgb(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255);
  }

  if (!file || !doc) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card-p p-6">
          <Dropzone accept={[".pdf"]} files={[]} onAdd={(fs) => fs[0] && load(fs[0])} onRemove={() => {}} issues={[]} />
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-300/60 bg-red-500/10 px-4 py-3 text-center text-sm text-red-500">{error}</p>}
        {sigPadOpen && (
          <SigPadModal
            onClose={(dataUrl) => {
              setSigPadOpen(false);
              sigResolveRef.current?.(dataUrl ?? null);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card-p flex flex-wrap items-center gap-1.5 p-3">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTool(t.id); setSelectedId(null); }}
            title={t.label}
            aria-label={t.label}
            aria-pressed={tool === t.id}
            className={`grid h-10 w-10 place-items-center rounded-xl border text-base transition ${
              tool === t.id ? "border-brand-500 bg-brand-500/15 text-brand-600 dark:text-brand-300" : "border-transparent hover:bg-brand-500/10"
            }`}
          >
            {t.icon}
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-[var(--border)]" aria-hidden />
        <button onClick={undo} title="Undo (Ctrl+Z)" aria-label="Undo" className="icon-btn-e">↩</button>
        <button onClick={redo} title="Redo (Ctrl+Y)" aria-label="Redo" className="icon-btn-e">↪</button>
        <span className="mx-1 h-6 w-px bg-[var(--border)]" aria-hidden />
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            aria-label={`Color ${c}`}
            className={`h-7 w-7 rounded-full border-2 transition ${color === c ? "scale-110 border-brand-500" : "border-white shadow"} `}
            style={{ background: c }}
          />
        ))}
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-7 w-8 cursor-pointer rounded border border-[var(--border)] bg-[var(--card)]" aria-label="Custom color" />
        {(tool === "pen" || tool === "select" || tool === "eraser") && (
          <>
            <label className="ml-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
              Width
              <input type="range" min={1} max={14} value={strokeWidth} onChange={(e) => setStrokeWidth(+e.target.value)} className="w-20 accent-brand-500" aria-label="Stroke width" />
            </label>
          </>
        )}
        {tool === "text" && (
          <label className="ml-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
            Size
            <input type="range" min={10} max={42} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} className="w-20 accent-brand-500" aria-label="Font size" />
          </label>
        )}
        <button onClick={exportPdf} disabled={exporting} className="btn-primary ml-auto !py-2 text-sm">
          {exporting ? "Flattening…" : "⬇ Export PDF"}
        </button>
      </div>

      <style jsx global>{`
        .icon-btn-e {
          display: grid;
          place-items: center;
          height: 38px;
          min-width: 38px;
          border-radius: 10px;
          font-size: 15px;
          transition: background 0.15s ease;
        }
        .icon-btn-e:hover {
          background: rgba(99, 102, 241, 0.12);
        }
      `}</style>

      <div className="card-p relative mx-auto w-fit overflow-auto p-4">
        <div className="relative w-fit">
          <canvas ref={canvasRef} className="rounded-md bg-white shadow-lift" />
          <canvas
            ref={overlayCanvasRef}
            className="absolute left-0 top-0 touch-none rounded-md"
            style={{ cursor: tool === "select" ? "default" : "crosshair" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />
          {editing && (
            <textarea
              autoFocus
              value={editing.value}
              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
              onBlur={commitEditing}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  commitEditing();
                }
                if (e.key === "Escape") setEditing(null);
              }}
              placeholder="Type…"
              className="absolute z-10 min-w-40 resize rounded border-2 border-brand-500 bg-white/95 p-1 text-sm outline-none"
              style={{ left: editing.dx, top: editing.dy }}
            />
          )}
        </div>
        {selectedId && tool === "select" && (
          <p className="mt-3 text-center text-xs text-slate-400">
            Drag to move · press Delete to remove · Eraser also removes strokes
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 pb-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost !py-1.5">‹ Prev</button>
        <span className="text-sm font-bold">
          Page {page} / {numPages}
        </span>
        <button onClick={() => setPage((p) => Math.min(numPages, p + 1))} disabled={page >= numPages} className="btn-ghost !py-1.5">Next ›</button>
        {annotations.length > 0 && (
          <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-500">{annotations.length} edits</span>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-300/60 bg-red-500/10 px-4 py-3 text-center text-sm text-red-500">{error}</p>
      )}

      {sigPadOpen && (
        <SigPadModal
          onClose={(dataUrl) => {
            setSigPadOpen(false);
            sigResolveRef.current?.(dataUrl ?? null);
          }}
        />
      )}
    </div>
  );
}

function SigPadModal({ onClose }: { onClose: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  const pos = (e: React.PointerEvent): [number, number] => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [(e.clientX - r.left) * (canvasRef.current!.width / r.width), (e.clientY - r.top) * (canvasRef.current!.height / r.height)];
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Signature pad">
      <div className="card-p w-full max-w-lg animate-fadeUp p-5">
        <h3 className="mb-3 font-extrabold">Draw your signature</h3>
        <canvas
          ref={(c) => {
            if (c && !c.dataset.init) {
              c.dataset.init = "1";
              c.width = 700;
              c.height = 260;
              const ctx = c.getContext("2d")!;
              ctx.fillStyle = "#fff";
              ctx.fillRect(0, 0, c.width, c.height);
            }
            (canvasRef as any).current = c;
          }}
          className="w-full touch-none rounded-xl border-2 border-dashed border-[var(--border)] bg-white"
          style={{ aspectRatio: "700/260", cursor: "crosshair" }}
          onPointerDown={(e) => {
            drawing.current = true;
            setEmpty(false);
            const ctx = canvasRef.current!.getContext("2d")!;
            const [x, y] = pos(e);
            ctx.beginPath();
            ctx.strokeStyle = "#111827";
            ctx.lineWidth = 3.5;
            ctx.lineCap = "round";
            ctx.moveTo(x, y);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = canvasRef.current!.getContext("2d")!;
            const [x, y] = pos(e);
            ctx.lineTo(x, y);
            ctx.stroke();
          }}
          onPointerUp={() => (drawing.current = false)}
          onPointerLeave={() => (drawing.current = false)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => onClose(null)} className="btn-ghost">Cancel</button>
          <button
            onClick={() => {
              const c = canvasRef.current!;
              c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
              const ctx = c.getContext("2d")!;
              ctx.fillStyle = "#fff";
              ctx.fillRect(0, 0, c.width, c.height);
              setEmpty(true);
            }}
            className="btn-ghost"
          >
            Clear
          </button>
          <button onClick={() => onClose(empty ? null : canvasRef.current!.toDataURL("image/png"))} disabled={empty} className="btn-primary">
            Use Signature
          </button>
        </div>
      </div>
    </div>
  );
}

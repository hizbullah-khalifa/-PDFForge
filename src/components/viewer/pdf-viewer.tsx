"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dropzone } from "@/components/uploader/dropzone";
import { consumeHandoff } from "@/lib/handoff";
import { getPdfjs, type PdfDoc } from "@/lib/pdf/pdfjs";
import { downloadBlob } from "@/lib/utils";

interface SearchResult {
  page: number;
  snippet: string;
}

export function PdfViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.4);
  const [rotation, setRotation] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const textCacheRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    const pending = consumeHandoff();
    if (pending.length) load(pending[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async (f: File) => {
    setLoading(true);
    setError("");
    try {
      const pdfjs = await getPdfjs();
      const bytes = new Uint8Array(await f.arrayBuffer());
      const d = await pdfjs.getDocument({ data: bytes.slice(0), isEvalSupported: false }).promise;
      setFile(f);
      setDoc(d);
      setNumPages(d.numPages);
      setPage(1);
      setRotation(0);
      setResults([]);
      textCacheRef.current.clear();
    } catch (err) {
      setError(
        /password/i.test(String(err))
          ? "This PDF is password protected. Unlock it first with the Unlock PDF tool."
          : "This file appears to be corrupted. Please upload another PDF."
      );
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const render = useCallback(async () => {
    if (!doc || !canvasRef.current) return;
    renderTaskRef.current?.cancel();
    try {
      const p = await doc.getPage(page);
      const viewport = p.getViewport({ scale, rotation });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d")!;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const task = p.render({ canvasContext: ctx, viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined });
      renderTaskRef.current = task;
      await task.promise;
    } catch {
      /* render cancelled */
    }
  }, [doc, page, scale, rotation]);

  useEffect(() => {
    render();
  }, [render]);

  const doSearch = useCallback(async () => {
    if (!doc || !search.trim()) {
      setResults([]);
      return;
    }
    const needle = search.toLowerCase();
    const found: SearchResult[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      let text = textCacheRef.current.get(i);
      if (text === undefined) {
        const p = await doc.getPage(i);
        const tc = await p.getTextContent();
        const joined: string = tc.items.map((it: any) => String(it?.str ?? "")).join(" ");
        text = joined;
        textCacheRef.current.set(i, joined);
      }
      const lower = (text || "").toLowerCase();
      let idx = lower.indexOf(needle);
      while (idx >= 0 && found.length < 50) {
        found.push({
          page: i,
          snippet: "…" + (text || "").slice(Math.max(0, idx - 30), idx + needle.length + 40).trim() + "…",
        });
        idx = lower.indexOf(needle, idx + needle.length);
      }
    }
    setResults(found);
  }, [doc, search]);

  const printPdf = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    };
    document.body.appendChild(iframe);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current?.requestFullscreen?.();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!doc) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        document.getElementById("pf-search")?.focus();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setScale((s) => Math.min(4, s + 0.25));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setScale((s) => Math.max(0.5, s - 0.25));
      } else if (e.key === "ArrowRight" && !/input|textarea/i.test((e.target as HTMLElement).tagName)) {
        setPage((p) => Math.min(numPages, p + 1));
      } else if (e.key === "ArrowLeft" && !/input|textarea/i.test((e.target as HTMLElement).tagName)) {
        setPage((p) => Math.max(1, p - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, numPages]);

  if (!file || !doc) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card-p p-6">
          <Dropzone accept={[".pdf"]} files={[]} onAdd={(fs) => fs[0] && load(fs[0])} onRemove={() => {}} issues={[]} />
          <p className="mt-3 text-center text-xs text-slate-400">Tip: you can also drop a PDF anywhere on the homepage and choose View.</p>
        </div>
        {loading && <p className="mt-4 text-center text-sm font-semibold text-brand-500">Opening document…</p>}
        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-300/60 bg-red-500/10 px-4 py-3 text-center text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="card-p overflow-hidden" tabIndex={0} aria-label="PDF viewer">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)] px-3 py-2">
        <button onClick={() => setSidebarOpen((v) => !v)} className="icon-btn" title="Toggle thumbnails" aria-label="Toggle thumbnail sidebar">☰</button>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="icon-btn" aria-label="Previous page">‹</button>
          <form onSubmit={(e) => { e.preventDefault(); }} className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={numPages}
              value={page}
              onChange={(e) => setPage(Math.min(numPages, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-12 rounded-md border border-[var(--border)] bg-[var(--card)] px-1 py-1 text-center text-xs"
              aria-label="Page number"
            />
            <span className="text-xs text-slate-400">/ {numPages}</span>
          </form>
          <button onClick={() => setPage((p) => Math.min(numPages, p + 1))} disabled={page >= numPages} className="icon-btn" aria-label="Next page">›</button>
        </div>

        <span className="mx-1 h-5 w-px bg-[var(--border)]" aria-hidden />

        <button onClick={() => setScale((s) => Math.max(0.5, s - 0.25))} className="icon-btn" aria-label="Zoom out" title="Ctrl + -">−</button>
        <span className="w-12 text-center text-xs font-bold">{Math.round(scale * 71)}%</span>
        <button onClick={() => setScale((s) => Math.min(4, s + 0.25))} className="icon-btn" aria-label="Zoom in" title="Ctrl + +">+</button>

        <span className="mx-1 h-5 w-px bg-[var(--border)]" aria-hidden />
        <button onClick={() => setRotation((r) => (r + 90) % 360)} className="icon-btn" title="Rotate" aria-label="Rotate page">⟳</button>
        <button onClick={toggleFullscreen} className="icon-btn" title="Fullscreen" aria-label="Toggle fullscreen">⛶</button>
        <button onClick={printPdf} className="icon-btn" title="Print" aria-label="Print document">🖨️</button>
        <button onClick={() => downloadBlob(file, file.name)} className="icon-btn" title="Download" aria-label="Download file">⬇</button>

        <div className="relative ml-auto flex items-center gap-1">
          <input
            id="pf-search"
            type="search"
            placeholder="Search… (Ctrl+F)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            className="w-36 rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs outline-none focus:border-brand-400 sm:w-48"
            aria-label="Search in document"
          />
          <button onClick={doSearch} className="icon-btn" aria-label="Run search">🔍</button>
        </div>
      </div>

      <div className="flex" style={{ height: "min(78vh, 900px)" }}>
        {sidebarOpen && (
          <aside className="w-36 shrink-0 space-y-2 overflow-y-auto border-r border-[var(--border)] bg-[var(--bg)] p-2 sm:w-44" aria-label="Page thumbnails">
            <ThumbList doc={doc} current={page} onSelect={setPage} />
          </aside>
        )}

        <div className="relative flex-1 overflow-auto bg-slate-200 p-4 dark:bg-slate-900/70">
          <div className="mx-auto w-fit shadow-lift">
            <canvas ref={canvasRef} className="rounded-sm bg-white" />
          </div>
        </div>

        {results.length > 0 && (
          <aside className="hidden w-64 shrink-0 overflow-y-auto border-l border-[var(--border)] bg-[var(--bg)] p-3 lg:block" aria-label="Search results">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{results.length} matches</p>
            <ul className="space-y-2">
              {results.map((r, i) => (
                <li key={i}>
                  <button onClick={() => setPage(r.page)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-left text-[11px] leading-snug transition hover:border-brand-400">
                    <span className="font-bold text-brand-500">p.{r.page}</span> {r.snippet}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      <style jsx global>{`
        .icon-btn {
          display: grid;
          place-items: center;
          min-width: 30px;
          height: 30px;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.15s ease;
        }
        .icon-btn:hover:not(:disabled) {
          background: rgba(99, 102, 241, 0.12);
          color: #6366f1;
        }
        .icon-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

function ThumbList({ doc, current, onSelect }: { doc: PdfDoc; current: number; onSelect: (n: number) => void }) {
  const [thumbs, setThumbs] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const urls: string[] = [];
      for (let i = 1; i <= Math.min(doc.numPages, 60); i++) {
        if (cancelled) return;
        try {
          const p = await doc.getPage(i);
          const vp = p.getViewport({ scale: 0.25 });
          const c = document.createElement("canvas");
          c.width = vp.width;
          c.height = vp.height;
          await p.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
          urls.push(c.toDataURL("image/jpeg", 0.7));
          setThumbs([...urls]);
        } catch {
          break;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc]);

  return (
    <>
      {Array.from({ length: doc.numPages }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i + 1)}
          className={`block w-full rounded-lg border-2 p-1 transition ${current === i + 1 ? "border-brand-500" : "border-transparent hover:border-brand-300"}`}
          aria-label={`Go to page ${i + 1}`}
          aria-current={current === i + 1}
        >
          {thumbs[i] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbs[i]} alt="" className="w-full rounded" loading="lazy" />
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded bg-slate-200 text-xs text-slate-400 dark:bg-slate-700">{i + 1}</div>
          )}
          <span className="mt-0.5 block text-center text-[10px] font-semibold text-slate-400">{i + 1}</span>
        </button>
      ))}
    </>
  );
}

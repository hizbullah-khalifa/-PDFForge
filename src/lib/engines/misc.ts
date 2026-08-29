import type { Engine } from "./base";
import { readFileBuffer, baseName } from "@/lib/utils";
import { openPdf, renderPageToCanvas, getPageText } from "@/lib/pdf/render";
import { parseFlatIndices } from "@/lib/pdf/ranges";

export const ocrEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  const lang = String(opts.language || "eng");
  ctx.report("Loading OCR engine...", 5);
  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker(lang, 1, {
    logger: (m: { status?: string; progress?: number }) => {
      if (m.status === "recognizing text") {
        ctx.report(`Recognizing text (${lang})...`, Math.round((m.progress || 0) * 100));
      }
    },
  });

  try {
    const { doc, numPages } = await openPdf(file);
    let indices = Array.from({ length: numPages }, (_, i) => i);
    if (opts.pages) {
      const wanted = new Set(parseFlatIndices(opts.pages, numPages));
      indices = indices.filter((i) => wanted.has(i));
    }

    const parts: string[] = [];
    for (let n = 0; n < indices.length; n++) {
      ctx.report(`Scanning pages... (${n + 1}/${indices.length})`, Math.round((n / indices.length) * 90));
      const canvas = await renderPageToCanvas(doc, indices[n] + 1, 2.2);
      const result = await worker.recognize(canvas);
      parts.push(`--- Page ${indices[n] + 1} ---\n${result.data.text.trim()}`);
    }

    const text = parts.join("\n\n");
    return {
      outputs: [{ name: `${baseName(file.name)}-ocr.txt`, blob: new Blob([text], { type: "text/plain;charset=utf-8" }) }],
      message:
        text.trim().length > 40
          ? `OCR complete \u2014 ${text.split(/\s+/).length.toLocaleString()} words recognized in ${indices.length} page(s). Edit the text below before downloading.`
          : "Very little text was recognized. Try a higher-quality scan or a different language.",
      preview: { type: "text", text, fileName: `${baseName(file.name)}-ocr.txt` },
    };
  } finally {
    await worker.terminate();
  }
};

export const pdfToTextEngine: Engine = async (files, _opts, ctx) => {
  const file = files[0];
  const { doc, numPages } = await openPdf(file);
  const parts: string[] = [];
  for (let i = 1; i <= numPages; i++) {
    ctx.report(`Extracting text... (${i}/${numPages})`, Math.round((i / numPages) * 85));
    parts.push(`--- Page ${i} ---\n${await getPageText(doc, i)}`);
  }
  const text = parts.join("\n\n");
  if (!text.replace(/--- Page \d+ ---/g, "").trim())
    throw new Error("No selectable text found. This looks like a scanned PDF \u2014 use PDF OCR instead.");
  ctx.report("Generating output...", 95);
  return {
    outputs: [{ name: `${baseName(file.name)}.txt`, blob: new Blob([text], { type: "text/plain;charset=utf-8" }) }],
    message: `Extracted all selectable text from ${numPages} page(s).`,
    preview: { type: "text", text, fileName: `${baseName(file.name)}.txt` },
  };
};

export const extractImagesEngine: Engine = async (files, _opts, ctx) => {
  const file = files[0];
  const bytes = await readFileBuffer(file);
  const pdfjs = await (await import("@/lib/pdf/pdfjs")).getPdfjs();
  const doc = await pdfjs.getDocument({ data: bytes.slice(0), isEvalSupported: false }).promise;

  const found: Array<{ url: string; name: string }> = [];
  const blobs: Array<{ name: string; blob: Blob }> = [];

  outer: for (let p = 1; p <= doc.numPages; p++) {
    ctx.report(`Scanning pages... (${p}/${doc.numPages})`, Math.round((p / doc.numPages) * 80));
    const page = await doc.getPage(p);
    const ops = await page.getOperatorList();
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      if (fn === pdfjs.OPS.paintImageXObject) {
        const name = ops.argsArray[i][0] as string;
        try {
          const img: any = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("timeout")), 3000);
            (page.objs as any).get(name, (obj: any) => {
              clearTimeout(timeout);
              resolve(obj);
            });
          });
          const width: number = img.width;
          const height: number = img.height;
          if (!width || !height || width * height < 4000) continue;
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const c2d = canvas.getContext("2d")!;
          if (img.bitmap) {
            c2d.drawImage(img.bitmap, 0, 0);
          } else if (img.data) {
            const rgbData = c2d.createImageData(width, height);
            const src: Uint8ClampedArray | Uint8Array = img.data;
            const comps = src.length / (width * height);
            for (let px = 0; px < width * height; px++) {
              if (comps >= 3) {
                rgbData.data[px * 4] = src[px * comps];
                rgbData.data[px * 4 + 1] = src[px * comps + 1];
                rgbData.data[px * 4 + 2] = src[px * comps + 2];
                rgbData.data[px * 4 + 3] = comps === 4 ? src[px * comps + 3] : 255;
              }
            }
            c2d.putImageData(rgbData, 0, 0);
          } else continue;
          const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
          if (!blob) continue;
          const entry = { url: URL.createObjectURL(blob), name: `${baseName(file.name)}-img${found.length + 1}.png` };
          found.push(entry);
          blobs.push({ name: entry.name, blob });
          if (found.length >= 60) break outer;
        } catch {
          continue;
        }
      }
    }
  }

  if (!blobs.length)
    throw new Error("No embedded images were found in this PDF.");

  ctx.report("Generating output...", 92);
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const b of blobs) zip.file(b.name, b.blob);
  const zipBlob = await zip.generateAsync({ type: "blob" });
  return {
    outputs: [{ name: `${baseName(file.name)}-images.zip`, blob: zipBlob }],
    message: `Extracted ${blobs.length} embedded image(s).`,
    preview: { type: "images", images: found.slice(0, 24) },
  };
};

export const compareEngine: Engine = async (files, _opts, ctx) => {
  if (files.length !== 2) throw new Error("Select exactly two PDF files to compare.");
  const [a, b] = files;
  ctx.report("Reading document A...", 15);
  const docA = await openPdf(a);
  ctx.report("Reading document B...", 35);
  const docB = await openPdf(b);

  const linesOf = async (d: Awaited<ReturnType<typeof openPdf>>["doc"]) => {
    const out: string[][] = [];
    for (let i = 1; i <= d.numPages; i++) {
      ctx.report(`Extracting text... (${i}/${d.numPages})`, 50);
      const t = await getPageText(d, i);
      out.push(t.split(/\n+/).map((l) => l.trim()).filter(Boolean));
    }
    return out;
  };

  const linesA = await linesOf(docA.doc);
  const linesB = await linesOf(docB.doc);

  const collect = (pages: string[][]) => {
    const m = new Map<string, number>();
    pages.forEach((pg, pageIndex) =>
      pg.forEach((l) => {
        if (!m.has(l)) m.set(l, pageIndex + 1);
      })
    );
    return m;
  };
  const mA = collect(linesA);
  const mB = collect(linesB);

  const added: string[] = [];
  mB.forEach((page, line) => {
    if (!mA.has(line)) added.push(`[B \u00b7 page ${page}] ${line}`);
  });
  const removed: string[] = [];
  mA.forEach((page, line) => {
    if (!mB.has(line)) removed.push(`[A \u00b7 page ${page}] ${line}`);
  });

  const report = [
    "PDFForge \u2014 Compare Report",
    `Document A: ${a.name}`,
    `Document B: ${b.name}`,
    `Generated: ${new Date().toLocaleString()}`,
    "",
    `Summary: ${added.length} line(s) only in B, ${removed.length} line(s) only in A`,
    "",
    "--- Added in B ---",
    ...(added.slice(0, 500).length ? added.slice(0, 500) : ["(none)"]),
    "",
    "--- Removed from A (missing in B) ---",
    ...(removed.slice(0, 500).length ? removed.slice(0, 500) : ["(none)"]),
  ].join("\n");

  const identical = added.length === 0 && removed.length === 0;
  return {
    outputs: [{ name: "compare-report.txt", blob: new Blob([report], { type: "text/plain;charset=utf-8" }) }],
    message: identical
      ? "The two documents contain identical text content."
      : `Found ${added.length} added and ${removed.length} removed text line(s). Full report is ready to download.`,
  };
};

export const metadataEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  ctx.report("Analyzing document...", 20);
  const bytes = await readFileBuffer(file);
  const { PDFDocument } = await import("@cantoo/pdf-lib");
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  const previous = {
    title: doc.getTitle() || "\u2014",
    author: doc.getAuthor() || "\u2014",
    subject: doc.getSubject() || "\u2014",
  };
  const changes: string[] = [];
  const setIf = (v: unknown, apply: (s: string) => void, label: string) => {
    const s = String(v ?? "").trim();
    if (s) {
      apply(s);
      changes.push(`${label}: "${s}"`);
    }
  };

  setIf(opts.title, (v) => doc.setTitle(v), "Title");
  setIf(opts.author, (v) => doc.setAuthor(v), "Author");
  setIf(opts.subject, (v) => doc.setSubject(v), "Subject");
  setIf(opts.keywords, (v) => doc.setKeywords(v.split(/,\s*/)), "Keywords");
  doc.setModificationDate(new Date());
  doc.setProducer("PDFForge");

  ctx.report("Generating output...", 90);
  const outBytes = await doc.save({ useObjectStreams: true });
  return {
    outputs: [{ name: `${baseName(file.name)}-metadata.pdf`, blob: new Blob([outBytes as unknown as BlobPart], { type: "application/pdf" }) }],
    message: changes.length
      ? `Updated metadata \u2014 ${changes.join(", ")}. Previous values \u2014 Title: ${previous.title}, Author: ${previous.author}, Subject: ${previous.subject}.`
      : "No fields were filled in, so the file was re-saved unchanged.",
  };
};

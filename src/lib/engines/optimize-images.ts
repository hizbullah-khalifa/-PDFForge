import { PDFDocument } from "@cantoo/pdf-lib";
import JSZip from "jszip";
import type { Engine } from "./base";
import { readFileBuffer, baseName, formatBytes, downloadBlob } from "@/lib/utils";
import { openPdf, renderPageToCanvas, canvasToBlob } from "@/lib/pdf/render";
import { parseFlatIndices } from "@/lib/pdf/ranges";
import { getPdfjs } from "@/lib/pdf/pdfjs";

function toBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export const compressEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  ctx.report("Analyzing document...", 15);
  const bytes = await readFileBuffer(file);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  ctx.report("Processing pages...", 45);
  if (opts.stripMetadata !== false) {
    doc.setTitle("");
    doc.setSubject("");
    doc.setKeywords([]);
    doc.setAuthor("");
  }

  ctx.report("Optimizing structure...", 70);
  const outBytes = await doc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 200,
  });

  const original = file.size;
  const compressed = outBytes.byteLength;
  const delta = original - compressed;
  const pct = original > 0 ? Math.max(0, Math.round((delta / original) * 100)) : 0;

  ctx.report("Almost done...", 95);
  let message =
    delta > 512
      ? `Original: ${formatBytes(original)} \u2192 Compressed: ${formatBytes(compressed)} (${pct}% smaller)`
      : `This PDF is already well optimized (${formatBytes(original)}). Client-side optimization works best on files with unused objects and metadata.`;

  if (opts.level === "maximum" && delta <= 512) {
    try {
      const pdfjs = await getPdfjs();
      const pdfDoc = await pdfjs.getDocument({ data: bytes.slice(0), isEvalSupported: false }).promise;
      const raster = await PDFDocument.create();
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        ctx.report(`Re-encoding pages... (${i}/${pdfDoc.numPages})`, 50 + Math.round((i / pdfDoc.numPages) * 40));
        const canvas = await renderPageToCanvas(pdfDoc, i, 1.5);
        const jpg = await canvasToBlob(canvas, "image/jpeg", 0.72);
        const img = await raster.embedJpg(await jpg.arrayBuffer());
        const page = raster.addPage([canvas.width, canvas.height]);
        page.drawImage(img, { x: 0, y: 0, width: canvas.width, height: canvas.height });
      }
      const rBytes = await raster.save({ useObjectStreams: true });
      if (rBytes.byteLength < compressed) {
        message = `Maximum compression: ${formatBytes(original)} \u2192 ${formatBytes(rBytes.byteLength)} (${Math.round(((original - rBytes.byteLength) / original) * 100)}% smaller). Pages are re-encoded as high-quality images.`;
        return { outputs: [{ name: `${baseName(file.name)}-compressed.pdf`, blob: toBlob(rBytes) }], message };
      }
    } catch {
      /* fall back to structural result */
    }
  }

  return { outputs: [{ name: `${baseName(file.name)}-compressed.pdf`, blob: toBlob(outBytes) }], message };
};

export const pdfToImagesEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  const fmt = (opts.format as "jpg" | "png") || "jpg";
  ctx.report("Analyzing document...", 10);
  const pdfjs = await getPdfjs();
  const bytes = await readFileBuffer(file);
  const doc = await pdfjs.getDocument({ data: bytes.slice(0), isEvalSupported: false }).promise;
  const total = doc.numPages;
  const scale = parseFloat(opts.resolution || "2");
  const quality = parseFloat(opts.quality || "0.9");

  let indices: number[];
  if (opts.pages) {
    const wanted = new Set(parseFlatIndices(opts.pages, total));
    indices = Array.from({ length: total }, (_, i) => i).filter((i) => wanted.has(i));
  } else {
    indices = Array.from({ length: total }, (_, i) => i);
  }

  const images: Array<{ url: string; name: string }> = [];
  const blobs: Array<{ name: string; blob: Blob }> = [];
  const pad = String(total).length;

  for (let n = 0; n < indices.length; n++) {
    const pageNum = indices[n] + 1;
    ctx.report(`Rendering pages... (${n + 1}/${indices.length})`, 10 + Math.round((n / indices.length) * 75));
    const canvas = await renderPageToCanvas(doc, pageNum, scale);
    const blob = await canvasToBlob(canvas, fmt === "png" ? "image/png" : "image/jpeg", quality);
    const name = `${baseName(file.name)}-page-${String(pageNum).padStart(pad, "0")}.${fmt}`;
    blobs.push({ name, blob });
    images.push({ url: URL.createObjectURL(blob), name });
  }

  if (blobs.length === 1) {
    ctx.report("Your file is ready!", 100);
    return { outputs: blobs, message: `Converted 1 page to ${fmt.toUpperCase()}.`, preview: { type: "images", images } };
  }

  ctx.report("Packaging ZIP...", 92);
  const zip = new JSZip();
  for (const b of blobs) zip.file(b.name, b.blob);
  const zipBlob = await zip.generateAsync({ type: "blob" });
  ctx.report("Your file is ready!", 100);
  return {
    outputs: [{ name: `${baseName(file.name)}-images.zip`, blob: zipBlob }],
    message: `Converted ${blobs.length} pages to ${fmt.toUpperCase()} and packaged them as a ZIP.`,
    preview: { type: "images", images },
    meta: { individual: true },
  };
};

export const downloadAllImages = async (images: Array<{ url: string; name: string }>): Promise<void> => {
  for (const img of images) {
    const res = await fetch(img.url);
    downloadBlob(await res.blob(), img.name);
    await new Promise((r) => setTimeout(r, 250));
  }
};

export const imagesToPdfEngine: Engine = async (files, opts, ctx) => {
  const doc = await PDFDocument.create();
  const size = (opts.pageSize as string) || "auto";
  const orientation = (opts.orientation as string) || "auto";
  const marginMM = opts.margin != null ? Number(opts.margin) : 10;
  const marginPt = (marginMM / 25.4) * 72;
  const quality = opts.quality != null ? Number(opts.quality) : 0.88;

  const sizes: Record<string, [number, number]> = { a4: [595.28, 841.89], letter: [612, 792] };

  for (let i = 0; i < files.length; i++) {
    ctx.report(`Processing images... (${i + 1}/${files.length})`, Math.round((i / files.length) * 80));
    const f = files[i];
    const buf = await f.arrayBuffer();
    let embedded;
    let iw: number;
    let ih: number;

    if (/\.jpe?g$/i.test(f.name)) {
      embedded = await doc.embedJpg(new Uint8Array(buf));
      iw = embedded.width;
      ih = embedded.height;
    } else if (/\.png$/i.test(f.name)) {
      const png = await doc.embedPng(new Uint8Array(buf));
      iw = png.width;
      ih = png.height;
      const canvas = document.createElement("canvas");
      canvas.width = png.width;
      canvas.height = png.height;
      canvas.getContext("2d")!.drawImage(png as unknown as CanvasImageSource, 0, 0);
      const jpegBlob = await canvasToBlob(canvas, "image/jpeg", quality);
      embedded = await doc.embedJpg(await jpegBlob.arrayBuffer());
    } else {
      const bitmap = await createImageBitmap(new Blob([buf]));
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
      const jpegBlob = await canvasToBlob(canvas, "image/jpeg", quality);
      embedded = await doc.embedJpg(await jpegBlob.arrayBuffer());
      iw = bitmap.width;
      ih = bitmap.height;
    }
    iw = embedded.width;
    ih = embedded.height;

    let pw: number;
    let ph: number;
    if (size === "auto") {
      pw = iw + marginPt * 2;
      ph = ih + marginPt * 2;
    } else {
      [pw, ph] = sizes[size];
      if (orientation === "landscape" || (orientation === "auto" && iw > ih)) [pw, ph] = [ph, pw];
    }

    const page = doc.addPage([pw, ph]);
    const maxW = pw - marginPt * 2;
    const maxH = ph - marginPt * 2;
    const s = Math.min(maxW / iw, maxH / ih);
    const w = iw * s;
    const h = ih * s;
    page.drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
  }

  doc.setProducer("PDFForge");
  ctx.report("Generating output...", 92);
  const bytes = await doc.save({ useObjectStreams: true });
  return {
    outputs: [{ name: "images.pdf", blob: toBlob(bytes) }],
    message: `Combined ${files.length} image(s) into a single PDF.`,
  };
};

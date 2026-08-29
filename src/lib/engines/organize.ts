import { PDFDocument } from "@cantoo/pdf-lib";
import JSZip from "jszip";
import type { Engine } from "./base";
import { readFileBuffer, baseName } from "@/lib/utils";
import { parsePageRanges, parseFlatIndices, describeRanges } from "@/lib/pdf/ranges";

async function loadDoc(file: File): Promise<{ doc: PDFDocument; bytes: Uint8Array }> {
  const bytes = await readFileBuffer(file);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return { doc, bytes };
}

export const mergeEngine: Engine = async (files, _opts, ctx) => {
  const out = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    ctx.report(`Analyzing document... (${i + 1}/${files.length})`, Math.round((i / files.length) * 60));
    const { doc } = await loadDoc(files[i]);
    const pages = await out.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  out.setProducer("PDFForge");
  ctx.report("Generating output...", 90);
  const bytes = await out.save({ useObjectStreams: true });
  return {
    outputs: [{ name: "merged.pdf", blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }) }],
    message: `Merged ${files.length} documents into one PDF.`,
  };
};

type SplitMode = "ranges" | "everyN" | "extract";

async function buildSplit(
  source: PDFDocument,
  groups: number[][],
  baseNameStr: string,
  suffixes: string[],
  ctx: { report: (s: string, p?: number) => void }
): Promise<Array<{ name: string; blob: Blob }>> {
  const outputs: Array<{ name: string; blob: Blob }> = [];
  for (let i = 0; i < groups.length; i++) {
    ctx.report("Processing pages...", Math.round((i / groups.length) * 85));
    const sub = await PDFDocument.create();
    const pages = await sub.copyPages(source, groups[i]);
    pages.forEach((p) => sub.addPage(p));
    const bytes = await sub.save({ useObjectStreams: true });
    outputs.push({
      name: `${baseNameStr}${suffixes[i] || "-" + (i + 1)}.pdf`,
      blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
    });
  }
  return outputs;
}

export const splitEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  const { doc } = await loadDoc(file);
  const total = doc.getPageCount();
  const mode = (opts.mode as SplitMode) || "ranges";
  let groups: number[][] = [];
  let message = "";

  if (mode === "everyN") {
    const n = Math.max(1, parseInt(opts.n || "5", 10));
    for (let start = 0; start < total; start += n) {
      groups.push(Array.from({ length: Math.min(n, total - start) }, (_, k) => start + k));
    }
    message = `Split into ${groups.length} documents of up to ${n} pages.`;
  } else if (mode === "extract") {
    groups = [parseFlatIndices(opts.pages || "", total)];
    message = `Extracted ${describeRanges(groups)}.`;
  } else {
    groups = parsePageRanges(opts.ranges || "", total);
    message = `Created ${groups.length} documents (${describeRanges(groups)}).`;
  }

  const outputs = await buildSplit(doc, groups, baseName(file.name), ["", "-part2", "-part3"], ctx);
  if (outputs.length === 1) return { outputs, message };

  ctx.report("Generating output...", 92);
  const zip = new JSZip();
  for (const o of outputs) zip.file(o.name, o.blob);
  const zipBlob = await zip.generateAsync({ type: "blob" });
  return {
    outputs: [{ name: `${baseName(file.name)}-split.zip`, blob: zipBlob }],
    message: message + ` Files are also bundled as a ZIP.`,
    meta: { parts: outputs.length },
    preview: { type: "images", images: [] },
  };
};

export const extractPagesEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  const { doc } = await loadDoc(file);
  const indices = parseFlatIndices(opts.pages || "", doc.getPageCount());
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, indices);
  pages.forEach((p) => out.addPage(p));
  ctx.report("Generating output...", 90);
  const bytes = await out.save({ useObjectStreams: true });
  return {
    outputs: [{ name: `${baseName(file.name)}-extracted.pdf`, blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }) }],
    message: `Extracted ${indices.map((i) => i + 1).join(", ")}.`,
  };
};

export const deletePagesEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  const { doc } = await loadDoc(file);
  const total = doc.getPageCount();
  const remove = new Set(parseFlatIndices(opts.pages || "", total));
  const keep = Array.from({ length: total }, (_, i) => i).filter((i) => !remove.has(i));
  if (!keep.length) throw new Error("You cannot delete every page. Keep at least one page.");
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, keep);
  pages.forEach((p) => out.addPage(p));
  ctx.report("Generating output...", 90);
  const bytes = await out.save({ useObjectStreams: true });
  return {
    outputs: [{ name: `${baseName(file.name)}-pages-deleted.pdf`, blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }) }],
    message: `Deleted ${remove.size} page(s). ${keep.length} remain.`,
  };
};

export const rotateEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  const { doc } = await loadDoc(file);
  const angle = parseInt(opts.angle || "90", 10);
  const targets = opts.pages ? parseFlatIndices(opts.pages, doc.getPageCount()) : doc.getPageIndices();
  for (const idx of targets) {
    const page = doc.getPage(idx);
    const current = page.getRotation().angle;
    page.setRotation({ type: (current + angle) % 360 } as any);
  }
  ctx.report("Generating output...", 90);
  const bytes = await doc.save({ useObjectStreams: true });
  return {
    outputs: [{ name: `${baseName(file.name)}-rotated.pdf`, blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }) }],
    message: `Rotated ${targets.length} page(s) by ${angle}\u00B0.`,
  };
};

export const reorderEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  const { doc } = await loadDoc(file);
  const total = doc.getPageCount();
  const order: number[] = String(opts.order || "")
    .split(/[,\s]+/)
    .map((s: string) => parseInt(s, 10))
    .filter((n: number) => !isNaN(n));
  const clean = [...new Set(order)].filter((n) => n >= 1 && n <= total);
  if (clean.length !== total)
    throw new Error(`Enter all ${total} page numbers exactly once (e.g. "${Array.from({ length: Math.min(total, 6) }, (_, i) => i + 1).join(",")}${total > 6 ? ",..." : ""}").`);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, clean.map((n) => n - 1));
  pages.forEach((p) => out.addPage(p));
  ctx.report("Generating output...", 90);
  const bytes = await out.save({ useObjectStreams: true });
  return {
    outputs: [{ name: `${baseName(file.name)}-reordered.pdf`, blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }) }],
    message: `New order: ${clean.join(", ")}.`,
  };
};

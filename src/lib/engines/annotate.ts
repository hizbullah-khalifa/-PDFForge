import type { Engine } from "./base";
import { rgb } from "@cantoo/pdf-lib";
import { readFileBuffer, baseName } from "@/lib/utils";
import { parseFlatIndices } from "@/lib/pdf/ranges";

function hexRgb(hex: string) {
  const m = hex.replace("#", "");
  const v = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return rgb(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255);
}

function toBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

type Grid =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

function gridPos(grid: Grid, pw: number, ph: number, w: number, h: number, margin: number) {
  const positions: Record<Grid, [number, number]> = {
    "top-left": [margin, ph - margin - h],
    "top-center": [(pw - w) / 2, ph - margin - h],
    "top-right": [pw - margin - w, ph - margin - h],
    "middle-left": [margin, (ph - h) / 2],
    center: [(pw - w) / 2, (ph - h) / 2],
    "middle-right": [pw - margin - w, (ph - h) / 2],
    "bottom-left": [margin, margin],
    "bottom-center": [(pw - w) / 2, margin],
    "bottom-right": [pw - margin - w, margin],
  };
  const [x, y] = positions[grid] || positions.center;
  return { x, y };
}

export const watermarkEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  ctx.report("Analyzing document...", 15);
  const bytes = await readFileBuffer(file);
  const { PDFDocument, StandardFonts, degrees } = await import("@cantoo/pdf-lib");
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  const opacity = Number(opts.opacity ?? 0.18);
  const rotation = Number(opts.rotation ?? 45);
  const fontSize = Number(opts.fontSize ?? 48);
  const color = hexRgb(String(opts.color || "#6366f1"));
  const grid = (opts.position as Grid) || "center";
  const pagesOpt = String(opts.pages || "");
  const targets = pagesOpt && pagesOpt.toLowerCase() !== "all"
    ? parseFlatIndices(pagesOpt, doc.getPageCount())
    : doc.getPageIndices();

  let image: Awaited<ReturnType<typeof PDFDocument.prototype.embedPng>> | null = null;
  if (opts.watermarkType === "image") {
    const imgFile = opts.imageFile as File | undefined;
    if (!imgFile) throw new Error("Choose a watermark image (PNG or JPG).");
    const buf = new Uint8Array(await imgFile.arrayBuffer());
    image = /\.png$/i.test(imgFile.name) ? await doc.embedPng(buf) : await doc.embedJpg(buf);
  }

  for (let n = 0; n < targets.length; n++) {
    ctx.report("Applying watermark...", Math.round((n / Math.max(1, targets.length)) * 85));
    const page = doc.getPage(targets[n]);
    const { width: pw, height: ph } = page.getSize();

    if (image) {
      const scale = fontSize / 48;
      const w = image.width * scale;
      const h = image.height * scale;
      const { x, y } = gridPos(grid, pw, ph, w, h, 40);
      page.drawImage(image, { x, y, width: w, height: h, opacity, rotate: degrees(rotation) });
    } else {
      const text = String(opts.text || "CONFIDENTIAL");
      const tw = font.widthOfTextAtSize(text, fontSize);
      const th = font.heightAtSize(fontSize);
      const { x, y } = gridPos(grid, pw, ph, tw, th, 40);
      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color,
        opacity,
        rotate: degrees(rotation),
      });
    }
  }

  ctx.report("Generating output...", 92);
  const outBytes = await doc.save({ useObjectStreams: true });
  return {
    outputs: [{ name: `${baseName(file.name)}-watermarked.pdf`, blob: toBlob(outBytes) }],
    message: `Watermark applied to ${targets.length} page(s).`,
  };
};

export const pageNumbersEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  ctx.report("Analyzing document...", 15);
  const bytes = await readFileBuffer(file);
  const { PDFDocument, StandardFonts } = await import("@cantoo/pdf-lib");
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const total = doc.getPageCount();
  const startPage = Math.max(1, Number(opts.startPage ?? 1));
  const format = String(opts.format || "n");
  const position = String(opts.position || "bottom-center");
  const size = Number(opts.fontSize ?? 10);
  const skipFirst = !!opts.skipFirst;

  for (let i = startPage - 1; i < total; i++) {
    ctx.report("Adding numbers...", Math.round((i / total) * 85));
    if (skipFirst && i === 0) continue;
    const page = doc.getPage(i);
    const label =
      format === "n-of-total"
        ? `${i + 1} / ${total}`
        : format === "page-n"
        ? `Page ${i + 1}`
        : format === "page-n-of-total"
        ? `Page ${i + 1} of ${total}`
        : `${i + 1}`;
    const { width: pw } = page.getSize();
    const { height: ph } = page.getSize();
    const tw = font.widthOfTextAtSize(label, size);
    const x = position.endsWith("left") ? 40 : position.endsWith("right") ? pw - 40 - tw : (pw - tw) / 2;
    const y = position.startsWith("top") ? ph - 34 : 24;
    page.drawText(label, { x, y, size, font });
  }

  ctx.report("Generating output...", 92);
  const outBytes = await doc.save({ useObjectStreams: true });
  return {
    outputs: [{ name: `${baseName(file.name)}-numbered.pdf`, blob: toBlob(outBytes) }],
    message: "Page numbers added.",
  };
};

export const flattenSignatureEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  const dataUrl = String(opts.signatureDataUrl || "");
  if (!dataUrl) throw new Error("No signature was provided.");
  ctx.report("Applying signature...", 40);
  const bytes = await readFileBuffer(file);
  const { PDFDocument } = await import("@cantoo/pdf-lib");
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  const res = await fetch(dataUrl);
  const imgBuf = new Uint8Array(await res.arrayBuffer());
  const img = dataUrl.includes("image/png")
    ? await doc.embedPng(imgBuf)
    : await doc.embedJpg(imgBuf);

  const pageIndex = Math.min(doc.getPageCount() - 1, Math.max(0, Number(opts.page ?? 1) - 1));
  const page = doc.getPage(pageIndex);
  const { width: pw, height: ph } = page.getSize();
  const targetW = pw * Number(opts.widthRatio ?? 0.25);
  const targetH = (targetW * img.height) / img.width;
  const xr = Number(opts.xRatio ?? 0.6);
  const yr = Number(opts.yRatio ?? 0.12);
  page.drawImage(img, {
    x: xr * pw,
    y: yr * ph,
    width: targetW,
    height: targetH,
    opacity: Number(opts.opacity ?? 1),
  });

  ctx.report("Generating output...", 92);
  const outBytes = await doc.save({ useObjectStreams: true });
  return {
    outputs: [{ name: `${baseName(file.name)}-signed.pdf`, blob: toBlob(outBytes) }],
    message: `Signature applied to page ${pageIndex + 1}.`,
  };
};

export function makeSignedFileName(original: string): string {
  return `${baseName(original)}-signed.pdf`;
}

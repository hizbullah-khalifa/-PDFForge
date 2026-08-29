"use client";

import { loadPdfDoc, type PdfDoc } from "./pdfjs";

export interface TextLine {
  y: number;
  height: number;
  items: Array<{ str: string; x: number; width: number; height: number }>;
}

export async function openPdf(file: File, password?: string): Promise<{ doc: PdfDoc; bytes: Uint8Array; numPages: number }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await loadPdfDoc(bytes, password);
  return { doc, bytes, numPages: doc.numPages };
}

export async function renderPageToCanvas(
  doc: PdfDoc,
  pageNum: number,
  scale: number
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))), type, quality)
  );
}

export async function extractTextLines(doc: PdfDoc, pageNum: number): Promise<TextLine[]> {
  const page = await doc.getPage(pageNum);
  const tc = await page.getTextContent();
  const raw = tc.items
    .filter((it): it is Extract<(typeof tc.items)[number], { str: string }> => "str" in it && (it as any).str !== undefined)
    .map((it) => ({
      str: it.str,
      x: it.transform[4],
      y: it.transform[5],
      width: it.width,
      height: Math.abs(it.transform[3]) || it.height || 10,
    }))
    .filter((it) => it.str.trim().length > 0);

  raw.sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: TextLine[] = [];
  for (const it of raw) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - it.y) <= Math.max(2, it.height * 0.5)) {
      last.items.push({ str: it.str, x: it.x, width: it.width, height: it.height });
    } else {
      lines.push({ y: it.y, height: it.height, items: [{ str: it.str, x: it.x, width: it.width, height: it.height }] });
    }
  }
  for (const l of lines) l.items.sort((a, b) => a.x - b.x);
  return lines.filter((l) => l.items.length > 0);
}

export function lineText(l: TextLine): string {
  let out = "";
  let prevEnd = -1;
  for (const it of l.items) {
    if (prevEnd >= 0 && it.x - prevEnd > 1.5) out += " ";
    out += it.str;
    prevEnd = it.x + it.width;
  }
  return out.replace(/\s+/g, " ").trim();
}

export async function getPageText(doc: PdfDoc, pageNum: number): Promise<string> {
  const lines = await extractTextLines(doc, pageNum);
  return lines.map(lineText).join("\n");
}

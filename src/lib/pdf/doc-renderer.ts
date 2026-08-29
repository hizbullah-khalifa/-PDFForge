import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "@cantoo/pdf-lib";

export interface RenderBlock {
  type: "h1" | "h2" | "h3" | "p" | "li" | "img" | "table";
  text?: string;
  src?: string;
  rows?: string[][];
}

interface Ctx {
  doc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  page: PDFPage;
  y: number;
  margin: number;
  width: number;
  size: number;
  report: (stage: string, pct?: number) => void;
}

const A4 = [595.28, 841.89] as const;
const LETTER = [612, 792] as const;

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      cur = test;
    } else {
      if (cur) lines.push(cur);
      if (font.widthOfTextAtSize(w, size) > maxWidth) {
        let chunk = "";
        for (const ch of w) {
          if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
            lines.push(chunk);
            chunk = ch;
          } else chunk += ch;
        }
        cur = chunk;
      } else cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function sanitize(text: string): string {
  return text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, "-").replace(/\t/g, "    ");
}

function newPage(ctx: Ctx): void {
  ctx.page = ctx.doc.addPage();
  ctx.y = ctx.page.getHeight() - ctx.margin;
}

function ensureSpace(ctx: Ctx, needed: number): void {
  if (ctx.y - needed < ctx.margin) newPage(ctx);
}

async function drawImageBlock(ctx: Ctx, src: string): Promise<void> {
  try {
    const res = await fetch(src);
    const buf = new Uint8Array(await res.arrayBuffer());
    const isPng = src.startsWith("data:image/png") || (buf[0] === 0x89 && buf[1] === 0x50);
    const img = isPng ? await ctx.doc.embedPng(buf) : await ctx.doc.embedJpg(buf);
    const maxW = ctx.width;
    const maxH = ctx.page.getHeight() - ctx.margin * 2;
    let w = img.width;
    let h = img.height;
    const s = Math.min(maxW / w, maxH / h, 1);
    w *= s;
    h *= s;
    ensureSpace(ctx, h + 12);
    ctx.page.drawImage(img, { x: ctx.margin, y: ctx.y - h, width: w, height: h });
    ctx.y -= h + 14;
  } catch {
    drawTextLines(ctx, "[image could not be embedded]", ctx.size, false, "#666666");
  }
}

type Hex = `#${string}`;

function hexRgb(hex: string) {
  const m = hex.replace("#", "");
  const v = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return rgb(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255);
}

function drawTextLines(ctx: Ctx, text: string, size: number, bold: boolean, color: string, indent = 0): void {
  const font = bold ? ctx.bold : ctx.font;
  const clean = sanitize(text);
  for (const line of wrap(clean, font, size, ctx.width - indent)) {
    ensureSpace(ctx, size * 1.5);
    ctx.page.drawText(line, {
      x: ctx.margin + indent,
      y: ctx.y - size,
      size,
      font,
      color: hexRgb(color),
    });
    ctx.y -= size * 1.45;
  }
}

async function drawTable(ctx: Ctx, rows: string[][]): Promise<void> {
  if (!rows.length) return;
  const cols = Math.max(...rows.map((r) => r.length));
  const size = 9;
  const pad = 4;
  const available = ctx.width;
  const colWidths: number[] = [];
  for (let c = 0; c < cols; c++) {
    let maxW = 30;
    for (const row of rows) {
      const cell = sanitize(row[c] || "");
      maxW = Math.max(maxW, Math.min(available / cols * 2.2, ctx.font.widthOfTextAtSize(cell, size) + pad * 2));
    }
    colWidths.push(maxW);
  }
  const total = colWidths.reduce((a, b) => a + b, 0);
  const scale = Math.min(1, available / total);
  for (let c = 0; c < cols; c++) colWidths[c] *= scale;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const heights = row.map(
      (cell, c) => wrap(sanitize(cell || ""), ctx.font, size, colWidths[c] - pad * 2).length * size * 1.35 + pad * 2
    );
    const rowH = Math.max(...heights, size + pad * 2);
    ensureSpace(ctx, rowH);
    const topY = ctx.y;
    let x = ctx.margin;
    for (let c = 0; c < cols; c++) {
      const cw = colWidths[c];
      ctx.page.drawRectangle({ x, y: topY - rowH, width: cw, height: rowH, borderColor: rgb(0.78, 0.8, 0.85), borderWidth: 0.75 });
      if (r === 0) ctx.page.drawRectangle({ x, y: topY - rowH, width: cw, height: rowH, color: rgb(0.94, 0.95, 0.99) });
      const lines = wrap(sanitize(row[c] || ""), r === 0 ? ctx.bold : ctx.font, size, cw - pad * 2);
      let ty = topY - pad - size;
      for (const ln of lines.slice(0, 4)) {
        ctx.page.drawText(ln, { x: x + pad, y: ty, size, font: r === 0 ? ctx.bold : ctx.font, color: rgb(0.15, 0.17, 0.23) });
        ty -= size * 1.3;
      }
      x += cw;
    }
    ctx.y -= rowH;
  }
  ctx.y -= 10;
}

export async function renderBlocksToPdf(
  blocks: RenderBlock[],
  opts: { pageSize?: "a4" | "letter"; margin?: number; fontSize?: number; title?: string },
  report: (stage: string, pct?: number) => void
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const [pw, ph] = opts.pageSize === "letter" ? LETTER : A4;
  doc.setTitle(opts.title || "PDFForge Document");
  doc.setProducer("PDFForge");
  doc.setCreator("PDFForge");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const margin = opts.margin ?? 56;
  const base = opts.fontSize ?? 11;

  const first = doc.addPage([pw, ph]);
  const ctx: Ctx = { doc, font, bold, page: first, y: ph - margin, margin, width: pw - margin * 2, size: base, report };

  const styles: Record<RenderBlock["type"], { size: number; bold: boolean; gap: number }> = {
    h1: { size: base * 1.9, bold: true, gap: 8 },
    h2: { size: base * 1.5, bold: true, gap: 7 },
    h3: { size: base * 1.22, bold: true, gap: 6 },
    p: { size: base, bold: false, gap: 8 },
    li: { size: base, bold: false, gap: 3 },
    img: { size: base, bold: false, gap: 10 },
    table: { size: base, bold: false, gap: 12 },
  };

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const st = styles[b.type] || styles.p;
    if (b.type === "img" && b.src) {
      await drawImageBlock(ctx, b.src);
    } else if (b.type === "table" && b.rows) {
      await drawTable(ctx, b.rows);
    } else if (b.type === "li") {
      drawTextLines(ctx, `\u2022  ${b.text || ""}`, st.size, st.bold, "#111827", 14);
      ctx.y -= 2;
    } else {
      drawTextLines(ctx, b.text || "", st.size, st.bold, b.type.startsWith("h") ? "#0f172a" : "#1f2937");
      ctx.y -= st.gap;
    }
    if (i % 25 === 0) report("Processing pages...", Math.round((i / blocks.length) * 70));
  }

  report("Generating output...", 90);
  return doc.save({ useObjectStreams: true });
}

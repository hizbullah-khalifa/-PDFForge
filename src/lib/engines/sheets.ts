import type { Engine } from "./base";
import { readFileBuffer, baseName } from "@/lib/utils";
import { openPdf, extractTextLines } from "@/lib/pdf/render";

function toBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export interface DetectedTable {
  name: string;
  rows: string[][];
}

export async function analyzePdfTables(
  file: File,
  ctx: { report: (s: string, p?: number) => void }
): Promise<DetectedTable[]> {
  const { doc, numPages } = await openPdf(file);
  const tables: DetectedTable[] = [];

  for (let i = 1; i <= numPages; i++) {
    ctx.report(`Detecting tables... (${i}/${numPages})`, Math.round((i / numPages) * 80));
    const lines = await extractTextLines(doc, i);
    const rows = lines.map((l) => {
      const cells: string[] = [];
      let prevEnd = -Infinity;
      for (const it of l.items) {
        const gap = it.x - prevEnd;
        if (cells.length && gap > Math.max(10, it.height * 1.4)) cells.push("__COL__");
        if (!cells.length) cells.push(it.str.trim());
        else cells[cells.length - 1] += it.str;
        prevEnd = it.x + it.width;
      }
      return cells.flatMap((c) => (c === "__COL__" ? ["", ""] : c === "" ? [""] : [c.replace(/^__COL__/, "").trim()]));
    });

    let current: string[][] = [];
    const flush = () => {
      if (current.length >= 2) {
        const width = Math.max(...current.map((r) => r.length));
        if (width >= 2) {
          current = current.map((r) => Array.from({ length: width }, (_, c) => r[c] || ""));
          tables.push({ name: `Table ${tables.length + 1} (page ${i})`, rows: current.slice(0, 500) });
        }
      }
      current = [];
    };

    for (const row of rows) {
      const cellCount = row.filter((c) => c !== "").length;
      if (cellCount >= 2) current.push(row);
      else flush();
    }
    flush();
  }
  return tables.slice(0, 20);
}

export async function buildXlsxFromTables(tables: DetectedTable[]): Promise<Blob> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  tables.forEach((t, i) => {
    const ws = XLSX.utils.aoa_to_sheet(t.rows);
    XLSX.utils.book_append_sheet(wb, ws, `Table ${i + 1}`);
  });
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([out as unknown as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export const pdfToExcelEngine: Engine = async (files, _opts, ctx) => {
  const file = files[0];
  ctx.report("Analyzing document...", 12);
  const tables = await analyzePdfTables(file, ctx);
  if (!tables.length) {
    throw new Error("No tables could be detected. This tool works best on PDFs with aligned columns of data.");
  }
  ctx.report("Generating output...", 92);
  const blob = await buildXlsxFromTables(tables);
  return {
    outputs: [{ name: `${baseName(file.name)}.xlsx`, blob }],
    message: `${tables.length} table${tables.length > 1 ? "s" : ""} detected and exported to separate sheets.`,
    meta: { allTables: tables },
    preview: { type: "tables", tables: tables.map((t) => ({ name: t.name, rows: t.rows.slice(0, 6) })) },
  };
};

export const excelToPdfEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  ctx.report("Analyzing spreadsheet...", 15);
  const XLSX = await import("xlsx");
  const { PDFDocument, StandardFonts, rgb } = await import("@cantoo/pdf-lib");

  const wb = XLSX.read(await readFileBuffer(file), { type: "array" });
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const landscape = opts.orientation === "landscape";
  const pw = landscape ? 842 : 595;
  const ph = landscape ? 595 : 842;
  const margin = 40;
  const size = 9;
  const showGrid = opts.gridlines !== false;

  for (const sheetName of wb.SheetNames) {
    ctx.report(`Processing sheets... (${sheetName})`, 50);
    const aoa = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[sheetName], { header: 1, raw: false, defval: "" });
    if (!aoa.length) continue;
    const cols = Math.max(...aoa.map((r: any[]) => (r || []).length));
    const colW: number[] = [];
    for (let c = 0; c < cols; c++) {
      let w = 36;
      for (const row of aoa.slice(0, 200)) {
        const v = String((row || [])[c] ?? "");
        w = Math.max(w, Math.min(pw / 3, font.widthOfTextAtSize(v, size) + 10));
      }
      colW.push(w);
    }
    const total = colW.reduce((a, b) => a + b, 0);
    const scale = Math.min(1, (pw - margin * 2) / total);
    for (let c = 0; c < cols; c++) colW[c] *= scale;

    const usableH = ph - margin * 2;
    let page = doc.addPage([pw, ph]);
    doc.setTitle(`${file.name} \u2014 ${sheetName}`);
    page.drawText(`${baseName(file.name)} \u2014 ${sheetName}`, {
      x: margin,
      y: ph - margin - 4,
      size: 11,
      font: bold,
      color: rgb(0.25, 0.27, 0.75),
    });
    let y = ph - margin - 24;

    for (let r = 0; r < aoa.length; r++) {
      const row = aoa[r] || [];
      const linesPerCell = row.map(
        (v: string, c: number) => wrapCount(String(v ?? ""), font, size, colW[c] - 8)
      );
      const rowH = Math.max(size + 6, Math.max(...linesPerCell) * size * 1.3 + 6);
      if (y - rowH < margin) {
        page = doc.addPage([pw, ph]);
        y = ph - margin;
      }
      let x = margin;
      for (let c = 0; c < cols; c++) {
        const cw = colW[c];
        if (showGrid) {
          page.drawRectangle({
            x,
            y: y - rowH,
            width: cw,
            height: rowH,
            borderColor: rgb(0.82, 0.84, 0.89),
            borderWidth: 0.5,
          });
        }
        if (r === 0) {
          page.drawRectangle({ x, y: y - rowH, width: cw, height: rowH, color: rgb(0.93, 0.94, 0.99), opacity: 0.9 });
        }
        const val = String(row[c] ?? "");
        if (val) {
          page.drawText(val, {
            x: x + 4,
            y: y - size - 3,
            size,
            font: r === 0 ? bold : font,
            color: rgb(0.15, 0.17, 0.23),
            maxWidth: cw - 8,
          });
        }
        x += cw;
      }
      y -= rowH;
    }
  }

  ctx.report("Generating output...", 92);
  const bytes = await doc.save({ useObjectStreams: true });
  return {
    outputs: [{ name: `${baseName(file.name)}.pdf`, blob: toBlob(bytes) }],
    message: `${wb.SheetNames.length} worksheet(s) rendered as a formatted PDF table.`,
  };
};

function wrapCount(text: string, font: { widthOfTextAtSize: (t: string, s: number) => number }, size: number, maxW: number): number {
  if (!text) return 1;
  return Math.max(1, Math.ceil(font.widthOfTextAtSize(text, size) / maxW));
}

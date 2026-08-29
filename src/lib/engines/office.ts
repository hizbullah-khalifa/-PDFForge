import type { Engine } from "./base";
import { readFileBuffer, baseName } from "@/lib/utils";
import { renderBlocksToPdf, type RenderBlock } from "@/lib/pdf/doc-renderer";
import { openPdf, extractTextLines, lineText } from "@/lib/pdf/render";

function median(nums: number[]): number {
  if (!nums.length) return 11;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

async function htmlToBlocks(html: string, ctxImgs: boolean): Promise<RenderBlock[]> {
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, "text/html");
  const blocks: RenderBlock[] = [];

  const pushTable = (table: HTMLTableElement) => {
    const rows: string[][] = [];
    table.querySelectorAll("tr").forEach((tr) => {
      const cells: string[] = [];
      tr.querySelectorAll("th,td").forEach((td) => cells.push(td.textContent?.trim() || ""));
      if (cells.length) rows.push(cells);
    });
    if (rows.length) blocks.push({ type: "table", rows });
  };

  const walk = (node: Element) => {
    for (const el of Array.from(node.children)) {
      const tag = el.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) {
        const level = Math.min(3, parseInt(tag[1], 10));
        blocks.push({ type: (`h${level}` as RenderBlock["type"]), text: el.textContent?.trim() || "" });
      } else if (tag === "p") {
        const imgs = el.querySelectorAll("img");
        if (!el.textContent?.trim() && imgs.length === 0) continue;
        blocks.push({ type: "p", text: el.textContent?.replace(/\s+/g, " ").trim() || "" });
      } else if (tag === "ul" || tag === "ol") {
        el.querySelectorAll(":scope > li").forEach((li) => {
          blocks.push({ type: "li", text: li.textContent?.replace(/\s+/g, " ").trim() || "" });
        });
      } else if (tag === "table") {
        pushTable(el as HTMLTableElement);
      } else if (tag === "img") {
        const src = el.getAttribute("src") || "";
        if (ctxImgs && src.startsWith("data:image")) blocks.push({ type: "img", src });
      } else if (tag === "br" || tag === "hr") {
        continue;
      } else if (["div", "section", "article", "main", "body", "blockquote", "header", "footer", "figure"].includes(tag)) {
        const directImg = tag === "figure" && el.querySelector("img");
        walk(el);
        if (directImg) {
          const src = directImg.getAttribute("src") || "";
          if (ctxImgs && src.startsWith("data:image")) blocks.push({ type: "img", src });
        }
      }
    }
  };
  walk(dom.body);
  return blocks;
}

export const wordToPdfEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  ctx.report("Analyzing document...", 15);
  const mammoth = await import("mammoth/mammoth.browser");
  const arrayBuffer = await file.arrayBuffer();
  ctx.report("Extracting content...", 35);
  const result = await mammoth.default.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.default.images.imgElement(async (img) => ({
        src: "data:image/png;base64," + (await img.readAsBase64String()),
      })),
    }
  );
  ctx.report("Processing pages...", 55);
  const blocks = await htmlToBlocks(result.value, true);
  if (!blocks.length) throw new Error("No readable content found in this document.");
  const bytes = await renderBlocksToPdf(blocks, opts, (s, p) => ctx.report(s, p));
  return {
    outputs: [{ name: `${baseName(file.name)}.pdf`, blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }) }],
    message: `Converted "${file.name}" to PDF with ${blocks.length} content blocks (text, headings, tables${blocks.some((b) => b.type === "img") ? ", images" : ""}).`,
  };
};

export const htmlToPdfEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  ctx.report("Analyzing document...", 20);
  const html = await file.text();
  ctx.report("Rendering layout...", 50);
  const blocks = await htmlToBlocks(html, false);
  if (!blocks.length) throw new Error("No readable content found in this HTML file.");
  const bytes = await renderBlocksToPdf(blocks, opts, (s, p) => ctx.report(s, p));
  return {
    outputs: [{ name: `${baseName(file.name)}.pdf`, blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }) }],
    message: "Rendered the HTML structure (headings, paragraphs, lists, tables) into a clean PDF.",
  };
};

export const textToPdfEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  ctx.report("Analyzing document...", 20);
  const raw = await file.text();
  ctx.report("Processing pages...", 50);
  const blocks: RenderBlock[] = raw.split(/\n{2,}/).map((chunk) => ({
    type: "p" as const,
    text: chunk.replace(/\n/g, " ").trim(),
  }));
  if (!blocks.length) throw new Error("This text file appears to be empty.");
  const bytes = await renderBlocksToPdf(blocks, { ...opts, fontSize: Number(opts.fontSize || 11), title: baseName(file.name) }, (s, p) => ctx.report(s, p));
  return {
    outputs: [{ name: `${baseName(file.name)}.pdf`, blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }) }],
    message: "Plain text converted into a paginated PDF.",
  };
};

export const pdfToWordEngine: Engine = async (files, _opts, ctx) => {
  const file = files[0];
  ctx.report("Analyzing document...", 10);
  const { doc, numPages } = await openPdf(file);
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");

  const allHeights: number[] = [];
  const pagesLines: string[][] = [];
  const pagesMeta: Array<Array<{ text: string; h: number }>> = [];

  for (let i = 1; i <= numPages; i++) {
    ctx.report(`Extracting text... (${i}/${numPages})`, 10 + Math.round((i / numPages) * 60));
    const lines = await extractTextLines(doc, i);
    const meta = lines.map((l) => ({ text: lineText(l), h: median(l.items.map((it) => it.height)) }));
    pagesMeta.push(meta);
    meta.forEach((m) => m.text && allHeights.push(m.h));
  }

  const bodySize = median(allHeights);

  for (const meta of pagesMeta) {
    const paras: string[] = [];
    let buf = "";
    for (const m of meta) {
      if (!m.text) continue;
      buf += (buf ? " " : "") + m.text;
      const endsSentence = /[.!?:;\u201D\u2019)\]]$/.test(m.text);
      if (endsSentence || m.text.length < 25) {
        paras.push(buf);
        buf = "";
      }
    }
    if (buf) paras.push(buf);
    pagesLines.push(paras);
  }

  ctx.report("Building Word document...", 80);
  const children: Array<InstanceType<typeof Paragraph>> = [];
  for (let p = 0; p < pagesLines.length; p++) {
    for (const para of pagesLines[p]) {
      children.push(new Paragraph({ children: [new TextRun(para)], spacing: { after: 160 } }));
    }
    if (p < pagesLines.length - 1) {
      children.push(new Paragraph({ text: "", pageBreakBefore: true }));
    }
  }

  const docx = new Document({
    creator: "PDFForge",
    title: baseName(file.name),
    sections: [{ properties: {}, children }],
  });

  ctx.report("Generating output...", 92);
  const blob = await Packer.toBlob(docx);
  return {
    outputs: [{ name: `${baseName(file.name)}.docx`, blob }],
    message:
      numPages > 0 && pagesMeta.flat().length > 0
        ? `Extracted ${pagesMeta.flat().length} paragraphs across ${numPages} pages. Layout is reconstructed as flowing text — perfect for editing. Scanned PDFs need OCR instead.`
        : "Very little text was found. If this is a scanned document, use PDF OCR instead.",
  };
};

export const pptxToPdfEngine: Engine = async (files, _opts, ctx) => {
  const file = files[0];
  ctx.report("Analyzing document...", 15);
  const { PDFDocument, StandardFonts, rgb } = await import("@cantoo/pdf-lib");
  const JSZip = (await import("jszip")).default;

  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const presFile = zip.file("ppt/presentation.xml");
  let slideW = 960;
  let slideH = 540;
  if (presFile) {
    const xml = await presFile.async("string");
    const m = xml.match(/<p:sldSz[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
    if (m) {
      slideW = parseInt(m[1], 10) / 12700;
      slideH = parseInt(m[2], 10) / 12700;
    }
  }

  const slideEntries = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)![1], 10);
      const nb = parseInt(b.match(/slide(\d+)/)![1], 10);
      return na - nb;
    });
  if (!slideEntries.length) throw new Error("No slides found. Is this a valid .pptx file?");

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const sanitize = (s: string) =>
    s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, "-").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

  for (let i = 0; i < slideEntries.length; i++) {
    ctx.report(`Converting slides... (${i + 1}/${slideEntries.length})`, 15 + Math.round((i / slideEntries.length) * 70));
    const xml = await zip.file(slideEntries[i])!.async("string");
    const paras = Array.from(xml.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g))
      .map((m) => Array.from(m[1].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)).map((t) => t[1]).join(""))
      .map((t) => sanitize(t).trim())
      .filter(Boolean);

    const page = doc.addPage([slideW, slideH]);
    page.drawRectangle({ x: 0, y: slideH - 8, width: slideW, height: 8, color: rgb(0.39, 0.42, 0.95) });
    page.drawRectangle({ x: 0, y: slideH - 8, width: slideW * 0.28, height: 8, color: rgb(0.65, 0.34, 0.96) });

    let y = slideH - 70;
    paras.forEach((text, idx) => {
      const isTitle = idx === 0;
      const size = isTitle ? Math.max(22, Math.min(36, slideW / 32)) : Math.max(13, Math.min(18, slideW / 58));
      const f = isTitle ? bold : font;
      const maxWidth = slideW - 120;
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        const test = cur ? cur + " " + w : w;
        if (f.widthOfTextAtSize(test, size) <= maxWidth) cur = test;
        else {
          if (cur) lines.push(cur);
          cur = w;
        }
      }
      if (cur) lines.push(cur);
      lines.slice(0, isTitle ? 2 : 8).forEach((ln) => {
        y -= size * 1.3;
        if (y > 40) {
          page.drawText(ln, {
            x: isTitle ? 60 : 84,
            y,
            size,
            font: f,
            color: isTitle ? rgb(0.1, 0.12, 0.2) : rgb(0.28, 0.31, 0.4),
          });
        }
      });
      y -= isTitle ? size * 0.7 : size * 0.35;
    });
  }

  ctx.report("Generating output...", 92);
  const bytes = await doc.save({ useObjectStreams: true });
  return {
    outputs: [{ name: `${baseName(file.name)}.pdf`, blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }) }],
    message: `${slideEntries.length} slides converted. Slide titles and bullet text are preserved.`,
  };
};

export const pdfToPptEngine: Engine = async (files, _opts, ctx) => {
  const file = files[0];
  ctx.report("Analyzing document...", 8);
  const { openPdf, renderPageToCanvas, canvasToBlob } = await import("@/lib/pdf/render");
  const { doc, numPages } = await openPdf(file);

  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "PF169", width: 13.333, height: 7.5 });
  pptx.layout = "PF169";
  pptx.author = "PDFForge";
  pptx.title = baseName(file.name);

  for (let i = 1; i <= numPages; i++) {
    ctx.report(`Rendering pages... (${i}/${numPages})`, 8 + Math.round((i / numPages) * 78));
    const canvas = await renderPageToCanvas(doc, i, 2);
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.85);
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    const slide = pptx.addSlide();
    slide.addImage({ data: dataUrl, x: 0, y: 0, w: 13.333, h: 7.5 });
  }

  ctx.report("Generating output...", 90);
  const blob = (await pptx.write({ outputType: "blob" })) as Blob;
  return {
    outputs: [{ name: `${baseName(file.name)}.pptx`, blob }],
    message: `${numPages} slides created \u2014 each PDF page is embedded full-frame so your deck matches the original visually.`,
  };
};

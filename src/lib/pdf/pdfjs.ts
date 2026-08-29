"use client";

type Pdfjs = typeof import("pdfjs-dist");
export type PdfDoc = Awaited<ReturnType<Pdfjs["getDocument"]>["promise"]>;

let cached: Pdfjs | null = null;

export async function getPdfjs(): Promise<Pdfjs> {
  if (!cached) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    cached = pdfjs;
  }
  return cached;
}

export type PdfjsModule = Pdfjs;

export async function loadPdfDoc(data: Uint8Array, password?: string): Promise<PdfDoc> {
  const pdfjs = await getPdfjs();
  const task = pdfjs.getDocument({ data: data.slice(0), password, isEvalSupported: false });
  return task.promise;
}

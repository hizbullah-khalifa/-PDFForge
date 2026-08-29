import { NextResponse } from "next/server";
import { PDFDocument } from "@cantoo/pdf-lib";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const files = form.getAll("files[]").filter((f): f is File => f instanceof File);
    if (files.length < 2) {
      return NextResponse.json(
        { error: { code: "invalid_request", message: "Provide at least two PDFs under files[]" } },
        { status: 400 }
      );
    }

    const out = await PDFDocument.create();
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let doc;
      try {
        doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      } catch {
        return NextResponse.json(
          { error: { code: "unsupported_media_type", message: `"${file.name}" is not a readable PDF` } },
          { status: 415 }
        );
      }
      const pages = await out.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => out.addPage(p));
    }
    out.setProducer("PDFForge API");

    const pdfBytes = await out.save({ useObjectStreams: true });
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="merged.pdf"',
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "processing_failed", message: "Unexpected server error while merging" } },
      { status: 422 }
    );
  }
}

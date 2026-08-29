import type { Engine } from "./base";
import { readFileBuffer, baseName } from "@/lib/utils";
import { openPdf, renderPageToCanvas, canvasToBlob } from "@/lib/pdf/render";

function toBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export const protectEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  const pw = String(opts.password || "");
  if (pw.length < 4) throw new Error("Password must be at least 4 characters.");
  if (opts.confirm !== undefined && opts.confirm !== pw)
    throw new Error("Passwords do not match. Please re-enter them.");

  ctx.report("Analyzing document...", 20);
  const bytes = await readFileBuffer(file);
  const { PDFDocument } = await import("@cantoo/pdf-lib");
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  ctx.report("Encrypting...", 60);
  const anyDoc = doc as unknown as {
    encrypt?: (o: Record<string, unknown>) => Promise<void> | void;
  };
  if (typeof anyDoc.encrypt !== "function") {
    throw new Error("Encryption engine unavailable in this browser build. Please try the latest Chrome or Edge.");
  }
  await anyDoc.encrypt({
    userPassword: pw,
    ownerPassword: String(opts.ownerPassword || pw + "-owner"),
    permissions: {
      printing: opts.allowPrinting === false ? false : "highResolution",
      modifying: !!opts.allowModifying,
      copying: !!opts.allowCopying,
    },
  });

  ctx.report("Generating output...", 90);
  const outBytes = await doc.save({ useObjectStreams: true });
  return {
    outputs: [{ name: `${baseName(file.name)}-protected.pdf`, blob: toBlob(outBytes) }],
    message:
      "Your PDF is now encrypted with AES-style password protection. Keep the password safe \u2014 it cannot be recovered.",
  };
};

export const unlockEngine: Engine = async (files, opts, ctx) => {
  const file = files[0];
  const password = String(opts.password || "");

  ctx.report("Verifying password...", 15);
  let doc;
  try {
    ({ doc } = await openPdf(file, password));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/password/i.test(msg))
      throw new Error(
        password
          ? "That password did not work. Please check it and try again."
          : "This PDF is encrypted. Enter the password you use to open it."
      );
    throw err;
  }

  ctx.report("Decrypting pages...", 30);
  const { PDFDocument } = await import("@cantoo/pdf-lib");
  const out = await PDFDocument.create();

  for (let i = 1; i <= doc.numPages; i++) {
    ctx.report(`Rebuilding pages... (${i}/${doc.numPages})`, 30 + Math.round((i / doc.numPages) * 55));
    const canvas = await renderPageToCanvas(doc, i, 2);
    const jpg = await canvasToBlob(canvas, "image/jpeg", 0.92);
    const img = await out.embedJpg(await jpg.arrayBuffer());
    const page = out.addPage([canvas.width, canvas.height]);
    page.drawImage(img, { x: 0, y: 0, width: canvas.width, height: canvas.height });
  }

  ctx.report("Generating output...", 92);
  const bytes = await out.save({ useObjectStreams: true });
  return {
    outputs: [{ name: `${baseName(file.name)}-unlocked.pdf`, blob: toBlob(bytes) }],
    message:
      "Password removed. The unlocked copy is a high-quality flattened rebuild (text becomes non-selectable). You should only unlock documents you are authorized to access.",
  };
};

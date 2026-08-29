import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, "..", "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const destDir = join(root, "..", "public");
const dest = join(destDir, "pdf.worker.min.mjs");

if (existsSync(src)) {
  mkdirSync(destDir, { recursive: true });
  copyFileSync(src, dest);
  console.log("[pdfforge] pdf.js worker copied to public/");
} else if (!existsSync(dest)) {
  console.warn("[pdfforge] pdf.worker.min.mjs not found; viewer may not work until installed");
}

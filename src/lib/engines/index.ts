import type { Engine } from "./base";
import {
  mergeEngine,
  splitEngine,
  extractPagesEngine,
  deletePagesEngine,
  rotateEngine,
  reorderEngine,
} from "./organize";
import { compressEngine, pdfToImagesEngine, imagesToPdfEngine } from "./optimize-images";
import {
  wordToPdfEngine,
  pdfToWordEngine,
  pptxToPdfEngine,
  pdfToPptEngine,
  htmlToPdfEngine,
  textToPdfEngine,
} from "./office";
import { pdfToExcelEngine, excelToPdfEngine } from "./sheets";
import { protectEngine, unlockEngine } from "./security";
import { watermarkEngine, pageNumbersEngine } from "./annotate";
import {
  ocrEngine,
  pdfToTextEngine,
  extractImagesEngine,
  compareEngine,
  metadataEngine,
} from "./misc";

export const ENGINES: Record<string, Engine> = {
  merge: mergeEngine,
  split: splitEngine,
  extract: extractPagesEngine,
  "delete-pages": deletePagesEngine,
  rotate: rotateEngine,
  reorder: reorderEngine,
  compress: compressEngine,
  "pdf-to-images": pdfToImagesEngine,
  "images-to-pdf": imagesToPdfEngine,
  "word-to-pdf": wordToPdfEngine,
  "pdf-to-word": pdfToWordEngine,
  "pptx-to-pdf": pptxToPdfEngine,
  "pdf-to-ppt": pdfToPptEngine,
  "pdf-to-excel": pdfToExcelEngine,
  "excel-to-pdf": excelToPdfEngine,
  "html-to-pdf": htmlToPdfEngine,
  "text-to-pdf": textToPdfEngine,
  protect: protectEngine,
  unlock: unlockEngine,
  watermark: watermarkEngine,
  "page-numbers": pageNumbersEngine,
  ocr: ocrEngine,
  "pdf-to-text": pdfToTextEngine,
  "extract-images": extractImagesEngine,
  compare: compareEngine,
  metadata: metadataEngine,
};

export type { Engine, EngineResult, OutputFile, ToolPreview } from "./base";

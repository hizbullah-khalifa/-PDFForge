import type { Metadata } from "next";
import { PdfEditor } from "@/components/editor/pdf-editor";

export const metadata: Metadata = {
  title: "Edit PDF — Visual Online PDF Editor",
  description:
    "Edit PDF files online: add text, draw, highlight, place shapes and images, sign and erase with undo/redo. Free browser-based PDF editor.",
};

export default function EditorPage() {
  return (
    <div className="container-p py-10">
      <header className="mb-6 text-center">
        <p className="kicker">VISUAL WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">PDF Editor</h1>
        <p className="mx-auto mt-2 max-w-lg text-slate-500 dark:text-slate-400">
          Add text, draw, highlight, stamp shapes and images — then export a flattened PDF.
        </p>
      </header>
      <PdfEditor />
    </div>
  );
}

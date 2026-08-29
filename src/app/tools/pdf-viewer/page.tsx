import type { Metadata } from "next";
import { PdfViewer } from "@/components/viewer/pdf-viewer";

export const metadata: Metadata = {
  title: "PDF Viewer — Read, Search & Print PDFs Online",
  description:
    "A professional in-browser PDF viewer with thumbnails, zoom, search, rotate, fullscreen, printing and keyboard shortcuts.",
};

export default function ViewerPage() {
  return (
    <div className="container-p max-w-6xl py-8">
      <header className="mb-5 text-center">
        <p className="kicker">READING MODE</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">PDF Viewer</h1>
      </header>
      <PdfViewer />
      <p className="mt-4 text-center text-xs text-slate-400">
        Shortcuts: Ctrl+F search · Ctrl +/− zoom · ← → page navigation
      </p>
    </div>
  );
}

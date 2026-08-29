import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About PDFForge",
  description: "Why we built a local-first PDF workspace and where the platform is heading.",
};

export default function AboutPage() {
  return (
    <div className="container-p max-w-3xl py-14">
      <p className="kicker">ABOUT</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">
        Documents deserve <span className="gradient-text">better tools.</span>
      </h1>

      <div className="prose-p mt-8 space-y-5 leading-relaxed text-slate-500 dark:text-slate-400">
        <p>
          PDFForge started with a simple frustration: getting a scanned page into Word, or squeezing a thesis under an
          email limit, meant uploading private documents to random websites full of ads and waiting rooms.
        </p>
        <p>
          Modern browsers changed what&apos;s possible. WebAssembly engines like pdf.js, pdf-lib and Tesseract now match
          desktop software for most everyday jobs. So we built one cohesive workspace where every tool shares the same
          upload system, progress pipeline, result panel and history — running entirely on your hardware.
        </p>
        <h2 className="pt-4 text-xl font-extrabold text-slate-800 dark:text-slate-100">Principles</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-slate-700 dark:text-slate-200">Local first:</strong> your files are not our business model.</li>
          <li><strong className="text-slate-700 dark:text-slate-200">Real engineering:</strong> no fake buttons — every tool runs a genuine pipeline with honest error messages.</li>
          <li><strong className="text-slate-700 dark:text-slate-200">Modular core:</strong> each tool is an isolated engine behind a shared registry, so adding capabilities never destabilizes others.</li>
          <li><strong className="text-slate-700 dark:text-slate-200">Accessible speed:</strong> keyboard shortcuts, screen-reader labels, mobile-first layouts.</li>
        </ul>
        <h2 className="pt-4 text-xl font-extrabold text-slate-800 dark:text-slate-100">What&apos;s next</h2>
        <p>
          Team workspaces, a public REST API, more OCR languages, and server-side rendering pipelines for
          enterprise-scale batch conversion. See the <Link href="/docs" className="font-semibold text-brand-500 hover:underline">API documentation</Link> for a preview.
        </p>
      </div>
    </div>
  );
}

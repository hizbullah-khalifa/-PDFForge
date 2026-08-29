import type { Metadata } from "next";
import Link from "next/link";
import { ToolCard } from "@/components/tool-card";
import { CATEGORIES, TOOLS, toolsByCategory } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "All PDF Tools — 42 Free Online PDF Utilities",
  description:
    "Browse the complete PDFForge toolbox: convert, organize, optimize, edit, secure and extract from PDF files. All tools free, private and browser-based.",
};

export default function ToolsPage() {
  return (
    <div className="container-p py-14">
      <div className="mb-12 text-center">
        <p className="kicker">TOOL DIRECTORY</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
          Every tool you need. <span className="gradient-text">Zero fluff.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-500 dark:text-slate-400">
          {TOOLS.length} professional-grade utilities that run privately inside your browser.
        </p>
      </div>

      <div className="mb-10 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((c) => (
          <a key={c.id} href={`#${c.id}`} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold transition hover:border-brand-400 hover:text-brand-500">
            {c.icon} {c.label}
          </a>
        ))}
      </div>

      {CATEGORIES.map((cat) => (
        <section key={cat.id} id={cat.id} className="mb-16 scroll-mt-24">
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-extrabold">
                <span aria-hidden>{cat.icon}</span> {cat.label}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{cat.blurb}</p>
            </div>
            <span className="shrink-0 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-500">
              {toolsByCategory(cat.id).length} tools
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {toolsByCategory(cat.id).map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      ))}

      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
        <h2 className="text-lg font-bold">Need something custom?</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The PDFForge API brings every tool to your own product.
        </p>
        <Link href="/docs" className="btn-primary mt-4">Read API Docs</Link>
      </div>
    </div>
  );
}

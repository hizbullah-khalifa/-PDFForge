import Link from "next/link";
import type { Metadata } from "next";
import { HomeDropzone } from "@/components/home-dropzone";
import { ToolCard } from "@/components/tool-card";
import { CATEGORIES, TOOLS, popularTools, toolHref } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "PDFForge — Every PDF Tool. One Powerful Workspace.",
  description:
    "Convert, compress, merge, edit, protect, and manage your documents in seconds. Free, private, browser-based PDF tools.",
};

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden pb-16 pt-20 sm:pt-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(700px 420px at 80% -10%, rgba(99,102,241,.16), transparent), radial-gradient(600px 380px at 8% 100%, rgba(168,85,247,.12), transparent)",
          }}
        />
        <div className="container-p relative text-center">
          <span className="badge-p mb-5 inline-block rounded-full bg-brand-500/10 px-4 py-1.5 text-sm font-semibold text-brand-500 dark:text-brand-300">
            ⚡ 42 free tools · no signup required · files never leave your device
          </span>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-black leading-[1.08] tracking-tight sm:text-6xl">
            Every PDF Tool.
            <br />
            <span className="gradient-text">One Powerful Workspace.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-500 dark:text-slate-400">
            Convert, compress, merge, edit, protect, and manage your documents in seconds.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/tools" className="btn-primary px-8 py-3.5 text-base">Start Using PDFForge</Link>
            <Link href="#tools-preview" className="btn-ghost px-8 py-3.5 text-base">Explore PDF Tools</Link>
          </div>

          <div className="mt-12">
            <HomeDropzone />
          </div>
        </div>
      </section>

      <section id="tools-preview" className="container-p py-14">
        <div className="mb-10 text-center">
          <p className="kicker">MOST LOVED</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Popular right now</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularTools().slice(0, 8).map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="bg-[var(--card)] py-16">
        <div className="container-p">
          <div className="mb-10 text-center">
            <p className="kicker">TOOLBOX</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{TOOLS.length} tools across 6 categories</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/tools#${cat.id}`}
                className="group card-p flex items-start gap-4 p-6 transition-all hover:-translate-y-1 hover:border-brand-400/60"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-2xl" aria-hidden>{cat.icon}</span>
                <span>
                  <span className="flex items-center gap-2 font-bold group-hover:text-brand-500">
                    {cat.label}
                    <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-bold text-brand-500">
                      {TOOLS.filter((t) => t.category === cat.id).length}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-500 dark:text-slate-400">{cat.blurb}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-p py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["🔒", "Private by design", "Every tool runs locally in your browser via WebAssembly. Files are never uploaded."],
            ["⚡", "Instant results", "No queues, no waiting rooms. Processing starts the moment you drop a file."],
            ["🆓", "Free at the core", "The everyday tools you need are free forever — generous limits, no watermarks."],
            ["📱", "Works everywhere", "Phone, tablet, desktop. Full experience without installing anything."],
          ].map(([icon, title, body]) => (
            <div key={title} className="card-p p-6">
              <span className="text-3xl" aria-hidden>{icon}</span>
              <h3 className="mt-3 font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-8 pt-4">
        <div className="container-p">
          <div className="cta-band relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-purple-600 p-10 text-center text-white sm:p-16">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Work Smarter With Every PDF.</h2>
            <p className="mx-auto mt-3 max-w-md text-white/85">
              Join thousands of students, professionals and teams who forge documents the fast way.
            </p>
            <Link href={toolHref(popularTools()[0] || TOOLS[0])} className="btn-light mt-7 px-8 py-3.5 text-base">
              Try It Free Now →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolWorkspace } from "@/components/workflow/workspace";
import { FaqList } from "@/components/faq";
import { ToolCard } from "@/components/tool-card";
import { CATEGORIES, SPECIAL_TOOL_SLUGS, TOOLS, getTool, relatedTools, toolHref } from "@/lib/tools/registry";

interface Params {
  params: { tool: string };
}

export function generateStaticParams() {
  return TOOLS.filter((t) => !SPECIAL_TOOL_SLUGS.has(t.slug)).map((t) => ({ tool: t.slug }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: Params): Metadata {
  const tool = getTool(params.tool);
  if (!tool || SPECIAL_TOOL_SLUGS.has(tool.slug)) return {};
  return {
    title: `${tool.name} — Free Online ${tool.name} Tool`,
    description: tool.tagline + " " + tool.description.slice(0, 110),
    keywords: tool.keywords,
    openGraph: {
      title: `${tool.name} | PDFForge`,
      description: tool.tagline,
      type: "website",
    },
    alternates: { canonical: `/tools/${tool.slug}` },
  };
}

export default function ToolPage({ params }: Params) {
  const tool = getTool(params.tool);
  if (!tool || SPECIAL_TOOL_SLUGS.has(tool.slug)) notFound();

  const category = CATEGORIES.find((c) => c.id === tool.category)!;
  const related = relatedTools(tool);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `${tool.name} — PDFForge`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any (Web Browser)",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: tool.description,
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to ${tool.name.toLowerCase()} online`,
      step: tool.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
    },
    ...(tool.faqs.length
      ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: tool.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }]
      : []),
  ];

  return (
    <div className="container-p max-w-4xl py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-400">
        <Link href="/" className="hover:text-brand-500">Home</Link>
        <span aria-hidden>/</span>
        <Link href="/tools" className="hover:text-brand-500">Tools</Link>
        <span aria-hidden>/</span>
        <Link href={`/tools#${tool.category}`} className="hover:text-brand-500">{category.label}</Link>
        <span aria-hidden>/</span>
        <span className="text-slate-600 dark:text-slate-300">{tool.name}</span>
      </nav>

      <header className="mb-8 flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 text-2xl shadow-lg shadow-brand-500/30" aria-hidden>
          {tool.icon}
        </span>
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{tool.name}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{tool.tagline}</p>
        </div>
      </header>

      <ToolWorkspace tool={tool} />

      <section className="prose-p mt-14 max-w-none">
        <h2 className="text-xl font-extrabold">About the {tool.name}</h2>
        <p className="mt-3 leading-relaxed text-slate-500 dark:text-slate-400">{tool.description}</p>

        <h2 className="mt-10 text-xl font-extrabold">How to use</h2>
        <ol className="mt-4 space-y-3">
          {tool.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        {tool.faqs.length > 0 && (
          <>
            <h2 className="mt-10 text-xl font-extrabold">Frequently asked questions</h2>
            <div className="mt-4">
              <FaqList items={tool.faqs} />
            </div>
          </>
        )}
      </section>

      <section className="mt-14">
        <h2 className="mb-5 text-xl font-extrabold">Related tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>
      </section>

      <div className="mt-12 rounded-2xl bg-brand-500/10 p-6 text-center">
        <p className="font-semibold">Need to view, read or print your result?</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Link href="/tools/pdf-viewer" className="btn-ghost !py-2 text-sm">Open PDF Viewer</Link>
          <Link href="/tools/pdf-editor" className="btn-ghost !py-2 text-sm">Open Editor</Link>
          <Link href={toolHref(getTool("merge-pdf")!)} className="btn-ghost !py-2 text-sm">Merge more files</Link>
        </div>
      </div>
    </div>
  );
}

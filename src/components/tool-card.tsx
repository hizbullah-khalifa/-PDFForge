"use client";

import Link from "next/link";
import type { ToolDef } from "@/lib/tools/types";
import { CATEGORIES } from "@/lib/tools/registry";

const CAT_ACCENT: Record<string, string> = {
  convert: "from-sky-500 to-blue-600",
  organize: "from-violet-500 to-purple-600",
  optimize: "from-amber-500 to-orange-600",
  edit: "from-pink-500 to-rose-600",
  security: "from-emerald-500 to-teal-600",
  other: "from-indigo-500 to-blue-600",
};

export function ToolCard({ tool }: { tool: ToolDef }) {
  const cat = CATEGORIES.find((c) => c.id === tool.category);
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group card-p relative flex flex-col gap-3 overflow-hidden p-5 transition-all hover:-translate-y-1 hover:border-brand-400/60 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
    >
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100 ${CAT_ACCENT[tool.category]}`} aria-hidden />
      <div className="flex items-start justify-between">
        <span className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-xl shadow-md ${CAT_ACCENT[tool.category]}`} aria-hidden>
          {tool.icon}
        </span>
        {tool.popular && (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Popular
          </span>
        )}
      </div>
      <div>
        <h3 className="font-bold leading-snug group-hover:text-brand-500">{tool.name}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{tool.tagline}</p>
      </div>
      <span className="mt-auto pt-1 text-xs font-semibold text-slate-400">{cat?.label} →</span>
    </Link>
  );
}

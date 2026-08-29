import Link from "next/link";
import { Logo } from "./logo";
import { CATEGORIES, TOOLS } from "@/lib/tools/registry";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--border)] bg-[var(--card)]">
      <div className="container-p grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo size="sm" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Work Smarter With Every PDF. Convert, edit, organize and protect documents — processed privately in your browser.
          </p>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Local-first processing
          </p>
        </div>
        {[CATEGORIES.slice(0, 3), CATEGORIES.slice(3)].map((cats, i) => (
          <div key={i} className={i === 0 ? "contents md:block" : "contents md:hidden"}>
            {cats.map((cat) => (
              <div key={cat.id} className={i === 0 ? "md:hidden" : "hidden md:block"}>
                <p className="mb-3 text-sm font-bold">{cat.label}</p>
                <ul className="space-y-1.5">
                  {TOOLS.filter((t) => t.category === cat.id)
                    .slice(0, 6)
                    .map((t) => (
                      <li key={t.slug}>
                        <Link href={`/tools/${t.slug}`} className="text-sm text-slate-500 transition hover:text-brand-500 dark:text-slate-400">
                          {t.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
        <div>
          <p className="mb-3 text-sm font-bold">Company</p>
          <ul className="space-y-1.5">
            {[
              ["All Tools", "/tools"],
              ["Pricing", "/pricing"],
              ["Dashboard", "/dashboard"],
              ["My Files", "/history"],
              ["API Docs", "/docs"],
              ["About", "/about"],
              ["Privacy", "/privacy"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="text-sm text-slate-500 transition hover:text-brand-500 dark:text-slate-400">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--border)] py-5">
        <p className="container-p text-center text-xs text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} PDFForge · Work Smarter With Every PDF · Built with Next.js By Hizbullah Khalifa
        </p>
      </div>
    </footer>
  );
}

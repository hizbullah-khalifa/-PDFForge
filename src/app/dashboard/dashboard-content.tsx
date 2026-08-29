"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { getAuthSnapshot, subscribeAuth } from "@/lib/stores/auth";
import { getHistorySnapshot, subscribeHistory } from "@/lib/stores/history";
import { formatBytes } from "@/lib/utils";
import { popularTools } from "@/lib/tools/registry";

export function DashboardContent() {
  const user = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => null);
  const history = useSyncExternalStore(subscribeHistory, getHistorySnapshot, () => []);

  const stats = useMemo(() => {
    const done = history.filter((h) => h.status === "done");
    const conversions = done.filter((h) => h.toolSlug.includes("to-") || ["pdf-to-word", "word-to-pdf", "excel-to-pdf"].includes(h.toolSlug)).length;
    return {
      processed: done.length,
      storage: done.reduce((s, h) => s + h.sizeOut, 0),
      conversions,
      recent: done.slice(0, 5),
    };
  }, [history]);

  const toolCounts = useMemo(() => {
    const counts = new Map<string, { name: string; slug: string; n: number }>();
    history.forEach((h) => {
      const cur = counts.get(h.toolSlug) || { name: h.tool, slug: h.toolSlug, n: 0 };
      counts.set(h.toolSlug, { ...cur, n: cur.n + 1 });
    });
    return [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 6);
  }, [history]);

  const suggestions = useMemo(() => popularTools().slice(0, 4), []);

  return (
    <div className="container-p max-w-6xl py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">OVERVIEW</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            Hey {user?.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Here is your workspace at a glance.</p>
        </div>
        <Link href="/tools" className="btn-primary">+ New job</Link>
      </header>

      <section aria-label="Usage statistics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Files Processed", String(stats.processed), "📄"],
          ["Storage Used", stats.storage > 0 ? formatBytes(stats.storage) : "—", "💾"],
          ["Conversions", String(stats.conversions), "🔄"],
          ["Recent Files", String(stats.recent.length), "🕒"],
        ].map(([label, value, icon]) => (
          <div key={label} className="card-p p-5">
            <span className="text-xl" aria-hidden>{icon}</span>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="card-p p-6" aria-label="Recent activity">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold">Recent activity</h2>
            <Link href="/history" className="text-sm font-semibold text-brand-500 hover:underline">My Files →</Link>
          </div>
          {stats.recent.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-slate-400">
              Nothing yet — your finished jobs will appear here.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {stats.recent.map((h) => (
                <li key={h.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/10 text-sm" aria-hidden>✓</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{h.outName}</span>
                    <span className="text-xs text-slate-400">{h.tool} · {new Date(h.date).toLocaleString()}</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-500">{formatBytes(h.sizeOut)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-p p-6" aria-label="Frequently used tools">
          <h2 className="mb-4 font-extrabold">Frequently used</h2>
          {toolCounts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-slate-400">
              Your top tools will rank here as you work.
            </p>
          ) : (
            <ul className="space-y-2">
              {toolCounts.map((t) => (
                <li key={t.slug}>
                  <Link href={`/tools/${t.slug}`} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-brand-500/10">
                    <span className="font-medium">{t.name}</span>
                    <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-bold text-brand-500">{t.n}×</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <hr className="my-4 border-[var(--border)]" />
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Suggested next</h3>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.filter((s) => !toolCounts.some((t) => t.slug === s.slug)).slice(0, 4).map((s) => (
              <Link key={s.slug} href={`/tools/${s.slug}`} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold transition hover:border-brand-400 hover:text-brand-500">
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

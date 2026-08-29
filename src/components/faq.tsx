interface FaqItem {
  q: string;
  a: string;
}

export function FaqList({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-3">
      {items.map((f) => (
        <details key={f.q} className="card-p group overflow-hidden px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
            {f.q}
            <span className="shrink-0 text-brand-500 transition-transform group-open:rotate-45" aria-hidden>+</span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

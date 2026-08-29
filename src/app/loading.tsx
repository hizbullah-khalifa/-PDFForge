export default function Loading() {
  return (
    <div className="container-p py-24" role="status" aria-live="polite">
      <div className="mx-auto max-w-2xl space-y-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <p className="sr-only">Loading page…</p>
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-p max-w-md py-28 text-center">
      <span className="text-6xl" aria-hidden>📄</span>
      <h1 className="mt-5 text-3xl font-black tracking-tight">404 — Page not forged</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        This page doesn&apos;t exist, but every PDF tool does.
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <Link href="/" className="btn-primary">Go home</Link>
        <Link href="/tools" className="btn-ghost">Browse tools</Link>
      </div>
    </div>
  );
}

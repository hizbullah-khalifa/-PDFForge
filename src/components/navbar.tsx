"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { CATEGORIES, TOOLS, toolHref } from "@/lib/tools/registry";
import {
  getAuthSnapshot,
  initAuth,
  logout,
  subscribeAuth,
} from "@/lib/stores/auth";

function useUser() {
  useEffect(() => {
    initAuth();
  }, []);
  return useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => null);
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const user = useUser();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) {
        setAccountOpen(false);
        setToolsOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <header ref={navRef} className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur-xl">
      <div className="container-p flex h-16 items-center justify-between gap-3">
        <Link href="/" aria-label="PDFForge home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          <div className="relative">
            <button
              className="flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              onClick={() => setToolsOpen((v) => !v)}
              aria-expanded={toolsOpen}
            >
              Tools
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition ${toolsOpen ? "rotate-180" : ""}`}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {toolsOpen && (
              <div className="absolute left-1/2 top-full mt-3 w-[min(920px,90vw)] -translate-x-1/2 animate-fadeUp rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lift">
                <div className="grid grid-cols-3 gap-x-6 gap-y-6">
                  {CATEGORIES.map((cat) => (
                    <div key={cat.id}>
                      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-500 dark:text-brand-400">
                        <span>{cat.icon}</span> {cat.label}
                      </p>
                      <ul className="space-y-1">
                        {TOOLS.filter((t) => t.category === cat.id)
                          .slice(0, 8)
                          .map((t) => (
                            <li key={t.slug}>
                              <Link
                                href={toolHref(t)}
                                onClick={() => setToolsOpen(false)}
                                className="block rounded-lg px-2 py-1 text-[13px] font-medium text-slate-600 transition hover:bg-brand-500/10 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300"
                              >
                                {t.name}
                              </Link>
                            </li>
                          ))}
                        {TOOLS.filter((t) => t.category === cat.id).length > 8 && (
                          <li>
                            <Link href="/tools" onClick={() => setToolsOpen(false)} className="px-2 text-[13px] font-semibold text-brand-500 hover:underline">
                              View all →
                            </Link>
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between rounded-xl bg-brand-500/10 px-4 py-2.5 text-sm">
                  <span className="font-medium text-slate-600 dark:text-slate-300">{TOOLS.length} tools · processed privately in your browser</span>
                  <Link href="/tools" className="font-bold text-brand-500 hover:underline" onClick={() => setToolsOpen(false)}>
                    Open directory →
                  </Link>
                </div>
              </div>
            )}
          </div>
          <Link href="/pricing" className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Pricing</Link>
          <Link href="/about" className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">About</Link>
          <Link href="/docs" className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Documentation</Link>
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {user ? (
            <div className="relative">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm font-semibold"
                aria-expanded={accountOpen}
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-[11px] font-bold text-white">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 animate-fadeUp overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] py-1 shadow-lift">
                  {[
                    ["Dashboard", "/dashboard"],
                    ["My Files", "/history"],
                    ["Settings", "/settings"],
                  ].map(([label, href]) => (
                    <Link key={href} href={href} onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-brand-500/10 hover:text-brand-600 dark:text-slate-300">
                      {label}
                    </Link>
                  ))}
                  <hr className="my-1 border-[var(--border)]" />
                  <button
                    onClick={() => {
                      logout();
                      setAccountOpen(false);
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-500/10"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:text-brand-500 sm:block dark:text-slate-300">
                Login
              </Link>
              <Link href="/signup" className="btn-primary hidden !py-2 text-sm sm:inline-flex">
                Sign up free
              </Link>
            </>
          )}

          <button
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu"
          >
            <span className={`h-0.5 w-4 rounded bg-current transition ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-4 rounded bg-current transition ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-4 rounded bg-current transition ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="animate-fadeUp border-t border-[var(--border)] bg-[var(--card)] lg:hidden" aria-label="Mobile">
          <div className="container-p max-h-[70vh] space-y-4 overflow-y-auto py-5">
            <details open>
              <summary className="cursor-pointer list-none text-sm font-bold uppercase tracking-wider text-slate-500">Tools</summary>
              <div className="mt-3 space-y-4">
                {CATEGORIES.map((cat) => (
                  <div key={cat.id}>
                    <p className="mb-1.5 text-xs font-bold text-brand-500">{cat.icon} {cat.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TOOLS.filter((t) => t.category === cat.id).map((t) => (
                        <Link
                          key={t.slug}
                          href={toolHref(t)}
                          onClick={() => setMobileOpen(false)}
                          className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium"
                        >
                          {t.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Link href="/pricing" onClick={() => setMobileOpen(false)} className="btn-ghost">Pricing</Link>
              <Link href="/about" onClick={() => setMobileOpen(false)} className="btn-ghost">About</Link>
              <Link href="/docs" onClick={() => setMobileOpen(false)} className="btn-ghost">Docs</Link>
            </div>
            {!user && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-ghost">Login</Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="btn-primary">Sign up free</Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

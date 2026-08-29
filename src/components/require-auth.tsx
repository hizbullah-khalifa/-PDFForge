"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getAuthSnapshot,
  initAuth,
  logout,
  subscribeAuth,
} from "@/lib/stores/auth";

export function RequireAuth({ children, page }: { children: React.ReactNode; page: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initAuth().finally(() => setReady(true));
  }, []);
  const user = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => null);

  if (!ready) {
    return (
      <div className="container-p max-w-md py-24 text-center text-sm text-slate-400" aria-live="polite">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-p max-w-md py-20 text-center">
        <span className="text-5xl" aria-hidden>🔐</span>
        <h1 className="mt-4 text-2xl font-black">{page} is a member space</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Create a free account to track processed files, storage and activity — or keep using every tool without an account.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/signup" className="btn-primary">Sign up free</Link>
          <Link href="/login" className="btn-ghost">Log in</Link>
          <Link href="/tools" className="btn-ghost">Just browse tools</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function LogoutButton() {
  return (
    <button onClick={() => logout()} className="btn-ghost !py-2 text-sm text-red-500 hover:!border-red-400 hover:text-red-500">
      Log out
    </button>
  );
}

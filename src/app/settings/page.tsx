"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { clearHistory } from "@/lib/stores/history";
import { getAuthSnapshot, initAuth, logout, subscribeAuth, updateProfile } from "@/lib/stores/auth";
import { LogoutButton } from "@/components/require-auth";

export default function SettingsPage() {
  const [ready, setReady] = useState(false);
  const user = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => null);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);

  useEffect(() => {
    initAuth().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  if (!ready) return <div className="container-p py-24 text-center text-sm text-slate-400">Loading…</div>;

  if (!user) {
    return (
      <div className="container-p max-w-md py-20 text-center">
        <h1 className="text-2xl font-black">You are not logged in</h1>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/login" className="btn-primary">Log in</Link>
          <Link href="/tools" className="btn-ghost">Browse tools</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-p max-w-2xl space-y-6 py-10">
      <header>
        <p className="kicker">ACCOUNT SETTINGS</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">{user.email}</h1>
      </header>

      <section className="card-p p-6" aria-label="Profile settings">
        <h2 className="mb-4 font-extrabold">Profile</h2>
        <label htmlFor="set-name" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Display name
        </label>
        <div className="flex gap-2">
          <input id="set-name" className="input-p" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
          <button
            onClick={() => {
              if (!name.trim()) return;
              updateProfile(name.trim());
              setSaved(true);
            }}
            className="btn-primary shrink-0"
          >
            Save
          </button>
        </div>
        {saved && <p className="mt-2 text-xs font-semibold text-emerald-500" role="status">Profile updated ✓</p>}
        <p className="mt-3 text-xs text-slate-400">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
      </section>

      <section className="card-p p-6" aria-label="Privacy controls">
        <h2 className="mb-2 font-extrabold">Data &amp; privacy</h2>
        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          PDFForge processes files locally in your browser. History and cached outputs live in this device&apos;s
          storage and are never transmitted to us. Deleting below removes them permanently from this device.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => { clearHistory(); }} className="btn-ghost !py-2 text-sm text-red-500 hover:!border-red-400 hover:text-red-500">
            Delete All History
          </button>
          {confirmWipe ? (
            <span className="flex items-center gap-2 text-sm">
              This also logs you out. Continue?
              <button
                onClick={() => {
                  clearHistory();
                  localStorage.removeItem("pf-users");
                  localStorage.removeItem("pf-signature");
                  logout();
                }}
                className="font-bold text-red-500 hover:underline"
              >
                Yes, wipe everything
              </button>
              <button onClick={() => setConfirmWipe(false)} className="text-slate-400 hover:underline">Cancel</button>
            </span>
          ) : (
            <button onClick={() => setConfirmWipe(true)} className="btn-ghost !py-2 text-sm text-red-500 hover:!border-red-400 hover:text-red-500">
              Wipe all local data
            </button>
          )}
        </div>
      </section>

      <section className="card-p flex flex-wrap items-center justify-between gap-4 p-6" aria-label="Session">
        <div>
          <h2 className="font-extrabold">Session</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Signed in as {user.email}</p>
        </div>
        <LogoutButton />
      </section>
    </div>
  );
}

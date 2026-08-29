"use client";

import { uid } from "@/lib/utils";

export interface HistoryEntry {
  id: string;
  fileName: string;
  outName: string;
  tool: string;
  toolSlug: string;
  date: string;
  status: "done" | "failed";
  sizeIn: number;
  sizeOut: number;
}

type Listener = () => void;
const KEY = "pf-history";
let entries: HistoryEntry[] | null = null;
const listeners = new Set<Listener>();

function load(): HistoryEntry[] {
  if (entries) return entries;
  try {
    entries = JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    entries = [];
  }
  return entries!;
}

function persist(): void {
  localStorage.setItem(KEY, JSON.stringify(entries));
  listeners.forEach((l) => l());
}

export function subscribeHistory(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getHistorySnapshot(): HistoryEntry[] {
  return load();
}

export function addHistory(e: Omit<HistoryEntry, "id" | "date">): HistoryEntry {
  const full: HistoryEntry = { ...e, id: uid(), date: new Date().toISOString() };
  entries = [full, ...load()].slice(0, 200);
  persist();
  return full;
}

export function renameHistory(id: string, outName: string): void {
  entries = load().map((e) => (e.id === id ? { ...e, outName } : e));
  persist();
}

export function deleteHistory(id: string): void {
  entries = load().filter((e) => e.id !== id);
  idbDelete(id).catch(() => {});
  persist();
}

export function clearHistory(): void {
  entries = [];
  idbClear().catch(() => {});
  persist();
}

export async function saveBlobForHistory(id: string, blob: Blob): Promise<void> {
  if (blob.size > 12 * 1024 * 1024) return;
  await idbPut(id, blob);
}

export async function loadBlobFromHistory(id: string): Promise<Blob | null> {
  return idbGet(id);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("pdfforge", 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("files")) req.result.createObjectStore("files");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function idbGet(key: string): Promise<Blob | null> {
  const db = await openDb();
  const out = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction("files", "readonly");
    const r = tx.objectStore("files").get(key);
    r.onsuccess = () => resolve((r.result as Blob) || null);
    r.onerror = () => reject(r.error);
  });
  db.close();
  return out;
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").delete(key);
    tx.oncomplete = () => resolve();
  });
  db.close();
}

async function idbClear(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").clear();
    tx.oncomplete = () => resolve();
  });
  db.close();
}

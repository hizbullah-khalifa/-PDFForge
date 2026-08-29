import type { Metadata } from "next";
import { HistoryTable } from "@/components/history-table";

export const metadata: Metadata = { title: "My Files — History", description: "Every document you processed with PDFForge on this device." };

export default function HistoryPage() {
  return (
    <div className="container-p max-w-5xl py-10">
      <header className="mb-7">
        <p className="kicker">MY FILES</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">File history</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          A private log of your jobs stored only in this browser. Download recent outputs, rename entries,
          share a summary, or delete anything instantly — you are always in control of your data.
        </p>
      </header>
      <HistoryTable />
    </div>
  );
}

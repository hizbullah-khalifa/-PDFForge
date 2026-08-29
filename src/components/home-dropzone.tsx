"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dropzone } from "@/components/uploader/dropzone";
import { validateFiles } from "@/lib/validators";
import { stageHandoff } from "@/lib/handoff";

const QUICK_ACTIONS = [
  { slug: "view", label: "View", icon: "👁️" },
  { slug: "compress-pdf", label: "Compress", icon: "🗜️" },
  { slug: "merge-pdf", label: "Merge", icon: "🗂️" },
  { slug: "pdf-to-word", label: "To Word", icon: "📝" },
  { slug: "pdf-to-jpg", label: "To JPG", icon: "🖼️" },
  { slug: "pdf-editor", label: "Edit", icon: "✍️" },
  { slug: "sign-pdf", label: "Sign", icon: "🖋️" },
  { slug: "protect-pdf", label: "Protect", icon: "🔒" },
];

export function HomeDropzone() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [issues, setIssues] = useState<ReturnType<typeof validateFiles>["issues"]>([]);

  const add = (incoming: File[]) => {
    const { accepted, issues: iss } = validateFiles(incoming, [".pdf"], true, 0, 5);
    setIssues(iss);
    if (accepted.length) {
      setFiles(accepted);
      stageHandoff(accepted);
    }
  };

  const go = (slug: string) => {
    if (!files.length) return;
    if (slug === "view") router.push("/tools/pdf-viewer");
    else router.push(`/tools/${slug}`);
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="card-p p-4 sm:p-5">
        {files.length === 0 ? (
          <Dropzone accept={[".pdf"]} multiple maxFiles={5} files={[]} onAdd={add} onRemove={() => {}} issues={issues} />
        ) : (
          <div className="animate-fadeUp">
            <div className="mb-4 flex items-center justify-between px-1">
              <p className="text-sm font-bold">
                {files.length === 1 ? files[0].name : `${files.length} PDFs ready`}
              </p>
              <button onClick={() => { setFiles([]); setIssues([]); }} className="text-xs font-semibold text-slate-400 hover:text-red-500">
                Clear ✕
              </button>
            </div>
            <p className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-slate-400">What next?</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.slug}
                  onClick={() => go(a.slug)}
                  className="flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] px-2 py-3 text-[11px] font-semibold transition hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-500"
                >
                  <span className="text-xl" aria-hidden>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
            {issues.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-red-500">
                {issues.map((i, k) => (
                  <li key={k}>⚠️ {i.file.name}: {i.reason}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-xs font-medium tracking-wide text-slate-400 dark:text-slate-500">
        PDF • DOCX • PPTX • XLSX • JPG • PNG
      </p>
    </div>
  );
}

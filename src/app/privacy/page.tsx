import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — Your Files Never Leave Your Device",
  description: "PDFForge is local-first: documents are processed in your browser. Learn exactly what is and isn't stored.",
};

export default function PrivacyPage() {
  return (
    <div className="container-p max-w-3xl py-14">
      <p className="kicker">PRIVACY</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Private by architecture.</h1>
      <p className="mt-3 text-lg leading-relaxed text-slate-500 dark:text-slate-400">
        Most online PDF tools upload your document to a server, process it, and ask you to trust their deletion policy.
        PDFForge was designed differently: the heavy work happens inside your own browser.
      </p>

      <div className="mt-10 space-y-6">
        {[
          {
            icon: "🔒",
            title: "Files are processed on your device",
            body: "Conversion engines (pdf-lib, pdf.js, Tesseract WASM) run as client-side code. When you merge, split, convert or sign a PDF, the bytes travel from your disk to your screen without touching any network server.",
          },
          {
            icon: "🗑️",
            title: "Temporary data lives briefly, locally",
            body: "Working copies exist only in memory (and small outputs in this device's IndexedDB for convenient re-download). Closing the tab clears working memory automatically.",
          },
          {
            icon: "🙋",
            title: "You control every stored record",
            body: "File history entries and cached outputs appear under My Files. Delete individual files or use Delete All History / Wipe all local data in Settings to remove everything permanently from the device.",
          },
          {
            icon: "🚫",
            title: "No public exposure of files",
            body: "There is no shared gallery, no public URLs, no third-party analytics attached to your documents. Outputs download straight to your machine.",
          },
          {
            icon: "⚖️",
            title: "Honest limitations",
            body: "We do not claim unverifiable guarantees. Because storage is on-device, clearing your browser data removes history; we cannot recover it for you, and we deliberately cannot read your documents even if you asked.",
          },
        ].map((s) => (
          <section key={s.title} className="card-p flex gap-4 p-6">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-xl" aria-hidden>{s.icon}</span>
            <div>
              <h2 className="font-extrabold">{s.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{s.body}</p>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 text-xs leading-relaxed text-slate-400">
        Full details: if you create an account, we store only your email, display name and a salted SHA-256 password hash
        in this device's local storage in the current release; production deployments replace this module with an
        authenticated backend of your choice. Contact: privacy@pdfforge.app
      </p>
    </div>
  );
}

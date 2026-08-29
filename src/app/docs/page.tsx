import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDFForge API — Integrate PDF Processing",
  description: "REST endpoints for PDF conversion, merge, compress and more. API keys, usage, errors and rate limits documented.",
};

const ENDPOINTS: Array<[string, string, string]> = [
  ["POST", "/api/pdf-to-word", "Convert a PDF document to DOCX"],
  ["POST", "/api/word-to-pdf", "Render a DOCX file to PDF"],
  ["POST", "/api/merge", "Merge multiple PDFs into one (live reference implementation)"],
  ["POST", "/api/compress", "Compress or optimize a PDF"],
  ["POST", "/api/pdf-to-image", "Rasterize pages to JPG/PNG"],
];

const ERRORS = [
  ["400", "invalid_request", "Missing file part, wrong field name, or malformed options"],
  ["401", "unauthorized", "Missing or invalid Authorization: Bearer <api key>"],
  ["413", "payload_too_large", "File exceeds your plan's size limit"],
  ["415", "unsupported_media_type", "The uploaded bytes are not a valid PDF"],
  ["422", "processing_failed", "Document could not be processed (encrypted, corrupted)"],
  ["429", "rate_limited", "Plan quota exceeded — check Retry-After header"],
];

export default function DocsPage() {
  return (
    <div className="container-p max-w-3xl py-14">
      <p className="kicker">DEVELOPERS</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">PDFForge API</h1>
      <p className="mt-3 text-lg leading-relaxed text-slate-500 dark:text-slate-400">
        Bring every PDFForge engine into your own application with a single authenticated call.
        Multipart in, binary out — no SDK required.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-extrabold">Authentication</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Create an API key from Settings → Developer after upgrading to Business. Keys are shown once — store them securely.
        </p>
        <pre className="card-p mt-3 overflow-x-auto p-4 text-xs leading-relaxed"><code>{`curl https://api.pdfforge.app/api/merge \\
  -H "Authorization: Bearer pf_live_••••••••" \\
  -F "files[]=@document-1.pdf" \\
  -F "files[]=@document-2.pdf" \\
  -o merged.pdf`}</code></pre>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-extrabold">Endpoints</h2>
        <div className="card-p mt-3 divide-y divide-[var(--border)] overflow-hidden">
          {ENDPOINTS.map(([method, path, desc]) => (
            <div key={path} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{method}</span>
              <code className="font-mono text-sm font-semibold">{path}</code>
              <span className="ml-auto text-right text-xs text-slate-400">{desc}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          The merge endpoint ships live with this deployment as the reference implementation; remaining routes follow the same contract.
        </p>
      </section>

      <section className="mt-10 grid gap-5 sm:grid-cols-3">
        {[
          ["Requests", 'Send multipart/form-data. PDFs use the field files[]. Options pass as plain fields, e.g. level=balanced.'],
          ["Responses", "Success returns application/octet-stream bytes (or JSON with ?meta=1). Content-Disposition carries the output filename."],
          ["Rate limits", "Free 25 req/h · Pro 300 req/h · Business 5,000 req/day. Limits return 429 with Retry-After seconds."],
        ].map(([t, d]) => (
          <div key={t} className="card-p p-5">
            <h3 className="font-bold">{t}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{d}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-extrabold">Errors</h2>
        <div className="card-p mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">HTTP</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {ERRORS.map(([code, name, desc]) => (
                <tr key={code} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2.5 font-mono font-bold">{code}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-brand-500">{name}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <pre className="card-p mt-4 overflow-x-auto p-4 text-xs leading-relaxed"><code>{`{
  "error": {
    "code": "rate_limited",
    "message": "Daily quota of 5000 requests reached.",
    "retry_after": 3600
  }
}`}</code></pre>
      </section>

      <div className="cta-band mt-12 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 p-8 text-center text-white">
        <h2 className="text-2xl font-extrabold">Ready to build?</h2>
        <p className="mt-1 text-white/85">Business plan includes 50k calls/month and a dedicated engineer.</p>
        <a href="/pricing" className="btn-light mt-5 inline-flex">See Business plan</a>
      </div>
    </div>
  );
}

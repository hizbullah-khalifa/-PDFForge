# PDFForge

**Every PDF Tool. One Powerful Workspace.** — Work Smarter With Every PDF.

A production-grade, local-first PDF productivity SaaS built with **Next.js 14 · React 18 · TypeScript · Tailwind CSS**.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production
```

## What's inside

- **42 tools** across Convert / Organize / Optimize / Edit / Security / More — every one runs a real processing pipeline:
  - Merge, split (ranges / every-N / extract), delete & extract pages, rotate, reorder — `@cantoo/pdf-lib`
  - Compress with Basic/Balanced/Maximum profiles + honest size-delta reporting
  - Word→PDF (mammoth → custom typesetter), PDF→Word (pdf.js text model → `docx`)
  - PPTX→PDF (OOXML slide reader), PDF→PPTX (`pptxgenjs`), Excel→PDF & PDF→Excel table detection (`xlsx`/SheetJS)
  - PDF↔JPG/PNG with ZIP bundling, HTML→PDF, Text→PDF, Images→PDF
  - Password protect/encrypt (`@cantoo/pdf-lib` encryption) and authorized unlock via decrypted rebuild
  - Watermarks (text/image, 9-grid placement), page numbers, metadata editor, compare, extract images
  - **OCR** in English / Urdu / Arabic via `tesseract.js` WASM — extensible language registry
  - Visual **Editor** (text/draw/highlight/shapes/images/signature/eraser + undo-redo, flattened export)
  - Pro **Viewer** (thumbnails, zoom, search, rotate, print, fullscreen, Ctrl+F / Ctrl+±)
  - **Signature workspace** (draw / type / upload, reusable, click-to-place)
- **Unified platform UX**: shared Dropzone → staged Processing pipeline ("Uploading… → Analyzing… → Your file is ready!") → Result panel (downloads, image gallery, editable OCR text, selectable tables) → local **file history** with download/rename/share/delete
- **Accounts** (email+password demo auth, Google-OAuth-ready architecture), **Dashboard** analytics, Settings with data-wipe controls
- **SEO**: unique metadata + FAQ + HowTo + SoftwareApplication JSON-LD per tool, sitemap.xml, robots.txt
- **Dark/light mode**, fully responsive/mobile-first, accessible labels, empty/error/loading states everywhere
- **API**: live reference endpoint `POST /api/merge` (Node runtime) + documented contract for future routes

## Architecture

```
src/
  app/                    # routes: home, tools/[tool] (SSG ×38), editor, viewer,
                          # sign-pdf, dashboard, history, auth, pricing, docs…
  components/             # navbar, dropzone, workspace orchestrator, pipeline,
                          # result-panel, options-form, editor, viewer, signature…
  lib/
    engines/              # ONE FILE PER CAPABILITY — pure functions, zero UI
    pdf/                  # pdf.js loader, page renderer, range parser, doc typesetter
    tools/registry.ts     # single source of truth: slugs, SEO copy, FAQs, option schemas
    stores/               # auth + history (localStorage) + IndexedDB blob cache
scripts/copy-worker.mjs   # copies pdf.worker into public/ on install
scripts/smoke-test.cjs    # end-to-end route + API check against a running server
```

Adding a new tool = one registry entry + one engine function. Pages, navigation, sitemap and SEO generate automatically.

## Honest engineering notes

- All document processing is client-side; nothing is uploaded. The `/api/merge` route exists to demonstrate the server-side pattern for operations that later need a backend.
- "Remove password" requires the correct password by design and outputs a high-quality flattened copy.
- Compression reports measured deltas truthfully; text-only files may already be optimal.
- Auth is a demo-grade local implementation wired behind a swappable store module.

## By Hizbullah Khalifa
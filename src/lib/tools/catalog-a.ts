import type { ToolDef } from "./types";

const PDF = [".pdf"];
const IMG_ALL = [".jpg", ".jpeg", ".png"];

const pageSizeOpt = {
  key: "pageSize",
  label: "Page size",
  type: "select" as const,
  default: "a4",
  options: [
    { value: "a4", label: "A4" },
    { value: "letter", label: "US Letter" },
  ],
};

const marginOpt = {
  key: "margin",
  label: "Margin (mm)",
  type: "number" as const,
  default: 20,
  min: 0,
  max: 50,
};

export const CONVERT_TOOLS: ToolDef[] = [
  {
    slug: "pdf-to-word",
    name: "PDF to Word",
    tagline: "Turn PDFs into editable DOCX documents.",
    description:
      "Convert PDF documents to fully editable Microsoft Word (.docx) files right in your browser. PDFForge reconstructs paragraphs, spacing and reading order so you can start editing immediately \u2014 no installation, no uploads to remote servers.",
    category: "convert",
    icon: "\u{1F4DD}",
    accept: PDF,
    engine: "pdf-to-word",
    popular: true,
    keywords: ["pdf to word", "pdf to docx", "convert pdf to word free"],
    steps: [
      "Drag your PDF into the upload area or click Choose File.",
      "PDFForge analyzes the document structure and text layout.",
      "Conversion rebuilds each page as editable paragraphs in DOCX format.",
      "Preview the summary and download your Word file.",
    ],
    faqs: [
      {
        q: "Is the converted Word file editable?",
        a: "Yes. Text is reconstructed into standard Word paragraphs, so you can edit, reflow and restyle everything in Microsoft Word, Google Docs or LibreOffice.",
      },
      {
        q: "Will scanned PDFs convert?",
        a: "Scanned pages contain images of text rather than real text. Run the PDF OCR tool first to recognize the text, then convert.",
      },
      {
        q: "Are my files uploaded anywhere?",
        a: "No. Conversion runs entirely inside your browser using WebAssembly-powered engines. Your document never leaves your device.",
      },
    ],
  },
  {
    slug: "word-to-pdf",
    name: "Word to PDF",
    tagline: "Convert .docx files to polished PDFs.",
    description:
      "Convert Word documents (.docx) to PDF while preserving headings, paragraphs, lists, tables and embedded images. Perfect for sharing assignments, reports and resumes exactly as you formatted them.",
    category: "convert",
    icon: "\u{1F4C4}",
    accept: [".docx"],
    engine: "word-to-pdf",
    popular: true,
    keywords: ["word to pdf", "docx to pdf", "convert word document"],
    steps: [
      "Upload your .docx file.",
      "PDFForge extracts text, styles, tables and images.",
      "The content is re-rendered into a clean, paginated PDF.",
      "Download the finished PDF instantly.",
    ],
    faqs: [
      {
        q: "Which formatting is preserved?",
        a: "Headings hierarchy, body text, bullet and numbered lists, tables with borders and inline images are all rendered into the PDF.",
      },
      {
        q: "Do you support legacy .doc files?",
        a: "Only modern .docx is supported. Open your file in Word and use Save As \u2192 .docx first.",
      },
    ],
    options: [pageSizeOpt, marginOpt],
  },
  {
    slug: "pdf-to-powerpoint",
    name: "PDF to PowerPoint",
    tagline: "Rebuild PDF pages as presentation slides.",
    description:
      "Convert each page of a PDF into a high-resolution PowerPoint slide (.pptx). Ideal for turning handouts, whitepapers and exported decks back into editable presentations where technically possible.",
    category: "convert",
    icon: "\u{1F4CA}",
    accept: PDF,
    engine: "pdf-to-ppt",
    keywords: ["pdf to powerpoint", "pdf to pptx", "pdf to ppt"],
    steps: [
      "Upload the PDF you want as a deck.",
      "Each page is rendered at high resolution.",
      "Slides are assembled into a 16:9 PPTX presentation.",
      "Download and edit in PowerPoint or Google Slides.",
    ],
    faqs: [
      {
        q: "Can I edit slide content afterwards?",
        a: "Each slide carries the original page as a crisp image so fidelity stays perfect. For fully editable text extraction, use PDF to Word instead.",
      },
    ],
  },
  {
    slug: "powerpoint-to-pdf",
    name: "PowerPoint to PDF",
    tagline: "Share decks that open anywhere.",
    description:
      "Convert PowerPoint presentations (.pptx) to PDF with slide titles and bullets preserved as selectable text. Great for handouts, email attachments and printing.",
    category: "convert",
    icon: "\u{1F4D5}",
    accept: [".pptx"],
    engine: "pptx-to-pdf",
    keywords: ["powerpoint to pdf", "pptx to pdf", "ppt to pdf"],
    steps: [
      "Upload your .pptx presentation.",
      "PDFForge reads slide size, titles and bullet content.",
      "Every slide becomes a matching landscape PDF page.",
      "Download your PDF deck.",
    ],
    faqs: [
      {
        q: "Does animation survive conversion?",
        a: "PDF is a static format, so animations and transitions are intentionally omitted. All slide text is preserved.",
      },
    ],
  },
  {
    slug: "pdf-to-excel",
    name: "PDF to Excel",
    tagline: "Detect tables and export XLSX.",
    description:
      "Extract tabular data from PDF files into Excel spreadsheets. PDFForge detects aligned column structures automatically, shows you each detected table, and exports selected tables into a multi-sheet XLSX workbook.",
    category: "convert",
    icon: "\u{1F4C8}",
    accept: PDF,
    engine: "pdf-to-excel",
    popular: true,
    keywords: ["pdf to excel", "pdf table extraction", "pdf to xlsx"],
    steps: [
      "Upload a PDF containing tables.",
      "PDFForge scans every page for aligned rows and columns.",
      "Detected tables appear in a preview \u2014 pick the ones you need.",
      "Export selected tables as an XLSX workbook.",
    ],
    faqs: [
      {
        q: "How is table detection performed?",
        a: "Text items are clustered into visual rows using their coordinates, then columns are inferred from horizontal gaps. Consecutive rows with matching structure form a table.",
      },
      {
        q: "What about borderless tables?",
        a: "Borderless but well-aligned tables work well. Heavily merged cells or nested layouts may need manual cleanup after export.",
      },
    ],
  },
  {
    slug: "excel-to-pdf",
    name: "Excel to PDF",
    tagline: "Print-ready spreadsheets in one click.",
    description:
      "Convert Excel workbooks (.xlsx) into clean PDF tables with gridlines, styled headers and automatic pagination across portrait or landscape pages.",
    category: "convert",
    icon: "\u{1F4C7}",
    accept: [".xlsx", ".xls", ".csv"],
    engine: "excel-to-pdf",
    keywords: ["excel to pdf", "xlsx to pdf", "spreadsheet to pdf"],
    steps: ["Upload your spreadsheet.", "Choose orientation.", "Sheets render as formatted PDF tables.", "Download the PDF."],
    faqs: [
      {
        q: "Are formulas calculated?",
        a: "The last saved values of every cell are used \u2014 exactly what you see when opening the sheet.",
      },
    ],
    options: [
      {
        key: "orientation",
        label: "Orientation",
        type: "select",
        default: "landscape",
        options: [
          { value: "portrait", label: "Portrait" },
          { value: "landscape", label: "Landscape" },
        ],
      },
      {
        key: "gridlines",
        label: "Show gridlines",
        type: "checkbox",
        default: true,
      },
    ],
  },
  {
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    tagline: "Export pages as JPG images.",
    description:
      "Convert PDF pages to JPG images with adjustable resolution and quality. Download individual pages or grab everything as a ZIP archive.",
    category: "convert",
    icon: "\u{1F5BC}\uFE0F",
    accept: PDF,
    engine: "pdf-to-images",
    popular: true,
    keywords: ["pdf to jpg", "pdf to jpeg", "pdf to image"],
    steps: ["Upload your PDF.", "Pick pages, quality and resolution.", "Pages render as JPG images.", "Download individually or as ZIP."],
    faqs: [
      {
        q: "Which resolution should I choose?",
        a: "2\u00D7 suits screens and chat apps; 3\u00D7 is better for print. Higher values produce larger files.",
      },
    ],
    options: [
      { key: "format", label: "Format", type: "hidden", default: "jpg" } as any,
      {
        key: "resolution",
        label: "Resolution",
        type: "select",
        default: "2",
        options: [
          { value: "1", label: "1\u00D7 (72 DPI)" },
          { value: "2", label: "2\u00D7 (~144 DPI)" },
          { value: "3", label: "3\u00D7 (~216 DPI)" },
        ],
      },
      { key: "quality", label: "Image quality", type: "range", default: 0.9, min: 0.5, max: 1, step: 0.05 },
      { key: "pages", label: "Pages (blank = all)", type: "text", placeholder: "e.g. 1-3, 5" },
    ],
  },
  {
    slug: "pdf-to-png",
    name: "PDF to PNG",
    tagline: "Lossless PNG exports of any page.",
    description:
      "Export PDF pages as lossless PNG images \u2014 ideal for screenshots, documentation and design assets with transparent-friendly quality settings.",
    category: "convert",
    icon: "\u{1F5BC}\uFE0F",
    accept: PDF,
    engine: "pdf-to-images",
    keywords: ["pdf to png", "pdf pages to png"],
    steps: ["Upload your PDF.", "Choose pages and resolution.", "Pages render as PNGs.", "Download images or a ZIP."],
    faqs: [{ q: "Why PNG over JPG?", a: "PNG is lossless, keeping text razor sharp. Use JPG for photos-heavy pages when size matters." }],
    options: [
      { key: "format", label: "Format", type: "hidden", default: "png" } as any,
      {
        key: "resolution",
        label: "Resolution",
        type: "select",
        default: "2",
        options: [
          { value: "1", label: "1\u00D7" },
          { value: "2", label: "2\u00D7" },
          { value: "3", label: "3\u00D7" },
        ],
      },
      { key: "pages", label: "Pages (blank = all)", type: "text", placeholder: "e.g. 2, 4-6" },
    ],
  },
  {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    tagline: "Photos to PDF, perfectly arranged.",
    description:
      "Combine JPG photos into a single PDF. Reorder images, choose page size, orientation, margins and compression quality before creating the document.",
    category: "convert",
    icon: "\u{1F4F8}",
    accept: IMG_ALL,
    multiple: true,
    engine: "images-to-pdf",
    popular: true,
    keywords: ["jpg to pdf", "jpeg to pdf", "photos to pdf"],
    steps: ["Add one or more images.", "Drag to reorder them.", "Set page size, orientation and margins.", "Create and download your PDF."],
    faqs: [
      {
        q: "How do I reorder images?",
        a: "Use the arrow buttons on each uploaded image card to move it left or right in the sequence.",
      },
    ],
    options: [
      {
        key: "pageSize",
        label: "Page size",
        type: "select",
        default: "auto",
        options: [
          { value: "auto", label: "Fit to image" },
          { value: "a4", label: "A4" },
          { value: "letter", label: "US Letter" },
        ],
      },
      {
        key: "orientation",
        label: "Orientation",
        type: "select",
        default: "auto",
        options: [
          { value: "auto", label: "Auto" },
          { value: "portrait", label: "Portrait" },
          { value: "landscape", label: "Landscape" },
        ],
      },
      { key: "margin", label: "Margin (mm)", type: "range", default: 10, min: 0, max: 25, step: 1 },
      { key: "quality", label: "Quality", type: "range", default: 0.88, min: 0.5, max: 1, step: 0.02 },
    ],
  },
  {
    slug: "png-to-pdf",
    name: "PNG to PDF",
    tagline: "Screenshots to shareable PDFs.",
    description:
      "Turn PNG screenshots and graphics into one tidy PDF document with custom page sizing, margins and quality controls.",
    category: "convert",
    icon: "\u{1F5A5}\uFE0F",
    accept: IMG_ALL,
    multiple: true,
    engine: "images-to-pdf",
    keywords: ["png to pdf", "screenshots to pdf"],
    steps: ["Upload PNG files.", "Arrange the order.", "Configure page layout.", "Create the PDF."],
    faqs: [{ q: "Is transparency preserved?", a: "Transparent areas are composited onto a white background for reliable printing." }],
    options: [
      {
        key: "pageSize",
        label: "Page size",
        type: "select",
        default: "auto",
        options: [
          { value: "auto", label: "Fit to image" },
          { value: "a4", label: "A4" },
          { value: "letter", label: "US Letter" },
        ],
      },
      { key: "margin", label: "Margin (mm)", type: "range", default: 10, min: 0, max: 25, step: 1 },
    ],
  },
  {
    slug: "html-to-pdf",
    name: "HTML to PDF",
    tagline: "Web pages and HTML files to print.",
    description:
      "Convert saved HTML files into structured PDFs. Headings, paragraphs, lists and tables are laid out with proper typography for printing or archiving web content.",
    category: "convert",
    icon: "\u{1F310}",
    accept: [".html", ".htm"],
    engine: "html-to-pdf",
    keywords: ["html to pdf", "webpage to pdf", "save html as pdf"],
    steps: ["Save a webpage (Ctrl+S) or prepare an .html file.", "Upload it here.", "Content is parsed and typeset.", "Download the PDF."],
    faqs: [
      {
        q: "Does it capture CSS styling exactly?",
        a: "It renders semantic structure (headings, text, tables, lists) with consistent typography rather than pixel-perfect CSS. For pixel-perfect captures use your browser's Print \u2192 Save as PDF.",
      },
    ],
    options: [pageSizeOpt, marginOpt],
  },
  {
    slug: "text-to-pdf",
    name: "Text to PDF",
    tagline: "Plain notes, beautiful pages.",
    description:
      "Transform plain .txt files into neatly paginated PDFs with adjustable font size, page size and margins \u2014 great for manuscripts, notes and logs.",
    category: "convert",
    icon: "\u{1F4DC}",
    accept: [".txt"],
    engine: "text-to-pdf",
    keywords: ["text to pdf", "txt to pdf"],
    steps: ["Upload a .txt file.", "Adjust font and page settings.", "Text is wrapped and paginated.", "Download the PDF."],
    faqs: [],
    options: [
      pageSizeOpt,
      { key: "fontSize", label: "Font size", type: "range", default: 11, min: 8, max: 16, step: 1 },
      marginOpt,
    ],
  },
];

export const ORGANIZE_TOOLS: ToolDef[] = [
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    tagline: "Combine files into one document.",
    description:
      "Merge multiple PDF files into a single document in your chosen order. Drag files in, arrange them, and download one combined PDF \u2014 processed privately in your browser.",
    category: "organize",
    icon: "\u{1F5C2}\uFE0F",
    accept: PDF,
    multiple: true,
    maxFiles: 30,
    engine: "merge",
    popular: true,
    keywords: ["merge pdf", "combine pdf", "join pdf files"],
    steps: [
      "Upload two or more PDF files.",
      "Drag the cards to set the exact order.",
      "Press Merge PDFs.",
      "Download your combined document.",
    ],
    faqs: [
      {
        q: "Is there a file count limit?",
        a: "You can merge up to 30 files at once on Free; Pro raises the ceiling and file size limits.",
      },
      {
        q: "Will bookmarks survive merging?",
        a: "Page content merges reliably; document-level outlines from source files are rebuilt as flat pages.",
      },
    ],
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    tagline: "One document in, many out.",
    description:
      "Split a PDF by custom page ranges, fixed chunks (every N pages), or extract just the selection. Multi-file results arrive as a convenient ZIP bundle.",
    category: "organize",
    icon: "\u{2702}\uFE0F",
    accept: PDF,
    engine: "split",
    popular: true,
    keywords: ["split pdf", "separate pdf pages", "pdf splitter"],
    steps: [
      "Upload your PDF.",
      "Choose split mode: ranges, every N pages, or extract selection.",
      "Enter ranges like 1-5, 6-10, 11-15.",
      "Download the parts individually or as ZIP.",
    ],
    faqs: [
      {
        q: "What does \u201CEvery N pages\u201D do?",
        a: "It chops the document into equal chunks \u2014 e.g. a 15-page PDF with N=5 becomes Pages 1\u20135, Pages 6\u201310, Pages 11\u201315.",
      },
      {
        q: "Can I get a single extracted range instead of many files?",
        a: "Yes \u2014 choose Extract selected pages and enter one range such as 4-9.",
      },
    ],
    options: [
      {
        key: "mode",
        label: "Split mode",
        type: "select",
        default: "ranges",
        options: [
          { value: "ranges", label: "Custom ranges" },
          { value: "everyN", label: "Every N pages" },
          { value: "extract", label: "Extract selected" },
        ],
      },
      { key: "ranges", label: "Ranges", type: "text", placeholder: "1-5, 6-10, 11-15" },
      { key: "n", label: "N (pages per file)", type: "number", default: 5, min: 1, max: 500 },
      { key: "pages", label: "Selected pages", type: "text", placeholder: "e.g. 2, 5-8" },
    ],
  },
  {
    slug: "extract-pages",
    name: "Extract Pages",
    tagline: "Pull out exactly what you need.",
    description:
      "Create a new PDF containing only the pages you select \u2014 perfect for sharing a single chapter or clipping key sections from long reports.",
    category: "organize",
    icon: "\u{1F4CB}",
    accept: PDF,
    engine: "extract",
    keywords: ["extract pdf pages", "get pages from pdf"],
    steps: ["Upload the PDF.", "Type the pages to keep, e.g. 3, 7-10.", "Run the extraction.", "Download the new PDF."],
    faqs: [],
    options: [{ key: "pages", label: "Pages to extract", type: "text", placeholder: "e.g. 1, 3, 5-9", wide: true }],
  },
  {
    slug: "delete-pages",
    name: "Delete Pages",
    tagline: "Remove unwanted pages cleanly.",
    description:
      "Delete specific pages from any PDF while keeping the remaining order intact. At least one page always remains in the output.",
    category: "organize",
    icon: "\u{1F5D1}\uFE0F",
    accept: PDF,
    engine: "delete-pages",
    keywords: ["delete pdf pages", "remove pages from pdf"],
    steps: ["Upload the PDF.", "List pages to delete.", "Process and preview the result.", "Download the trimmed file."],
    faqs: [],
    options: [{ key: "pages", label: "Pages to delete", type: "text", placeholder: "e.g. 2, 14-16", wide: true }],
  },
  {
    slug: "rotate-pdf",
    name: "Rotate Pages",
    tagline: "Fix sideways scans in seconds.",
    description:
      "Rotate all pages or a selected range by 90\u00B0, 180\u00B0 or 270\u00B0. Rotation is stored losslessly, so quality never degrades.",
    category: "organize",
    icon: "\u{1F504}",
    accept: PDF,
    engine: "rotate",
    keywords: ["rotate pdf", "turn pdf pages"],
    steps: ["Upload the PDF.", "Pick rotation angle.", "Optionally target specific pages.", "Save the rotated file."],
    faqs: [],
    options: [
      {
        key: "angle",
        label: "Angle",
        type: "select",
        default: "90",
        options: [
          { value: "90", label: "90\u00B0 clockwise" },
          { value: "180", label: "180\u00B0" },
          { value: "270", label: "90\u00B0 counter-clockwise" },
        ],
      },
      { key: "pages", label: "Pages (blank = all)", type: "text", placeholder: "e.g. 1-4" },
    ],
  },
  {
    slug: "reorder-pages",
    name: "Reorder Pages",
    tagline: "Rearrange any document visually-numerically.",
    description:
      "Rewrite the page sequence of a PDF by typing the new order. Every page number must appear exactly once \u2014 PDFForge validates as you go.",
    category: "organize",
    icon: "\u{1F58A}\uFE0F",
    accept: PDF,
    engine: "reorder",
    keywords: ["reorder pdf pages", "sort pdf pages"],
    steps: ["Upload the PDF.", "Type the new order, e.g. 3,1,2,4.", "Validation confirms completeness.", "Download rearranged file."],
    faqs: [],
    options: [{ key: "order", label: "New page order", type: "text", placeholder: "e.g. 3, 1, 2, 4", wide: true }],
  },
];

export const OPTIMIZE_TOOLS: ToolDef[] = [
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    tagline: "Smaller files, balanced quality.",
    description:
      "Reduce PDF file size with three compression profiles. Structural optimization rebuilds the file efficiently; Maximum mode re-encodes heavy pages while keeping readability.",
    category: "optimize",
    icon: "\u{1F4E6}",
    accept: PDF,
    engine: "compress",
    popular: true,
    keywords: ["compress pdf", "reduce pdf size", "make pdf smaller"],
    steps: [
      "Upload your PDF.",
      "Choose Basic, Balanced or Maximum compression.",
      "See original vs compressed size and reduction %.",
      "Download the smaller file.",
    ],
    faqs: [
      {
        q: "Which mode should I pick?",
        a: "Balanced is recommended for most files. Basic keeps everything untouched except structure; Maximum re-encodes pages as high-quality images for the biggest savings on scanned or image-heavy PDFs.",
      },
      {
        q: "How much smaller will my file get?",
        a: "Text-only PDFs may already be optimal. Image-heavy documents often shrink dramatically \u2014 the result screen always shows the honest measured delta.",
      },
    ],
    options: [
      {
        key: "level",
        label: "Compression",
        type: "select",
        default: "balanced",
        options: [
          { value: "basic", label: "Basic \u2014 gentle" },
          { value: "balanced", label: "Balanced \u2014 recommended" },
          { value: "maximum", label: "Maximum \u2014 smallest" },
        ],
      },
    ],
  },
  {
    slug: "optimize-pdf",
    name: "Optimize PDF",
    tagline: "Clean structure for fast loading.",
    description:
      "Rebuild your PDF's internal structure with object streams and cleaned metadata so viewers open it faster \u2014 no visual changes whatsoever.",
    category: "optimize",
    icon: "\u26A1",
    accept: PDF,
    engine: "compress",
    keywords: ["optimize pdf", "linearize pdf", "clean pdf structure"],
    steps: ["Upload the PDF.", "Structural optimization runs automatically.", "Review the size report.", "Download optimized file."],
    faqs: [],
    options: [
      {
        key: "level",
        label: "Profile",
        type: "hidden",
        default: "basic",
      } as any,
    ],
  },
  {
    slug: "reduce-file-size",
    name: "Reduce File Size",
    tagline: "Hit strict upload limits.",
    description:
      "Aggressively shrink PDFs that must fit under tight email or portal limits. Maximum mode trades some fidelity for the smallest possible footprint.",
    category: "optimize",
    icon: "\u{1F9F2}",
    accept: PDF,
    engine: "compress",
    keywords: ["reduce pdf file size", "shrink pdf", "pdf compressor"],
    steps: ["Upload the PDF.", "Maximum profile engages automatically.", "Check the measured reduction.", "Download."],
    faqs: [],
    options: [
      {
        key: "level",
        label: "Profile",
        type: "hidden",
        default: "maximum",
      } as any,
    ],
  },
];

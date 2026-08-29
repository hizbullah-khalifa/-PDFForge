import { CONVERT_TOOLS, ORGANIZE_TOOLS, OPTIMIZE_TOOLS } from "./catalog-a";
import { EDIT_TOOLS, SECURITY_TOOLS, OTHER_TOOLS } from "./catalog-b";
import type { CategoryDef, CategoryId, ToolDef } from "./types";

export const CATEGORIES: CategoryDef[] = [
  { id: "convert", label: "Convert", icon: "\u{1F501}", blurb: "PDF to Word, Excel, PowerPoint & images \u2014 and back again." },
  { id: "organize", label: "Organize", icon: "\u{1F5C2}\uFE0F", blurb: "Merge, split, extract, delete, rotate and reorder pages." },
  { id: "optimize", label: "Optimize", icon: "\u{1F4E6}", blurb: "Compress file sizes without sacrificing quality." },
  { id: "edit", label: "Edit", icon: "\u270D\uFE0F", blurb: "Text, images, shapes, highlights, drawing and watermarks." },
  { id: "security", label: "Security", icon: "\u{1F512}", blurb: "Passwords, encryption and unlocking documents you own." },
  { id: "other", label: "More Tools", icon: "\u{1F9E9}", blurb: "OCR, signatures, comparison, numbering and metadata." },
];

export const TOOLS: ToolDef[] = [
  ...CONVERT_TOOLS,
  ...ORGANIZE_TOOLS,
  ...OPTIMIZE_TOOLS,
  ...EDIT_TOOLS,
  ...SECURITY_TOOLS,
  ...OTHER_TOOLS,
];

export const SPECIAL_TOOL_SLUGS = new Set(["pdf-editor", "sign-pdf"]);

export function getTool(slug: string): ToolDef | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function toolsByCategory(id: CategoryId): ToolDef[] {
  return TOOLS.filter((t) => t.category === id);
}

export function popularTools(): ToolDef[] {
  return TOOLS.filter((t) => t.popular);
}

export function relatedTools(tool: ToolDef, count = 4): ToolDef[] {
  const sameCategory = TOOLS.filter((t) => t.category === tool.category && t.slug !== tool.slug);
  const others = TOOLS.filter((t) => t.category !== tool.category && t.popular && t.slug !== tool.slug);
  return [...sameCategory, ...others].slice(0, count);
}

export function toolHref(tool: ToolDef): string {
  return `/tools/${tool.slug}`;
}

export * from "./types";

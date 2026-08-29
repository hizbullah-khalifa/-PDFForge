import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://pdfforge.app";
  const staticPages = ["", "/tools", "/pricing", "/about", "/privacy", "/docs", "/login", "/signup"].map((p) => ({
    url: base + p,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  const toolPages = TOOLS.map((t) => ({
    url: `${base}/tools/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: t.popular ? 0.9 : 0.6,
  }));
  return [...staticPages, ...toolPages];
}

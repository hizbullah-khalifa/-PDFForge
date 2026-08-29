import { extOf } from "./utils";

export const MAX_FILE_SIZE = 150 * 1024 * 1024;

export interface ValidationIssue {
  file: File;
  reason: string;
}

export function validateFiles(
  files: File[],
  accept: string[],
  multiple: boolean,
  existingCount = 0,
  maxFiles = 20
): { accepted: File[]; issues: ValidationIssue[] } {
  const accepted: File[] = [];
  const issues: ValidationIssue[] = [];

  for (const f of files) {
    const ext = "." + extOf(f.name);
    const okType = accept.some((a) => a === ext || a === extOf(f.name));
    if (!okType) {
      issues.push({ file: f, reason: `Unsupported format. Expected ${accept.join(", ")}` });
      continue;
    }
    if (f.size > MAX_FILE_SIZE) {
      issues.push({ file: f, reason: `File is too large (max ${MAX_FILE_SIZE / 1024 / 1024} MB)` });
      continue;
    }
    if (f.size === 0) {
      issues.push({ file: f, reason: "This file appears to be corrupted or empty. Please upload another file." });
      continue;
    }
    if (!multiple && accepted.length >= 1) {
      issues.push({ file: f, reason: "Only one file is allowed for this tool" });
      continue;
    }
    if (existingCount + accepted.length >= maxFiles) {
      issues.push({ file: f, reason: `You can process up to ${maxFiles} files at once` });
      continue;
    }
    accepted.push(f);
  }
  return { accepted, issues };
}

export function friendlyEngineError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/password|encrypt/i.test(msg))
    return "This PDF is password protected. Use the Unlock PDF tool first, or provide the correct password.";
  if (/corrupt|invalid|structure|parse|xref/i.test(msg))
    return "This file appears to be corrupted. Please upload another file.";
  if (/memory|allocation/i.test(msg)) return "The file is too large to process in the browser. Try the smaller file on Pro.";
  return msg || "Something went wrong while processing your file.";
}

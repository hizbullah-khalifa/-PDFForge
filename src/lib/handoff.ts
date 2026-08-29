const KEY = "pf-handoff";
let memoryFiles: File[] = [];

export function stageHandoff(files: File[]): void {
  memoryFiles = files;
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {}
}

export function consumeHandoff(): File[] {
  let flagged = false;
  try {
    flagged = !!sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {}
  if (!flagged || memoryFiles.length === 0) return [];
  const out = memoryFiles;
  memoryFiles = [];
  return out;
}

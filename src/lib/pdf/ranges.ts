export function parsePageRanges(input: string, total: number): number[][] {
  const groups: number[][] = [];
  for (const part of input.split(",")) {
    const seg = part.trim();
    if (!seg) continue;
    const m = seg.match(/^(\d+)\s*(?:-|to)\s*(\d+)$/i);
    if (m) {
      let a = parseInt(m[1], 10);
      let b = parseInt(m[2], 10);
      if (a > b) [a, b] = [b, a];
      a = Math.max(1, a);
      b = Math.min(total, b);
      const pages: number[] = [];
      for (let i = a; i <= b; i++) pages.push(i - 1);
      if (pages.length) groups.push(pages);
      continue;
    }
    const single = parseInt(seg, 10);
    if (!isNaN(single) && single >= 1 && single <= total) groups.push([single - 1]);
  }
  if (!groups.length) throw new Error(`Enter valid page numbers between 1 and ${total}.`);
  return groups;
}

export function parseFlatIndices(input: string, total: number): number[] {
  const flat = parsePageRanges(input, total).flat();
  return [...new Set(flat)].sort((a, b) => a - b);
}

export function describeRanges(groups: number[][]): string {
  return groups
    .map((g) => {
      if (g.length === 1) return `Page ${g[0] + 1}`;
      const runs: string[] = [];
      let start = g[0];
      let prev = g[0];
      for (let i = 1; i <= g.length; i++) {
        if (g[i] !== prev + 1) {
          runs.push(start === prev ? `${start + 1}` : `${start + 1}\u2013${prev + 1}`);
          start = g[i];
        }
        prev = g[i];
      }
      return `Pages ${runs.join(", ")}`;
    })
    .join(" · ");
}

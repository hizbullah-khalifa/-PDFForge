const { PDFDocument } = require("@cantoo/pdf-lib");

async function makePdf(label, pages) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const p = doc.addPage([300, 300]);
    p.drawText(`${label} page ${i + 1}`, { x: 40, y: 150, size: 20 });
  }
  return Buffer.from(await doc.save());
}

(async () => {
  const base = "http://localhost:3111";
  const checks = [];

  for (const path of ["/", "/tools", "/tools/pdf-to-word", "/tools/merge-pdf", "/tools/pdf-editor", "/tools/pdf-viewer", "/pricing", "/docs", "/dashboard"]) {
    const res = await fetch(base + path);
    checks.push([path, res.status, (await res.text()).length]);
  }

  const form = new FormData();
  form.append("files[]", new Blob([await makePdf("Alpha", 2)], { type: "application/pdf" }), "a.pdf");
  form.append("files[]", new Blob([await makePdf("Beta", 3)], { type: "application/pdf" }), "b.pdf");
  const merged = await fetch(base + "/api/merge", { method: "POST", body: form });
  const buf = Buffer.from(await merged.arrayBuffer());
  checks.push(["POST /api/merge", merged.status, `${buf.length} bytes, ${merged.headers.get("content-type")}`]);

  const badReq = await fetch(base + "/api/merge", { method: "POST", body: new FormData() });
  checks.push(["POST /api/merge (empty)", badReq.status, JSON.stringify(await badReq.json())]);

  console.table(checks.map(([path, status, info]) => ({ path, status, info })));
})();

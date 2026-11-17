// A small PDF writer for plain text documents (Letter size, Helvetica, ASCII text).
// No external packages: the file is built as bytes directly.

export type PdfLine = { text: string; bold?: boolean; size?: number; gapAfter?: number };

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 54;

// Built-in PDF fonts only handle basic characters, so anything else becomes "?".
function ascii(text: string): string {
  return text.replace(/[^\x20-\x7e]/g, "?");
}

function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

// Breaks text into lines that fit the width, using an average Helvetica character width.
function wrap(text: string, size: number, width: number): string[] {
  const maxChars = Math.max(20, Math.floor(width / (size * 0.52)));
  const out: string[] = [];
  for (const paragraph of ascii(text).split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars && line) {
        out.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    out.push(line);
  }
  return out;
}

export function buildPdf(lines: PdfLine[]): Uint8Array {
  const width = PAGE_W - MARGIN * 2;
  // Lay out every line onto pages, starting a new page when the bottom margin is reached.
  const pages: string[][] = [[]];
  let y = PAGE_H - MARGIN;
  for (const line of lines) {
    const size = line.size ?? 11;
    const leading = size * 1.35;
    for (const part of wrap(line.text, size, width)) {
      if (y - leading < MARGIN) {
        pages.push([]);
        y = PAGE_H - MARGIN;
      }
      y -= leading;
      const font = line.bold ? "F2" : "F1";
      pages[pages.length - 1].push(`BT /${font} ${size} Tf ${MARGIN} ${y.toFixed(1)} Td (${escapeText(part)}) Tj ET`);
    }
    y -= line.gapAfter ?? 0;
  }

  // Object 1: catalog, 2: page tree, 3 and 4: fonts, then a page object and content stream per page.
  const objects: string[] = [];
  const pageIds = pages.map((_, i) => 5 + i * 2);
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  pages.forEach((ops, i) => {
    const pageId = pageIds[i];
    const contentId = pageId + 1;
    const content = ops.join("\n");
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });

  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = body.length;
    body += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = body.length;
  let table = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++) {
    table += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  body += table;
  body += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

  const bytes = new Uint8Array(body.length);
  for (let i = 0; i < body.length; i++) bytes[i] = body.charCodeAt(i) & 0xff;
  return bytes;
}

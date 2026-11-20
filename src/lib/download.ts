// Saves a file through the browser. Returns false where browser downloads are not available (for example on a phone build).
export function downloadFile(filename: string, mime: string, data: string | Uint8Array): boolean {
  const g = globalThis as any;
  if (!g.document || !g.URL?.createObjectURL || !g.Blob) return false;
  const blob = new g.Blob([data], { type: mime });
  const url: string = g.URL.createObjectURL(blob);
  const link = g.document.createElement("a");
  link.href = url;
  link.download = filename;
  g.document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => g.URL.revokeObjectURL(url), 1000);
  return true;
}

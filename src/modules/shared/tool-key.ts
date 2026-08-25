/** /format/qr/ -> format-qr */
export function pathToToolKey(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  const cleaned = pathname.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
  if (!cleaned) return null;
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  const key = parts.join('-').toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) return null;
  return key;
}

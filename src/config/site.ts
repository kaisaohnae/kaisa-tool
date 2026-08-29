/**
 * Public site URL used for canonical, sitemap, Open Graph.
 * Set NEXT_PUBLIC_SITE_URL in .env / .env.production (no trailing slash).
 */
export const SITE_NAME = 'Kaisa Tool';

export const SITE_DESCRIPTION =
  'Browser-based image, PDF, and text utilities — process files locally without uploading to a server.';

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:5553';
  return raw.replace(/\/+$/, '');
}

export function absoluteUrl(path = '/'): string {
  const base = getSiteUrl();
  if (!path || path === '/') return `${base}/`;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized.endsWith('/') ? normalized : `${normalized}/`}`;
}

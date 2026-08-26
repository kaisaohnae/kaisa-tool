import type {MetadataRoute} from 'next';
import {absoluteUrl} from '@/config/site';
import {TOOLS} from '@/data/tools';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Only real tool pages — no empty category/home hubs
  return TOOLS.map((tool, index) => ({
    url: absoluteUrl(tool.href),
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: index === 0 ? 1 : 0.7
  }));
}

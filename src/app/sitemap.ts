import type {MetadataRoute} from 'next';
import {absoluteUrl} from '@/config/site';
import {TOOL_CATEGORIES, TOOLS} from '@/data/tools';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const home: MetadataRoute.Sitemap[number] = {
    url: absoluteUrl('/'),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 1
  };

  const categories: MetadataRoute.Sitemap = TOOL_CATEGORIES.map(cat => ({
    url: absoluteUrl(`/${cat.id}/`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8
  }));

  const tools: MetadataRoute.Sitemap = TOOLS.map(tool => ({
    url: absoluteUrl(tool.href),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7
  }));

  return [home, ...categories, ...tools];
}

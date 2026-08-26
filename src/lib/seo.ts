import type {Metadata} from 'next';
import {getToolByHref} from '@/data/tools';
import {absoluteUrl, SITE_DESCRIPTION, SITE_NAME} from '@/config/site';

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  ogType?: 'website' | 'article';
};

export function buildPageMetadata({title, description, path, ogType = 'website'}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const isSiteRoot = title === SITE_NAME;

  return {
    title: isSiteRoot ? {absolute: SITE_NAME} : title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      type: ogType,
      siteName: SITE_NAME,
      title: isSiteRoot ? SITE_NAME : `${title} · ${SITE_NAME}`,
      description,
      url,
      locale: 'en_US'
    },
    twitter: {
      card: 'summary',
      title: isSiteRoot ? SITE_NAME : `${title} · ${SITE_NAME}`,
      description
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

/** Metadata for a tool page — title/description aligned with on-page H1 (English). */
export function toolPageMetadata(href: string): Metadata {
  const tool = getToolByHref(href);
  if (!tool) {
    return buildPageMetadata({
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      path: href
    });
  }

  return buildPageMetadata({
    title: tool.title,
    description: tool.description,
    path: tool.href
  });
}

export function toolJsonLd(href: string) {
  const tool = getToolByHref(href);
  if (!tool) return null;

  const pageUrl = absoluteUrl(tool.href);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: `${tool.title} · ${SITE_NAME}`,
        description: tool.description,
        url: pageUrl,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        isPartOf: {
          '@type': 'WebSite',
          name: SITE_NAME,
          url: absoluteUrl('/image/compress/')
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: SITE_NAME,
            item: absoluteUrl('/image/compress/')
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: tool.title,
            item: pageUrl
          }
        ]
      }
    ]
  };
}

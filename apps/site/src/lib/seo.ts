import type { Metadata } from 'next';
import { absoluteUrl, site } from './site';

/** Per-page metadata: title, description, canonical, Open Graph and Twitter. */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  /** Use the bare title (no " · AutoSort" suffix), e.g. on the home page. */
  absoluteTitle?: boolean;
  type?: 'website' | 'article';
  noindex?: boolean;
}): Metadata {
  const url = absoluteUrl(opts.path);
  return {
    title: opts.absoluteTitle ? { absolute: opts.title } : opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: site.name,
      type: opts.type ?? 'website',
      locale: 'en_US',
    },
    twitter: { card: 'summary_large_image', title: opts.title, description: opts.description, creator: site.founder.twitter, site: site.founder.twitter },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

type Json = Record<string, unknown>;

export interface Crumb {
  name: string;
  /** Omit for the current page. */
  href?: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[], currentPath: string): Json {
  // Middle crumbs without a page of their own (e.g. "Split") are shown but left out of the list.
  const linked = crumbs.filter((c, i) => c.href || i === crumbs.length - 1);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: linked.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.href ?? currentPath),
    })),
  };
}

export interface FaqItem {
  q: string;
  /** Plain-text answer (used for both the page and FAQPage structured data). */
  a: string;
}

export function faqJsonLd(items: FaqItem[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

export function softwareJsonLd(opts: { name?: string; description?: string; path?: string; category?: string } = {}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: opts.name ?? site.name,
    description: opts.description ?? site.description,
    url: absoluteUrl(opts.path ?? '/'),
    applicationCategory: opts.category ?? 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    license: 'https://opensource.org/licenses/MIT',
    isAccessibleForFree: true,
  };
}

/** The founder as a schema.org Person, with profiles for entity linking. */
export const founderPerson = {
  '@type': 'Person',
  name: site.founder.name,
  url: site.founder.url,
  sameAs: [site.founder.twitterUrl, site.founder.github, site.founder.url],
};

export function sourceCodeJsonLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: site.name,
    codeRepository: site.github,
    programmingLanguage: 'TypeScript',
    license: 'https://opensource.org/licenses/MIT',
    author: founderPerson,
  };
}

export function articleJsonLd(opts: { headline: string; description: string; path: string; dateModified: string; datePublished?: string }): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    mainEntityOfPage: absoluteUrl(opts.path),
    datePublished: opts.datePublished ?? opts.dateModified,
    dateModified: opts.dateModified,
    author: founderPerson,
    publisher: { '@type': 'Organization', name: site.name, url: site.url },
  };
}

export function howToJsonLd(opts: { name: string; description: string; steps: Array<{ name: string; text: string }>; totalTime?: string }): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: opts.name,
    description: opts.description,
    ...(opts.totalTime ? { totalTime: opts.totalTime } : {}),
    step: opts.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text })),
  };
}

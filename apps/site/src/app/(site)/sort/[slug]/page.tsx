import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FeatureTemplate } from '@/components/feature/feature-template';
import { featurePath, getFeature, sortPages } from '@/content/features';
import { pageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return sortPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getFeature('sort', slug);
  if (!page) return {};
  return pageMetadata({ title: page.metaTitle, description: page.metaDescription, path: featurePath(page) });
}

export default async function SortFeaturePage({ params }: Props) {
  const { slug } = await params;
  const page = getFeature('sort', slug);
  if (!page) notFound();
  return <FeatureTemplate page={page} />;
}

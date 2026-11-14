import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ComparisonView } from '@/components/pages/compare';
import { comparisons, getComparison } from '@/content/compare';
import { pageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return comparisons.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) return {};
  return pageMetadata({ title: c.metaTitle, description: c.description, path: `/compare/${c.slug}`, absoluteTitle: true });
}

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) notFound();
  return <ComparisonView c={c} />;
}

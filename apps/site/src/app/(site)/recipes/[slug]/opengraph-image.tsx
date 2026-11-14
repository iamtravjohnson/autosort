import { getRecipe } from '@/content/recipes';
import { ogContentType, ogSize, publicImage, renderOg } from '@/lib/og';

export const size = ogSize;
export const contentType = ogContentType;
export const alt = 'AutoSort smart playlist recipe';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = getRecipe(slug);
  const [from, to] = r?.cover ?? ['#8B5CF6', '#1E1B4B'];
  const image = r ? await publicImage(`images/recipes/${r.slug}.jpg`) : undefined;
  return renderOg({ eyebrow: 'Smart playlist recipe', title: r?.name ?? 'Recipe', art: { kind: 'cover', from, to, label: r?.name ?? '', ...(image ? { image } : {}) } });
}

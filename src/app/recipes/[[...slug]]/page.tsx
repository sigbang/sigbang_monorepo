import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import RecipeDetailClient from '@/app/recipes/_client/RecipeDetailClient';
import { mapRecipeDetail, type RecipeDetail } from '@/lib/api/recipes';

export const revalidate = 60;

async function fetchRecipeByParts(parts: string[] | undefined): Promise<RecipeDetail | null> {
  if (!parts || parts.length === 0) return null;
  const jar = await cookies();
  const cookieHeader = jar.getAll().map((c) => `${c.name}=${encodeURIComponent(c.value)}`).join('; ');

  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const base = `${proto}://${host}`;

  let url = '';
  if (parts.length === 1) {
    const slug = parts[0];
    url = `${base}/api/proxy/recipes/by-slug/${encodeURIComponent(slug)}`;
  } else {
    const region = parts[0];
    const slug = parts.slice(1).join('/');
    url = `${base}/api/proxy/recipes/by-slug/${encodeURIComponent(region)}/${encodeURIComponent(slug)}`;
  }

  const res = await fetch(url, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const json: unknown = await res.json().catch(() => null);
  const data = json && typeof json === 'object' && json !== null && 'data' in (json as Record<string, unknown>)
    ? (json as { data: unknown }).data
    : json;
  if (!data || typeof data !== 'object') return null;
  return mapRecipeDetail(data);
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const recipe = await fetchRecipeByParts(slug);
  if (!recipe) return {} as any;
  const base = process.env.PUBLIC_BASE_URL || 'https://sigbang.com';
  const path = (slug && slug.length > 1) ? `${slug[0]}/${slug.slice(1).join('/')}` : (slug && slug[0]) ? slug[0] : '';
  const canonical = `${base}/recipes/${path}`;
  const image = recipe.thumbnailImage || recipe.thumbnailUrl || recipe.thumbnailPath || undefined;
  return {
    title: recipe.title,
    description: recipe.description ?? undefined,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title: recipe.title,
      description: recipe.description || undefined,
      url: canonical,
      images: image ? [{ url: image }] : undefined,
    },
    robots: { index: true, follow: true },
  } as any;
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const recipe = await fetchRecipeByParts(slug);
  if (!recipe) notFound();

  const base = process.env.PUBLIC_BASE_URL || 'https://sigbang.com';
  const path = (slug && slug.length > 1) ? `${slug[0]}/${slug.slice(1).join('/')}` : (slug && slug[0]) ? slug[0] : '';
  const canonical = `${base}/recipes/${path}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description || undefined,
    image: recipe.thumbnailImage ? [recipe.thumbnailImage] : undefined,
    datePublished: (recipe as any).createdAt,
    dateModified: (recipe as any).updatedAt,
    author: recipe.author?.name ? { '@type': 'Person', name: recipe.author.name } : undefined,
    recipeYield: recipe.servings ? `${recipe.servings} servings` : undefined,
    totalTime: recipe.cookingTime ? `PT${recipe.cookingTime}M` : undefined,
    mainEntityOfPage: canonical,
  } as Record<string, unknown>;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <RecipeDetailClient id={recipe.id} initial={recipe} />
    </>
  );
}



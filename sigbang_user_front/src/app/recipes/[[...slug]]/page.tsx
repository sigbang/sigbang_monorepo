import { notFound } from 'next/navigation';
import RecipeDetailClient from '@/app/recipes/_client/RecipeDetailClient';
import { mapRecipeDetail, type RecipeDetail } from '@/lib/api/recipes';
import { ENV } from '@/lib/env';

export const revalidate = 60;
export const dynamic = 'force-static';

async function fetchRecipeByParts(parts: string[] | undefined): Promise<RecipeDetail | null> {
  if (!parts || parts.length === 0) return null;
  const apiBase = ENV.API_BASE_URL.replace(/\/+$/, '');
  const url = parts.length === 1
    ? `${apiBase}/recipes/by-slug/${encodeURIComponent(parts[0])}`
    : `${apiBase}/recipes/by-slug/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts.slice(1).join('/'))}`;

  const res = await fetch(url, { next: { revalidate: 60 } });
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
  const base = ENV.SITE_URL;
  const path = (slug && slug.length > 1) ? `${slug[0]}/${slug.slice(1).join('/')}` : (slug && slug[0]) ? slug[0] : '';
  const canonical = `${base}/recipes/${path}`;

  const raw = recipe.thumbnailImage || recipe.thumbnailUrl || recipe.thumbnailPath || '';
  const normalized = raw && /^https?:/i.test(raw) ? raw : (raw ? '/' + (raw.startsWith('/') ? raw.slice(1) : raw) : '');
  const imageUrl = normalized ? new URL(normalized, base).toString() : undefined;

  return {
    title: recipe.title,
    description: recipe.description ?? undefined,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title: recipe.title,
      description: recipe.description || undefined,
      url: canonical,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: recipe.title,
      description: recipe.description || undefined,
      images: imageUrl ? [imageUrl] : undefined,
    },
    robots: { index: true, follow: true },
  } as any;
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const recipe = await fetchRecipeByParts(slug);
  if (!recipe) notFound();

  const base = ENV.SITE_URL;
  const path = (slug && slug.length > 1) ? `${slug[0]}/${slug.slice(1).join('/')}` : (slug && slug[0]) ? slug[0] : '';
  const canonical = `${base}/recipes/${path}`;
  const toAbs = (u?: string) => {
    if (!u) return undefined;
    const rel = /^https?:/i.test(u) ? u : '/' + (u.startsWith('/') ? u.slice(1) : u);
    return new URL(rel, base).toString();
  };
  const ingredients = recipe.ingredients
    ? recipe.ingredients.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    : undefined;
  const instructions =
    recipe.steps && recipe.steps.length > 0
      ? recipe.steps.map((s) => ({
          '@type': 'HowToStep',
          text: s.description,
          image: toAbs(s.imagePath ?? undefined),
        }))
      : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description || undefined,
    image: recipe.thumbnailImage ? [toAbs(recipe.thumbnailImage)] : undefined,
    datePublished: (recipe as any).createdAt,
    dateModified: (recipe as any).updatedAt,
    author: recipe.author?.name ? { '@type': 'Person', name: recipe.author.name } : undefined,
    recipeYield: recipe.servings ? `${recipe.servings} servings` : undefined,
    totalTime: recipe.cookingTime ? `PT${recipe.cookingTime}M` : undefined,
    recipeIngredient: ingredients,
    recipeInstructions: instructions,
    mainEntityOfPage: canonical,
  } as Record<string, unknown>;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <RecipeDetailClient id={recipe.id} initial={recipe} />
    </>
  );
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  try {
    const apiBase = ENV.API_BASE_URL.replace(/\/+$/, '');
    const res = await fetch(`${apiBase}/feed/popular?limit=200`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json: any = await res.json().catch(() => null);
    const list = (json?.data?.recipes ?? json?.recipes ?? []) as any[];
    return list
      .map((r) => (r?.slugPath ? r.slugPath.split('/') : (r?.region && r?.slug ? [r.region, r.slug] : null)))
      .filter(Boolean) as { slug: string[] }[];
  } catch {
    return [];
  }
}



import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import RecipeDetailClient from '@/app/recipes/_client/RecipeDetailClient';
import { mapRecipeDetail, type RecipeDetail } from '@/lib/api/recipes';
import { ENV } from '@/lib/env';

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
          image: toAbs(s.imagePath),
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



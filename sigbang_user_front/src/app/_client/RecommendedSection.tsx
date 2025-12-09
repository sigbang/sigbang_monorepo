"use client";
import Section from '@/components/Section';
import { useRecommendedFeed } from '@/lib/hooks/feed';
import { toRecipeCardItem } from '@/lib/mappers/recipeCard';

export default function RecommendedSection() {
  const recommended = useRecommendedFeed(6);
  const items = (recommended.data?.pages.flatMap((p) => p.recipes) ?? []).map((r) => toRecipeCardItem(r as any));

  return <Section title="추천 레시피" items={items} loading={recommended.status === 'pending'} />;
}



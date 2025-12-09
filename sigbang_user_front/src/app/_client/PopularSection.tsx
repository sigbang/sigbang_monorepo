"use client";

import Section from '@/components/Section';
import { usePopularFeed } from '@/lib/hooks/feed';
import { toRecipeCardItem } from '@/lib/mappers/recipeCard';

export default function PopularSection() {
  const popular = usePopularFeed(6);
  const items = (popular.data?.pages.flatMap((p) => p.recipes) ?? []).map((r) => toRecipeCardItem(r as any));

  return <Section title="지금 인기 레시피" items={items} loading={popular.status === 'pending'} />;
}



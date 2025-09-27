export type Recipe = {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  thumbnailImage?: string;
  thumbnailPath?: string;
};

export type PaginatedRecipes = {
  recipes: Recipe[];
  nextCursor?: string | null;
};



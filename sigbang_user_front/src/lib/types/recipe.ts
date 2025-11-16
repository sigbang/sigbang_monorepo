export type Recipe = {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  thumbnailImage?: string;
  thumbnailPath?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  cookingTime?: number;
  servings?: number;
  difficulty?: string;
  ingredients?: string;
  author?: {
    id: string;
    nickname?: string;
    profileImage?: string;
  };
  tags?: Array<{
    name: string;
    emoji?: string;
  }>;
  steps?: Array<{
    order: number;
    description: string;
    imageUrl?: string;
  }>;
  isLiked?: boolean;
  isSaved?: boolean;
  viewCount?: number;
  likesCount?: number;
  commentsCount?: number;
};

export type PaginatedRecipes = {
  recipes: Recipe[];
  nextCursor?: string | null;
};

export type SearchPageInfo = {
  limit: number;
  nextCursor?: string | null;
  total: number;
  totalPages: number;
  newCount: number;
};

export type SearchResponse = {
  data: {
    recipes: Recipe[];
    pageInfo: SearchPageInfo;
  };
};



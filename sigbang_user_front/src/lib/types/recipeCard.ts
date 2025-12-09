import type { Recipe } from './recipe';

// 공통 레시피 카드에서 사용하는 최소/표준 필드 정의
export type RecipeCardItem = {
  id: string;
  title: string;
  image: string;
  minutes?: number;
  description?: string;
  likesCount?: number;
  viewCount?: number;
  liked?: boolean;
  saved?: boolean;
  authorAvatar?: string;
  authorId?: string;
  stepImages?: string[];
  slug?: string;
  region?: string;
  slugPath?: string;
};

// API Recipe 타입에 피드/검색/유저 엔드포인트에서 추가로 붙는 필드를 포함한 유연한 타입
export type RichRecipe = Recipe & {
  thumbnailPath?: string;
  region?: string;
  slug?: string;
  slugPath?: string;
  steps?: Array<
    {
      order: number;
      description: string;
      imageUrl?: string;
    } & { imagePath?: string }
  >;
};



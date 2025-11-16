export type PublicUser = {
  id: string;
  email?: string | null;
  nickname?: string | null;
  name?: string | null;
  profileImage?: string | null;
  image?: string | null;
  bio?: string | null;
  createdAt?: string | null;
  recipesCount?: number | null;
  relation?: {
    isFollowing?: boolean;
    isFollowedBy?: boolean;
  } | null;
  // Follower/Following list specific
  followedAt?: string | null;
  isFollowing?: boolean; // present in list entries
  isFollowedBy?: boolean; // present in list entries
};

export type PaginatedUsers = {
  users: PublicUser[];
  nextCursor?: string | null;
};



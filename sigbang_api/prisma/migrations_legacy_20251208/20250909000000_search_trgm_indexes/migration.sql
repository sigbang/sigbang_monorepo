-- Enable pg_trgm extension for similarity and % operators
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Ensure altTitles column exists as text[] on recipes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'altTitles'
  ) THEN
    ALTER TABLE recipes ADD COLUMN "altTitles" text[] NOT NULL DEFAULT ARRAY[]::text[];
  END IF;
END $$;

-- Create required tables if missing
CREATE TABLE IF NOT EXISTS recipe_counters (
  id TEXT PRIMARY KEY,
  "recipeId" TEXT UNIQUE NOT NULL,
  "views7d" INTEGER NOT NULL DEFAULT 0,
  "saves7d" INTEGER NOT NULL DEFAULT 0,
  "likes7d" INTEGER NOT NULL DEFAULT 0,
  "trendScore" DECIMAL(6,4) NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipe_events (
  id TEXT PRIMARY KEY,
  "recipeId" TEXT NOT NULL,
  type TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS editorial_boosts (
  id TEXT PRIMARY KEY,
  "recipeId" TEXT UNIQUE NOT NULL,
  boost DECIMAL(3,2) NOT NULL,
  "expiresAt" TIMESTAMP(3)
);

-- Add FKs if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'recipe_counters_recipeId_fkey'
  ) THEN
    ALTER TABLE recipe_counters
      ADD CONSTRAINT recipe_counters_recipeId_fkey
      FOREIGN KEY ("recipeId") REFERENCES recipes(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'recipe_events_recipeId_fkey'
  ) THEN
    ALTER TABLE recipe_events
      ADD CONSTRAINT recipe_events_recipeId_fkey
      FOREIGN KEY ("recipeId") REFERENCES recipes(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'editorial_boosts_recipeId_fkey'
  ) THEN
    ALTER TABLE editorial_boosts
      ADD CONSTRAINT editorial_boosts_recipeId_fkey
      FOREIGN KEY ("recipeId") REFERENCES recipes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- TRGM indexes for text search on recipes
CREATE INDEX IF NOT EXISTS idx_recipes_title_trgm
  ON recipes USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_recipes_ingredients_trgm
  ON recipes USING GIN (ingredients gin_trgm_ops);

-- Trend score keyset pagination index
CREATE INDEX IF NOT EXISTS idx_recipe_counters_trendscore_desc
  ON recipe_counters ("trendScore" DESC, "recipeId" DESC);

-- CreatedAt desc index for fallback/latest feeds and tie-breaker id
CREATE INDEX IF NOT EXISTS idx_recipes_created_desc
  ON recipes ("createdAt" DESC, id DESC);



-- Ensure pg_trgm extension is available for similarity() and % operators
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add sane defaults for recipe_counters / recipe_events / editorial_boosts IDs
ALTER TABLE recipe_counters
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE recipe_events
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE editorial_boosts
  ALTER COLUMN id SET DEFAULT gen_random_uuid();



-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- recipe_counters: add defaults for id and updatedAt
ALTER TABLE recipe_counters
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- recipe_events: add default for id (prevent future raw inserts failing)
ALTER TABLE recipe_events
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- editorial_boosts: add default for id (prevent future raw inserts failing)
ALTER TABLE editorial_boosts
  ALTER COLUMN id SET DEFAULT gen_random_uuid();



-- Create enum type for user status if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'UserStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "UserStatus" AS ENUM ('ACTIVE','SUSPENDED','DELETED');
  END IF;
END$$;

-- Add new columns on users
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;

-- Backfill status/deletedAt from isActive
-- Mark inactive users as DELETED and set deletedAt
UPDATE "users"
SET "status" = 'DELETED', "deletedAt" = COALESCE("deletedAt", NOW())
WHERE "isActive" = false;

-- Ensure active users are ACTIVE
UPDATE "users"
SET "status" = 'ACTIVE'
WHERE "isActive" = true;

-- Allow NULL authorId on recipes/comments and update FKs to ON DELETE SET NULL
-- Recipes
ALTER TABLE "recipes" ALTER COLUMN "authorId" DROP NOT NULL;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'recipes'
      AND tc.constraint_name = 'recipes_authorId_fkey'
  ) THEN
    ALTER TABLE "recipes" DROP CONSTRAINT "recipes_authorId_fkey";
  END IF;
END $$;
ALTER TABLE "recipes"
  ADD CONSTRAINT "recipes_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Comments
ALTER TABLE "comments" ALTER COLUMN "authorId" DROP NOT NULL;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'comments'
      AND tc.constraint_name = 'comments_authorId_fkey'
  ) THEN
    ALTER TABLE "comments" DROP CONSTRAINT "comments_authorId_fkey";
  END IF;
END $$;
ALTER TABLE "comments"
  ADD CONSTRAINT "comments_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Nullify authorId for content authored by deleted users
UPDATE "recipes" r
SET "authorId" = NULL
WHERE r."authorId" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "users" u
    WHERE u."id" = r."authorId" AND u."status" = 'DELETED'
  );

UPDATE "comments" c
SET "authorId" = NULL
WHERE c."authorId" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "users" u
    WHERE u."id" = c."authorId" AND u."status" = 'DELETED'
  );

-- Finally, drop legacy column
ALTER TABLE "users" DROP COLUMN IF EXISTS "isActive";



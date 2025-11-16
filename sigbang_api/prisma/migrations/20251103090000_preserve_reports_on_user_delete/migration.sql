-- Make reports.reporterId nullable and preserve reports on user delete

-- Allow NULL reporterId
ALTER TABLE "reports" ALTER COLUMN "reporterId" DROP NOT NULL;

-- Drop existing FK if present
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'reports'
      AND tc.constraint_name = 'reports_reporterId_fkey'
  ) THEN
    ALTER TABLE "reports" DROP CONSTRAINT "reports_reporterId_fkey";
  END IF;
END $$;

-- Recreate FK with ON DELETE SET NULL (preserve reports)
ALTER TABLE "reports"
  ADD CONSTRAINT "reports_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Helpful index for retention purge scanning
CREATE INDEX IF NOT EXISTS "users_status_deletedAt_idx" ON "users"("status", "deletedAt");



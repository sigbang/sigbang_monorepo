-- AlterTable
ALTER TABLE "editorial_boosts" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "recipe_counters" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "recipe_events" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "aiQualityScore" DOUBLE PRECISION,
ADD COLUMN     "aiQualityUpdatedAt" TIMESTAMP(3);

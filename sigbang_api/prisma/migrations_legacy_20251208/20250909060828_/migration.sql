-- DropForeignKey
ALTER TABLE "editorial_boosts" DROP CONSTRAINT "editorial_boosts_recipeid_fkey";

-- DropForeignKey
ALTER TABLE "recipe_counters" DROP CONSTRAINT "recipe_counters_recipeid_fkey";

-- DropForeignKey
ALTER TABLE "recipe_events" DROP CONSTRAINT "recipe_events_recipeid_fkey";

-- DropIndex
DROP INDEX "idx_recipe_counters_trendscore_desc";

-- DropIndex
DROP INDEX "idx_recipes_created_desc";

-- DropIndex
DROP INDEX "idx_recipes_ingredients_trgm";

-- DropIndex
DROP INDEX "idx_recipes_title_trgm";

-- AlterTable
ALTER TABLE "recipe_counters" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "recipe_counters" ADD CONSTRAINT "recipe_counters_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_events" ADD CONSTRAINT "recipe_events_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editorial_boosts" ADD CONSTRAINT "editorial_boosts_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

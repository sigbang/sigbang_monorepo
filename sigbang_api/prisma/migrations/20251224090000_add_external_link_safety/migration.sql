-- CreateEnum
CREATE TYPE "LinkSafetyGrade" AS ENUM ('SAFE', 'UNKNOWN', 'BLOCK');

-- CreateEnum
CREATE TYPE "ExternalLinkEventType" AS ENUM ('RENDERED', 'CLICKED');

-- AlterTable
ALTER TABLE "recipes"
  ADD COLUMN "linkFinalUrl" TEXT,
  ADD COLUMN "linkHost" TEXT,
  ADD COLUMN "linkSafetyGrade" "LinkSafetyGrade",
  ADD COLUMN "linkCheckedAt" TIMESTAMP(3),
  ADD COLUMN "linkRedirectCount" INTEGER,
  ADD COLUMN "linkHttpStatus" INTEGER,
  ADD COLUMN "linkThreatTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "linkDisabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "external_link_events" (
  "id" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  "userId" TEXT,
  "type" "ExternalLinkEventType" NOT NULL,
  "actionType" TEXT,
  "isAutoRedirect" BOOLEAN NOT NULL DEFAULT false,
  "url" TEXT,
  "finalUrl" TEXT,
  "userAgent" TEXT,
  "ip" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "external_link_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "external_link_events_recipeId_createdAt_idx" ON "external_link_events"("recipeId", "createdAt");

-- CreateIndex
CREATE INDEX "external_link_events_userId_createdAt_idx" ON "external_link_events"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "external_link_events" ADD CONSTRAINT "external_link_events_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_link_events" ADD CONSTRAINT "external_link_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;



-- CreateEnum
CREATE TYPE "LifecycleEventType" AS ENUM ('SIGN_UP', 'DELETE', 'REACTIVATE', 'SUSPEND', 'UNSUSPEND', 'LOGIN', 'LOGOUT', 'PASSWORD_RESET', 'PROFILE_UPDATE');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'ADMIN', 'SYSTEM');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "user_lifecycle_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LifecycleEventType" NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "prevStatus" "UserStatus",
    "nextStatus" "UserStatus",
    "reason" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_lifecycle_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_lifecycle_events_userId_createdAt_idx" ON "user_lifecycle_events"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "user_lifecycle_events" ADD CONSTRAINT "user_lifecycle_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

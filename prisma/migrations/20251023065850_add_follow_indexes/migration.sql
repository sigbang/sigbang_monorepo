-- CreateIndex
CREATE INDEX "follows_followingId_createdAt_idx" ON "follows"("followingId", "createdAt");

-- CreateIndex
CREATE INDEX "follows_followerId_createdAt_idx" ON "follows"("followerId", "createdAt");

-- Recommendation events and results
CREATE TABLE IF NOT EXISTS recommendation_events (
  id TEXT PRIMARY KEY,
  "userId" TEXT NULL,
  "anonId" TEXT NULL,
  "sessionId" TEXT NULL,
  surface TEXT NOT NULL,
  type TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  position INTEGER NULL,
  "rankScore" DECIMAL(10,4) NULL,
  "expId" TEXT NULL,
  "expVariant" TEXT NULL,
  seed TEXT NULL,
  cursor TEXT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS recommendation_events_idx1
  ON recommendation_events (surface, type, "expId", "expVariant", "createdAt");
CREATE INDEX IF NOT EXISTS recommendation_events_idx2
  ON recommendation_events ("userId", "createdAt");

-- Model registry
CREATE TABLE IF NOT EXISTS reco_model_registry (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT FALSE,
  meta JSONB NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reco_model_registry_unique UNIQUE (name, version)
);

-- User recommendations cache
CREATE TABLE IF NOT EXISTS user_recommendations (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "modelId" TEXT NOT NULL,
  items JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS user_recommendations_user_model
  ON user_recommendations ("userId", "modelId");
CREATE INDEX IF NOT EXISTS user_recommendations_model_updated
  ON user_recommendations ("modelId", "updatedAt");



# Sigbang Curation & Recommendation MVP Guide

This document describes the end-to-end pipeline we just added for recipe curation and recommendations at MVP scale.

## Overview

- Event logging: Impressions (batch) and Click (single) for feed/popular/recommended surfaces.
- Experiment assignment: Stable hash A/B with experiment metadata returned to clients and written to events.
- Ranking logic (MVP): Heuristic trend scoring, daily seed shuffle, exploration slots and seasonal boosts.
- Training/serving: Daily batch “Top-N per user” precompute with a simple heuristic model registry.
- Rollout and monitoring: Stepwise A/B, CTR/save-rate dashboards, quick rollback.

---

## Backend

### Event logging endpoints

- POST `/events/reco/impressions`
  - Body:

```json
{
  "surface": "feed",
  "expId": "feed_algo_v1",
  "expVariant": "A",
  "seed": "u:USER_OR_DATE",
  "cursor": "base64cursor",
  "sessionId": "optional",
  "items": [
    { "recipeId": "uuid", "position": 0, "rankScore": 1.234 }
  ]
}
```

- POST `/events/reco/click`
  - Body:

```json
{
  "surface": "popular",
  "recipeId": "uuid",
  "position": 3,
  "rankScore": 0.998,
  "expId": "popular_algo_v1",
  "expVariant": "B",
  "seed": "u:USER_OR_DATE",
  "sessionId": "optional"
}
```

- Headers (client → server): `x-device-id` (required for anon stability), `x-device-name` (optional)

Files:
- `sigbang_api/src/events/dto/reco-events.dto.ts`
- `sigbang_api/src/events/reco-events.service.ts`
- `sigbang_api/src/events/reco-events.controller.ts`
- `sigbang_api/src/events/events.module.ts`


### Experiment assignment

- Stable assignment by `assignVariant(expKey, subject, splitB)`
- Subject is `userId` if logged in; otherwise `x-device-id`
- Response headers (set by controller):
  - Feed: `X-Exp-FeedAlgo: feed_algo_v1:A|B`
  - Popular: `X-Exp-PopularAlgo: popular_algo_v1:A|B`
  - Recommended: `X-Exp-RecommendAlgo: recommend_algo_v1:A|B`
- Response body includes:

```json
{ "experiment": { "id": "feed_algo_v1", "variant": "A" } }
```

File:
- `sigbang_api/src/common/exp/exp.util.ts` (assignVariant)
- Header/body integration in `sigbang_api/src/recipes/feed.controller.ts`


### Database schema

Prisma models:

```prisma
model RecommendationEvent {
  id         String   @id @default(uuid())
  userId     String?
  anonId     String?
  sessionId  String?
  surface    String
  type       String   // 'impression' | 'click'
  recipeId   String
  position   Int?
  rankScore  Decimal? @db.Decimal(10, 4)
  expId      String?
  expVariant String?
  seed       String?
  cursor     String?
  createdAt  DateTime @default(now())
  @@index([surface, type, expId, expVariant, createdAt])
  @@index([userId, createdAt])
  @@map("recommendation_events")
}

model RecoModelRegistry {
  id        String   @id @default(uuid())
  name      String
  version   String
  isActive  Boolean  @default(false)
  meta      Json?
  createdAt DateTime @default(now())
  @@unique([name, version])
  @@map("reco_model_registry")
}

model UserRecommendations {
  id        String   @id @default(uuid())
  userId    String
  modelId   String
  items     Json     // [{recipeId, score}]
  updatedAt DateTime @updatedAt
  @@unique([userId, modelId])
  @@index([modelId, updatedAt])
  @@map("user_recommendations")
}
```

Migration:
- `sigbang_api/prisma/migrations/20251203_reco_events_and_results/migration.sql`

CI deploy runs `prisma migrate deploy`:
- `.github/workflows/api-deploy.yml` (deploy job)

---

## Training & Serving

Daily batch (KST 03:30):
- Workflow: `.github/workflows/reco-train.yml`
- Script: `reco/train.py`
- Env: `DATABASE_URL` secret required

What it does:
1) Upserts a heuristic model version in `reco_model_registry` and marks it active.
2) Loads top recipes by `recipe_counters.trendScore` (falls back to `viewCount+recency`).
3) Selects up to 500 recently active users.
4) Writes Top-50 per user to `user_recommendations` (JSON list of `{recipeId, score}`).

Future switch: Replace heuristic with ML scoring and expand features. This registry structure and workflow are compatible.

Smoke output (workflow logs):

```json
{"ok": true, "modelId": "uuid", "users": 123, "tookMs": 1234}
```

---

## Flutter Client

Headers:
- `ApiClient` automatically sets `x-device-id` and `x-device-name` for every request.

Impressions:
- `RecipeService` auto-logs impressions for feed/popular/recommended on list fetch.

Clicks:
- Feed list item tap logs click automatically in `FeedPage`:

```dart
getIt<RecipeService>().logClick(surface: 'feed', recipeId: recipe.id, position: index);
```

- Popular carousel and Recommended grid click logging in `HomePage`:

```dart
// Popular
getIt<RecipeService>().logClick(surface: 'popular', recipeId: recipe.id, position: index);
// Recommended
getIt<RecipeService>().logClick(surface: 'recommended', recipeId: recipe.id, position: index);
```

Service:
- `sigbang_flutter/lib/data/datasources/analytics_service.dart`
- `sigbang_flutter/lib/data/datasources/recipe_service.dart` (impressions + logClick)

---

## Ranking (MVP)

- Popular: Trend score (time-decayed views + engagement), daily seed shuffle, low-exposure/new content slots.
- Recommended: Personalized heuristic (follow/tags/engagement/recency + seasonal boost); cold-start blends trend + exploration.
- Feed: Interleaving follow/global with constraints, daily seed shuffle for global pool, periodic exploration slots.

Files:
- `sigbang_api/src/recipes/recipes.service.ts`

---

## Rollout & Monitoring

1) Turn on logging; verify ingestion.
2) Start with B=0% → 10% → 50% using headers/assignment.
3) Monitor CTR/save-rate by day/surface/position/variant.

Sample query (CTR):

```sql
SELECT
  date_trunc('day', "createdAt") AS day,
  surface,
  "expId",
  "expVariant",
  COUNT(*) FILTER (WHERE type = 'impression') AS impressions,
  COUNT(*) FILTER (WHERE type = 'click') AS clicks,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE type = 'click')
    / NULLIF(COUNT(*) FILTER (WHERE type = 'impression'), 0), 2
  ) AS ctr_pct
FROM recommendation_events
WHERE "createdAt" >= now() - interval '14 days'
GROUP BY 1,2,3,4
ORDER BY 1 DESC, 2, 3, 4;
```

Rollback:
- Disable experiment flag or stick to variant A (controllers already return experiment metadata; you can gate B by env).
- Heuristic ranking remains as fallback.

---

## Troubleshooting

- No events in DB:
  - Check `x-device-id` header sent (Flutter `ApiClient` sets it).
  - Verify `/events/reco/*` endpoints reachable (CORS, auth optional).
- CTR is 0:
  - Confirm click logging in UI taps was wired (`FeedPage`, `HomePage`).
  - Ensure impressions fire after fetch (auto in `RecipeService`).
- Training workflow fails:
  - Verify `DATABASE_URL` secret and DB IP allowlist.
  - Check tables exist (`prisma migrate deploy` on deploy).

---

## Next steps

- Add save-rate and dwell-based labels for model training.
- Gradually introduce feature-based ranking (LightGBM/LogReg) and re-rank on API.
- Dashboards for A/B (CTR/save-rate) by surface and position.



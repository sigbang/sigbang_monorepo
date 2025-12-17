# 식방 큐레이션/추천 MVP 운영 가이드

본 문서는 현재 도입된 레시피 큐레이션/추천 파이프라인(MVP)을 끝단까지 요약합니다.

## 개요

- 이벤트 로깅: 피드/인기/추천 서피스에 대한 노출(배치)·클릭(단건) 수집
- 실험 배정: 안정 해시 기반 A/B, 응답 헤더·바디에 실험 메타 포함 및 이벤트에 기록
- 랭킹 로직(MVP): 휴리스틱 트렌드 점수, 일간 시드 셔플, 탐색 슬롯, 계절성 부스트
- 학습/서빙: 매일 배치로 사용자별 Top-N 사전계산(간단 모델 레지스트리)
- 롤아웃/모니터링: 단계적 A/B, CTR/저장률 대시보드, 빠른 롤백

---

## 백엔드

### 이벤트 로깅 엔드포인트

- POST `/events/reco/impressions`
  - Body 예시:

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
  - Body 예시:

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

- 공통 요청 헤더(클라이언트 → 서버): `x-device-id`(익명 안정성 필수), `x-device-name`(선택)

관련 파일:
- `sigbang_api/src/events/dto/reco-events.dto.ts`
- `sigbang_api/src/events/reco-events.service.ts`
- `sigbang_api/src/events/reco-events.controller.ts`
- `sigbang_api/src/events/events.module.ts`


### 실험 배정

- `assignVariant(expKey, subject, splitB)`로 안정 해시 배정
- subject: 로그인 시 `userId`, 비로그인 시 `x-device-id`
- 응답 헤더(컨트롤러에서 설정):
  - Feed: `X-Exp-FeedAlgo: feed_algo_v1:A|B`
  - Popular: `X-Exp-PopularAlgo: popular_algo_v1:A|B`
  - Recommended: `X-Exp-RecommendAlgo: recommend_algo_v1:A|B`
- 응답 바디 예시:

```json
{ "experiment": { "id": "feed_algo_v1", "variant": "A" } }
```

관련 파일:
- `sigbang_api/src/common/exp/exp.util.ts` (assignVariant)
- 응답 헤더/바디 포함: `sigbang_api/src/recipes/feed.controller.ts`


### 데이터베이스 스키마

Prisma 모델:

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

마이그레이션:
- `sigbang_api/prisma/migrations/20251203_reco_events_and_results/migration.sql`

배포 시 `prisma migrate deploy` 실행:
- `.github/workflows/api-deploy.yml` (deploy job)

---

## 학습 & 서빙

매일 배치(KST 03:30):
- 워크플로: `.github/workflows/reco-train.yml`
- 스크립트: `reco/train.py`
- 환경: GitHub Secrets `DATABASE_URL` 필요

동작:
1) `reco_model_registry`에 휴리스틱 모델 버전을 upsert하고 활성화
2) `recipe_counters.trendScore` 기반 상위 레시피 로드(부족 시 `viewCount+최근성` 대체)
3) 최근 활성 사용자 최대 500명 선택
4) 사용자별 Top-50을 `user_recommendations`에 저장(JSON `[{recipeId, score}]`)

향후 전환: 휴리스틱 → ML 스코어링으로 치환, 피처 확장. 현 구조/워크플로와 호환됩니다.

스모크 출력(워크플로 로그):

```json
{"ok": true, "modelId": "uuid", "users": 123, "tookMs": 1234}
```

---

## Flutter 클라이언트

헤더:
- `ApiClient`가 모든 요청에 `x-device-id`/`x-device-name` 자동 포함

노출(Impressions):
- `RecipeService`가 피드/인기/추천 목록 응답 후 자동으로 배치 노출 전송

클릭(Clicks):
- 피드(Feed) 리스트 아이템 탭 시 `FeedPage`에서 자동 전송:

```dart
getIt<RecipeService>().logClick(surface: 'feed', recipeId: recipe.id, position: index);
```

- 홈(Home) 인기/추천에서도 탭 시 전송:

```dart
// Popular
getIt<RecipeService>().logClick(surface: 'popular', recipeId: recipe.id, position: index);
// Recommended
getIt<RecipeService>().logClick(surface: 'recommended', recipeId: recipe.id, position: index);
```

관련 파일:
- `sigbang_flutter/lib/data/datasources/analytics_service.dart`
- `sigbang_flutter/lib/data/datasources/recipe_service.dart` (노출 자동 + 클릭 로깅)

---

## 랭킹(MVP)

- 인기(Popular): 트렌드 점수(시간감쇠 조회+참여), 일간 시드 셔플, 저노출/신규 슬롯
- 추천(Recommended): 개인화 휴리스틱(팔로우/태그/참여/최근성 + 계절성 부스트), 콜드스타트 혼합(트렌드+탐색)
- 피드(Feed): 팔로우/글로벌 인터리빙 + 제약, 글로벌 일간 셔플, 주기적 탐색 슬롯

관련 파일:
- `sigbang_api/src/recipes/recipes.service.ts`

---

## 롤아웃 & 모니터링

1) 로깅 ON → 적재 확인  
2) B=0% → 10% → 50% 단계 확장(헤더/배정 기반)  
3) 일/서피스/포지션/변수(variant)별 CTR·저장률 모니터링

CTR 샘플 쿼리:

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

롤백:
- 실험 플래그 OFF 또는 A 고정(컨트롤러는 실험 메타를 이미 반환함, B는 env로 게이팅)
- 랭킹 휴리스틱은 항상 폴백으로 유지

---

## 트러블슈팅

- DB에 이벤트가 없음:
  - `x-device-id` 헤더 전송 확인(Flutter `ApiClient`가 자동 첨부)
  - `/events/reco/*` 엔드포인트 접근 가능(CORS/인증 옵션) 확인
- CTR이 0:
  - UI 탭에서 클릭 로깅 연결 여부 확인(`FeedPage`, `HomePage`)
  - 목록 호출 후 노출 전송되는지 확인(`RecipeService` 자동)
- 학습 워크플로 실패:
  - `DATABASE_URL` 시크릿/DB IP 허용 확인
  - 테이블 존재 여부 확인(배포 시 `prisma migrate deploy`)

---

## 다음 단계

- 저장률·체류 기반 라벨 도입 및 모델 학습
- 피처 기반 랭킹(LightGBM/LogReg) 도입 후 API 리랭크
- 서피스/포지션별 A/B 대시보드(CTR/저장률) 구축

## 앞으로를 위한 제안 (간단 정리)
- 이미 베이스가 잘 깔려 있어서, 다음 스텝은 “룰 기반 → 진짜 모델/CF 기반”으로 서서히 갈아타는 것이 좋겠습니다.

1) 단계 1: 이벤트 로그 기반의 간단한 ML 랭커 도입
recommendation_events + 기존 recipe_counters / 태그 / 저자 / 유저 활동 로그를 합쳐 offline에서 logistic regression / LightGBM 등의 랭킹 모델을 하나 학습.
지금의 reco/train.py 를 “피처 생성 + 모델 학습 + user_recommendations 스코어 채우기”로 확장.
reco_model_registry.meta 에 모델 타입/특징/피처 버전을 저장해서 롤백·A/B 용이하게.

2) 단계 2: 협업 필터링 / embedding 기반 candidate 생성
유저–레시피 implicit feedback(뷰/좋아요/저장/클릭)을 기반으로 MF/embedding 모델을 만들어서 candidate set을 뽑고,
지금의 휴리스틱/ML 랭커는 re-ranker 역할로 쓰도록 2-stage 구조로 확장.
3) 단계 3: 모니터링 & 실험 강화
이미 문서에 있는 CTR/저장률 쿼리(docs/recommendation_curation_guide_ko.md)를 활용해, Metabase/BI에 정기 대시보드를 붙여 배치 모델별 실험 성능을 상시 모니터링.
expId/expVariant 를 모델 버전과 매핑해서, 모델 교체가 CTR/저장률에 미치는 영향을 빠르게 확인.

4) 단계 4: AGI 초개인화 방향
장기적으로는
유저 프로필/세션 컨텍스트/자연어 레시피 설명을 통합한 LLM·embedding 기반 유저/레시피 표현
현재 구조(모델 레지스트리 + user_recommendations + realtime 랭커)를 유지한 채,
“후단 re-ranker만 LLM/AGI로 교체” → “전단 candidate generation까지 AGI 화” 순으로 리스크를 나누어 도입하는 전략이 자연스럽습니다.

## 정리
- 현재 진행 상황은:
- 로그/스키마/AB/노출·클릭 수집 → 정상적으로 설계·구현됨
- GitHub Actions + train.py 로 배치 추천 결과 생성 파이프라인 존재
- API/프론트가 이를 사용하고, 추가로 휴리스틱 개인화 랭커가 이미 동작 중
- 부족한 점은:
- train.py 가 아직 협업필터링/콘텐츠 기반 ML 모델이 아니라 단순 인기 Top-N이라는 것
- recommendation_events 를 활용한 모델 학습·평가 코드가 아직 없음
- 따라서, “MVP 간단 추천 모델 + 자동 파이프라인” 관점에서는 이미 잘 진행 중이고,

협업필터링/ML·AGI 단계로 확장을 위한 기반도 충분히 준비된 상태라고 보셔도 됩니다.
원하시면, 다음 단계용으로 “구체적인 피처 정의 + 최소 ML 파이프라인 스ケ치”를 더 자세히 적어드릴게요 (예: 어떤 SQL/피처로 첫 LightGBM 랭커를 만들지 등)

---

# 🌱 Prisma DB 스키마 변경/반영 플로우 가이드

이 문서는 `sigbang_api`에서 **Prisma 스키마를 수정하고, 로컬 DB → 프로덕션 DB까지 안전하게 반영하는 전체 흐름**을 정리합니다.

대상:
- `sigbang_api/prisma/schema.prisma` 수정이 필요한 모든 백엔드 개발자
- DB 마이그레이션(스키마 변경)을 프로덕션에 반영해야 하는 사람

---

## 1. 전체 흐름 한눈에 보기

1. **스키마 수정**: `sigbang_api/prisma/schema.prisma` 수정
2. **로컬에서 마이그레이션 생성/적용**: `npx prisma migrate dev --name <이름>`
3. **동작 확인**: 로컬에서 API 실행 및 테스트
4. **코드 & 마이그레이션 커밋/PR**: `schema.prisma` + `prisma/migrations/**` 포함
5. **메인 머지 → GitHub Actions**
   - `.github/workflows/api-deploy.yml`의 `db-migrate-prod` 잡이
   - `npx prisma migrate deploy --schema=./prisma/schema.prisma` 로 **프로덕션 DB에 마이그레이션 적용**
6. **배포 컨테이너 교체**: 동일 워크플로 내 `deploy-api-eic` 잡에서 새 이미지로 교체

```mermaid
flowchart LR
  A[로컬 schema.prisma 수정] --> B[prisma migrate dev]
  B --> C[로컬 API 테스트]
  C --> D[코드 + migrations 커밋/PR]
  D --> E[main 머지]
  E --> F[GitHub Actions: db-migrate-prod]
  F --> G[prisma migrate deploy (prod DB)]
  G --> H[새 API 이미지 배포]
```

---

## 2. 로컬 개발 환경에서의 변경 플로우

### 2.1 사전 준비

```bash
cd sigbang_api
cp .env.example .env   # 최초 1회
# .env 내 DATABASE_URL 을 로컬/개발용 DB로 설정

npm install            # 의존성 설치(최초 1회)
npx prisma generate    # 클라이언트 생성(스키마 바뀔 때마다 권장)
```

### 2.2 스키마 수정

- 파일: `sigbang_api/prisma/schema.prisma`
- 예: 테이블 컬럼 추가, 인덱스 추가, 새로운 모델 추가 등

수정 후 **포맷 및 유효성 검사**:

```bash
npx prisma format
npx prisma validate
```

### 2.3 마이그레이션 생성 (권장)

> 프로덕션에 반영될 변경은 **반드시 마이그레이션 파일로 남기는 것**을 원칙으로 합니다.

```bash
npx prisma migrate dev --name add_reco_events_table --schema=./prisma/schema.prisma
```

- 수행 결과
  - `prisma/migrations/<timestamp>_add_reco_events_table/` 디렉터리 생성
  - 로컬 DB에 스키마 변경 적용
- 필요 시:
  - `npx prisma generate` 재실행 (타입/클라이언트 갱신)

### 2.4 (참고) db push는 언제 쓰나?

- `npx prisma db push` 는 **실험용/로컬 전용**으로만 사용합니다.
- 특징:
  - 마이그레이션 파일을 생성하지 않고 DB 스키마를 강제로 맞춰줌
  - 프로덕션/공유 DB에는 사용 **금지**
- 이 문서의 **정식 플로우는 항상 `migrate dev` + `migrate deploy` 기준**입니다.

---

## 3. 커밋/PR 규칙

### 3.1 반드시 포함해야 하는 파일

- `sigbang_api/prisma/schema.prisma`
- `sigbang_api/prisma/migrations/**` (이번 변경으로 새로 생성된 폴더 전체)

### 3.2 커밋 메시지 예시

- `feat(db): add reco events table`
- `chore(db): add index on recipe_counters`
- `fix(db): widen rankScore decimal precision`

### 3.3 PR 설명에 적으면 좋은 내용

- 어떤 테이블/컬럼이 추가/변경/삭제되었는지
- 데이터 마이그레이션(백필) 필요 여부
- 브레이킹 체인지 여부(기존 코드/쿼리와 호환성)

---

## 4. 프로덕션 반영 플로우 (GitHub Actions)

### 4.1 어떤 워크플로가 동작하나?

- 워크플로 파일: `.github/workflows/api-deploy.yml`
- 트리거:
  - `main` 브랜치에 `sigbang_api/**` 변경 사항이 push 될 때

a. **이미지 빌드 & 푸시** (`build-and-push` 잡)
- `sigbang_api` Docker 이미지를 빌드 후 GHCR로 푸시

b. **프로덕션 DB 마이그레이션** (`db-migrate-prod` 잡)
- `sigbang_api` 디렉터리에서 다음을 실행:

```bash
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

- 환경 변수:
  - `DATABASE_URL`, `DIRECT_URL` (GitHub Secrets)
- 역할:
  - 커밋된 `prisma/migrations/**` 를 순서대로 적용
  - 이미 적용된 마이그레이션은 스킵

c. **API 배포** (`deploy-api-eic` 잡)
- 위 두 잡 성공 후, EC2에 접속하여 새 이미지로 컨테이너 교체
- `/health` 로 헬스체크 후 실패 시 로그 출력 및 실패 처리

### 4.2 배포 상태 확인 방법

1. GitHub → `Actions` → `Deploy API` 워크플로 선택
2. 해당 커밋의 실행 로그에서
   - `db-migrate-prod` 잡 성공 여부
   - `prisma migrate deploy` 로그 확인 (마이그레이션 적용 내역)
3. `deploy-api-eic` 잡에서 컨테이너 상태 및 헬스체크 성공 여부 확인

---

## 5. 브레이킹/데이터 변경 시 안전 플로우

**컬럼 삭제, 타입 변경, NOT NULL 추가 등 브레이킹 변경**은 단계적으로 진행합니다.

### 5.1 컬럼 이름 변경 예시

1. **새 컬럼 추가** (nullable or default 제공)
   - 예: `old_column` → `newColumn`
2. 코드에서 **새 컬럼을 함께 쓰도록 수정**
   - write 시 `old_column`과 `newColumn` 둘 다 기록 (또는 백필 스크립트로 이전)
3. 충분한 기간 운영 후, `old_column` 사용 제거
4. 마지막에 `old_column` 삭제 마이그레이션 수행

### 5.2 데이터 백필이 필요한 경우

- 예: `isActive` 같은 새 Boolean 컬럼 추가 + 기본값 필요

플로우 예시:

1. 컬럼 추가 (nullable + default or nullable)
2. 마이그레이션 적용 후, **백필 SQL/스크립트** 실행
3. 코드에서 새 컬럼을 신뢰하도록 수정
4. 필요하다면 NOT NULL 제약을 별도 마이그레이션에서 추가

---

## 6. 트러블슈팅

### 6.1 `prisma migrate deploy` 실패

- GitHub Actions `db-migrate-prod` 로그를 확인
- 자주 보는 에러 유형:
  - 이미 존재하는 인덱스/컬럼 → 이전 수동 변경과 충돌
  - FK 제약 조건 위반 → 데이터 정합성 문제
- 대응 방법:
  - 실패한 SQL을 확인하고, staging/로컬에서 재현 후 수정 마이그레이션 작성
  - 필요한 경우, 문제 마이그레이션을 롤백하고 수정한 새 마이그레이션으로 교체 (주의 깊게 리뷰 필수)

### 6.2 로컬과 프로덕션 스키마가 다른 것 같을 때

```bash
npx prisma migrate status --schema=./prisma/schema.prisma
```

- 현재 DB에 적용된 마이그레이션과 코드 기준 마이그레이션 차이를 보여줍니다.
- 프로덕션 DB 상태는 GitHub Actions에서 같은 명령을 통해 확인 가능 (로그 참고).

### 6.3 실수로 `db push`를 프로덕션에 실행한 경우

- 즉시 팀에 공유하고, 그 시점의 스키마/마이그레이션 상태를 함께 점검해야 합니다.
- 가능하면 **수동 수정 대신 보정용 마이그레이션**을 작성하는 방향을 우선합니다.

---

## 7. 자주 쓰는 명령어 치트시트

```bash
# 스키마 포맷/검증
npx prisma format
npx prisma validate

# 로컬에서 마이그레이션 생성 + 적용
npx prisma migrate dev --name <change_name> --schema=./prisma/schema.prisma

# 프로덕션/공유 DB에 마이그레이션 적용 (CI에서 사용)
npx prisma migrate deploy --schema=./prisma/schema.prisma

# 현재 마이그레이션 상태 확인
npx prisma migrate status --schema=./prisma/schema.prisma

# (실험용/로컬 한정) 스키마 강제 동기화
npx prisma db push --schema=./prisma/schema.prisma
```

---

## 8. 요약

- **프로덕션에 갈 변경은 항상 `migrate dev` → `migrate deploy` 플로우로 관리**합니다.
- `schema.prisma` 변경 시, **마이그레이션 폴더까지 포함해서 커밋**해야 합니다.
- 메인 머지 후에는 GitHub Actions `Deploy API` 워크플로가 자동으로 **DB 마이그레이션 + API 배포**를 수행합니다.

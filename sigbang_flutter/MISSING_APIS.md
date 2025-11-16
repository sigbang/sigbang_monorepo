# 누락된 API 목록 및 더미 API 구현 요청

## 현재 구현된 API

### 인증 (Auth)
- ✅ `POST /auth/google` - Google OAuth 로그인
- ✅ `POST /auth/refresh` - 토큰 갱신 (ApiClient에서 자동 처리)
- ✅ `POST /auth/signout` - 로그아웃
- ✅ `POST /auth/signout-all` - 모든 기기에서 로그아웃

### 레시피 (Recipes)
- ✅ `GET /recipes/feed` - 피드 조회 (공개된 레시피만)
- ✅ `GET /recipes/:id` - 레시피 상세 조회
- ✅ `POST /recipes/draft` - 레시피 임시 저장 생성
- ✅ `PUT /recipes/draft/:id` - 레시피 임시 저장 수정
- ✅ `POST /recipes/:id/publish` - 레시피 공개
- ✅ `GET /recipes/draft` - 내 임시 저장 목록 조회
- ✅ `POST /recipes/:id/thumbnail` - 대표 이미지 업로드
- ✅ `POST /recipes/images` - 이미지 업로드 (단계별 이미지용)
- ✅ `DELETE /recipes/:id` - 레시피 삭제

## 누락된 API 및 구현 요청

### 1. 홈 화면 추천 API
**현재 상태**: 더미 데이터 사용 중 (`RecipeService.getRecommendedRecipes()`)

**필요한 API**:
```typescript
// 로그인 사용자용 추천
GET /recipes/recommendations
Headers: Authorization: Bearer {token}
Query: ?limit=6

// 비로그인 사용자용 추천  
GET /recipes/recommendations/public
Query: ?limit=6

Response:
{
  "recipes": [
    {
      "id": "uuid",
      "title": "레시피 제목",
      "description": "레시피 설명", 
      "thumbnailUrl": "https://...",
      "cookingTime": 30,
      "servings": 2,
      "difficulty": "EASY",
      "viewCount": 125,
      "likesCount": 24,
      "commentsCount": 8,
      "author": {
        "id": "uuid",
        "nickname": "작성자",
        "profileImage": "https://..."
      },
      "tags": [
        {"name": "한식", "emoji": "🇰🇷"}
      ],
      "isLiked": false,
      "isSaved": false
    }
  ]
}
```

### 2. 레시피 상호작용 API
**현재 상태**: 더미 구현 (`RecipeService.toggleLike()`, `toggleSave()`)

**필요한 API**:
```typescript
// 좋아요 토글
POST /recipes/:id/like
Headers: Authorization: Bearer {token}
Response: { "isLiked": true, "likesCount": 25 }

// 저장 토글  
POST /recipes/:id/save
Headers: Authorization: Bearer {token}
Response: { "isSaved": true }

// 좋아요 취소
DELETE /recipes/:id/like  
Headers: Authorization: Bearer {token}
Response: { "isLiked": false, "likesCount": 24 }

// 저장 취소
DELETE /recipes/:id/save
Headers: Authorization: Bearer {token}  
Response: { "isSaved": false }
```

### 3. 사용자 프로필 API
**현재 상태**: 구현되지 않음

**필요한 API**:
```typescript
// 내 프로필 조회
GET /users/profile
Headers: Authorization: Bearer {token}
Response: {
  "id": "uuid",
  "email": "user@example.com", 
  "nickname": "사용자닉네임",
  "profileImage": "https://...",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "recipesCount": 5,
  "followersCount": 10,
  "followingCount": 15
}

// 프로필 수정
PUT /users/profile  
Headers: Authorization: Bearer {token}
Body: {
  "nickname": "새닉네임",
  "profileImage": "https://..."
}
```

### 4. 사용자 작성 레시피 목록 API
**현재 상태**: 구현되지 않음

**필요한 API**:
```typescript
// 내가 작성한 공개 레시피 목록
GET /users/recipes
Headers: Authorization: Bearer {token}
Query: ?page=1&limit=10&status=PUBLISHED

// 내가 저장한 레시피 목록  
GET /users/saved-recipes
Headers: Authorization: Bearer {token}
Query: ?page=1&limit=10
```

### 5. 검색 API
**현재 상태**: feed API의 search 파라미터로 부분 지원

**필요한 API 개선**:
```typescript
// 통합 검색 (레시피 + 사용자)
GET /search  
Query: ?q=검색어&type=recipe|user|all&page=1&limit=10

// 자동완성/제안
GET /search/suggestions
Query: ?q=검색어&limit=5
```

### 6. 댓글/리뷰 API  
**현재 상태**: 구현되지 않음

**필요한 API**:
```typescript
// 레시피 댓글 목록
GET /recipes/:id/comments
Query: ?page=1&limit=20

// 댓글 작성
POST /recipes/:id/comments
Headers: Authorization: Bearer {token}
Body: { "content": "댓글 내용" }

// 댓글 삭제
DELETE /comments/:id
Headers: Authorization: Bearer {token}
```

## 우선순위

### Phase 1 (즉시 구현 필요)
1. **홈 화면 추천 API** - 현재 더미 데이터 사용 중
2. **좋아요/저장 API** - 사용자 상호작용 핵심 기능
3. **사용자 프로필 API** - 프로필 화면 구현에 필수

### Phase 2 (단기 구현)  
4. **내 레시피 목록 API** - 사용자 프로필 화면 완성
5. **검색 개선** - 사용자 경험 향상

### Phase 3 (중장기 구현)
6. **댓글/리뷰 시스템** - 커뮤니티 기능 강화

## 현재 더미 구현 위치

- `lib/data/datasources/recipe_service.dart`:
  - `getRecommendedRecipes()` - 라인 165-175
  - `toggleLike()` - 라인 234-245  
  - `toggleSave()` - 라인 248-259
  - `_getMockRecommendedRecipes()` - 라인 277-365

## 구현 진행 상황

- ✅ **Recipe 도메인 모델** - 완료
- ✅ **홈 화면 UI** - 완료 (더미 데이터)  
- 🔄 **피드 화면** - 진행 중
- ⏳ **레시피 상세 화면** - 대기
- ⏳ **레시피 등록 화면** - 대기
- ⏳ **프로필 화면** - 대기
## 인증/인가 설계 가이드

이 문서는 sigbang 웹/백엔드에서 **인증(로그인)** 과 **인가(권한)** 가 어떻게 동작하는지,
그리고 "API를 누구나 호출할 수 있더라도 어떻게 보안을 유지하는지"를 설명합니다.

---

### 1. 기본 개념

- **인증(Authentication)**:  
  사용자가 누구인지 확인하는 것.  
  - sigbang 에서는 주로 **JWT(accessToken, refreshToken)** 으로 처리합니다.
- **인가(Authorization)**:  
  인증된 사용자가 **무엇을 할 수 있는지** 결정하는 것.  
  - 예: 내 프로필 수정은 가능하지만, 다른 사람 프로필 수정은 불가능.

중요한 점:

- **API URL 이 공개돼 있고, Postman/curl 에서 아무나 호출할 수 있는 것은 정상**입니다.
- 보안은 "URL 숨기기"가 아니라 **서버가 토큰/권한을 검사해서 허용/거부를 제대로 하는지**에 의해 결정됩니다.

---

### 2. 토큰과 쿠키

백엔드(`/auth/...`)에서 발급하는 토큰:

- `accessToken` (JWT, 짧은 수명)
- `refreshToken` (랜덤 토큰, 길게 보관)

웹 프론트에서는 이 토큰들을 **HTTP-only 쿠키**로 보관합니다 (`sb_at`, `sb_rt`):

- `sb_at`: Access Token
- `sb_rt`: Refresh Token  
- HTTP-only, Secure, SameSite=Lax 로 설정되어 JS 에서 직접 읽을 수 없고, 오직 서버에서만 사용합니다.

---

### 3. 프론트 → 백엔드 요청 흐름

#### 3.1. `/api/proxy` 를 통한 API 호출

웹 프론트 코드는 주로 `axios` 클라이언트(`src/lib/api/client.ts`)를 사용합니다:

- baseURL: `/api/proxy`
- 예: `/api/proxy/feed/popular` → **Next API Route** → `https://api.sigbang.com/feed/popular`

`/api/proxy/[...path]/route.ts` 에서 하는 일:

1. 현재 요청의 쿠키에서 `sb_at`, `sb_rt` 를 읽습니다.
2. Access Token 이 없거나 만료되면, Refresh Token 으로 `https://api.sigbang.com/auth/refresh` 를 호출해 재발급합니다.
3. 최종적으로 **`Authorization: Bearer <accessToken>` 헤더를 붙여서** 실제 백엔드 API 로 포워딩합니다.
4. 백엔드에서 401/403/토큰 에러가 나는 경우에는 쿠키를 지우고, `x-auth-status` 헤더를 붙여서 프론트에 넘겨줍니다.

즉:

- **프론트 JS 는 토큰 문자열을 직접 알지 못하고**,  
- 항상 `/api/proxy` → Next 서버 → 백엔드 순서로 요청이 전달됩니다.

#### 3.2. 세션 검증 `/api/auth/validate`

웹에서는 세션 유지/만료 처리를 위해 `/api/auth/validate` 를 호출합니다:

- 구현 위치: `src/app/api/auth/validate/route.ts`
- 역할:
  - `sb_at` / `sb_rt` 를 읽어서:
    - Access Token 이 만료 임박이면 `/auth/refresh` 호출로 토큰을 갱신
    - 최종적으로 `{ valid, hasToken }` 형태의 JSON 을 200 으로 반환
- 사용처:
  - `useSession` 훅 (`src/lib/auth/session.tsx`): UI 에서 로그인 상태 판단
  - axios 인터셉터: API 호출 전/중에 세션 유효성을 확인

---

### 4. 백엔드 API 의 공개/보호 정책

백엔드(NestJS)의 컨트롤러는 크게 세 종류로 나눌 수 있습니다.

#### 4.1. Public API (인증 없이도 GET 가능)

예: 피드/인기/추천 레시피

```ts
// src/recipes/feed.controller.ts
@Controller('feed')
export class FeedController {
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getFeed(...) { ... }

  @Get('popular')
  @UseGuards(OptionalJwtAuthGuard)
  async getPopular(...) { ... }

  @Get('recommended')
  @UseGuards(OptionalJwtAuthGuard)
  async getRecommended(...) { ... }
}
```

- `OptionalJwtAuthGuard`:
  - 토큰이 있으면 `user.id` 를 추출해서 개인화 정보(`isLiked`, `isSaved` 등)를 붙이고,
  - 토큰이 없어도 **그냥 익명 사용자로 처리하여 공개 가능한 데이터만 반환**합니다.
- 이 패턴은:
  - "누구나 볼 수 있는 컨텐츠 + 로그인 시 개인화" 라는 일반적인 SNS 패턴입니다.
  - 인증 없이 호출해도 **민감한 정보(이메일, 비공개 글 등)는 포함되지 않도록 구현**해야 합니다.

#### 4.2. Authenticated User API (로그인 필수)

예: 내 프로필, 좋아요/저장, 레시피 작성/수정 등

- 컨트롤러에 `@UseGuards(JwtAuthGuard)` 적용
- 토큰이 없거나 유효하지 않으면 **401 Unauthorized**
- 토큰에서 `user.id` 를 읽어:
  - “내 데이터만 접근 가능”하도록 **서비스 레벨에서 권한 체크**를 합니다.

설계 원칙:

- “프론트에서 버튼을 숨겼으니 안전하다”는 가정을 하지 않고,
- **항상 서버에서 userId 기준으로 권한을 다시 확인**합니다.

#### 4.3. Admin / Internal API

예: 운영툴, 배치, 통계 등 (현재 코드 기준으로는 별도 Admin 모듈이 추가될 수 있음)

일반적인 처리:

- 별도의 관리자 토큰/역할 확인 (예: `role === 'ADMIN'`)
- 혹은 사내 VPN / 내부 네트워크에서만 접근 가능하도록 인프라 레벨에서 제한

---

### 5. “누구나 호출 가능”과 보안

**FAQ 형태로 정리하면:**

- Q. URL 은 공개돼 있고 Postman 으로 아무나 호출할 수 있는데, 이거 위험한 건가?  
  A. URL 이 공개인 건 당연합니다. 중요한 것은:
  - 인증이 필요한 엔드포인트는 **반드시 토큰이 없으면 401/403** 이 나와야 하고,
  - 인증 없이도 되는 엔드포인트는 **공개해도 괜찮은 데이터/행위로만 제한**해야 합니다.

- Q. 공개 피드(`/feed`, `/feed/popular` 등)는 괜찮은가?  
  A. 예. 이 컨텐츠는 애초에 **모든 사용자에게 보여주려는 공개 데이터**입니다.  
     다만, 응답에 이메일·전화번호·비공개 글 등의 민감한 정보가 들어가지 않도록 리뷰해야 합니다.

- Q. 악성 클라이언트가 자주 호출하면?  
  A. 이를 위해:
  - Nest 의 `ThrottlerGuard` 등으로 **IP/토큰 단위 rate limiting** 을 걸고,
  - ALB/WAF, CloudWatch 등을 통해 **이상 트래픽을 모니터링**합니다.

---

### 6. 새 엔드포인트를 만들 때 체크리스트

1. **이 엔드포인트는 공개 데이터인가, 아니면 로그인 필수인가?**
   - 공개 데이터 → `OptionalJwtAuthGuard` 또는 Guard 없음 (단, 응답에 민감정보 X)
   - 로그인 필수 → `JwtAuthGuard` 적용

2. **응답에 포함되는 필드 중 민감한 것은 없는가?**
   - 이메일, 전화번호, 비공개 설정 여부, 내부 플래그 등은 꼭 다시 확인

3. **쓰기/수정/삭제라면, userId 기반 권한 체크가 서비스 레벨에서 이루어지는가?**

4. **Rate Limiting 이 필요한가?**
   - 짧은 시간에 여러 번 호출될 수 있는 엔드포인트라면 `ThrottlerGuard` 고려

5. **프론트에서 호출할 때는 `/api/proxy` 를 거치도록 되어 있는가?**
   - 토큰/쿠키 관리를 통일하기 위해 직접 `https://api.sigbang.com` 대신 `/api/proxy` 사용

---

이 문서를 기준으로, 앞으로 새 API 를 설계하거나 기존 엔드포인트를 점검할 때  
"**어디까지는 public, 어디부터는 auth 필요**인지"를 통일된 기준으로 논의할 수 있습니다.

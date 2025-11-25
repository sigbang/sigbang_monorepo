# 🔐 Auth Flow – Google OAuth Redirect → Sigbang API

## Overview

이 문서는 Google OAuth 로그인부터
백엔드 토큰 교환, 프록시 인증 검증, 쿠키 정책, 로그아웃 처리까지의  
전체 인증 시퀀스를 설명합니다.

---

## 1. Google 로그인 → Redirect → Callback

### Flow
1. 사용자가 로그인 페이지의 **커스텀 Google 버튼** 클릭  
2. 프론트엔드 라우트 `/api/auth/google/redirect`가 Google OAuth 2.0 인증 페이지로 302 리다이렉트 (새 페이지)  
3. 로그인 완료 시 Google이 `code`와 `state`로 `/api/auth/google/callback` 호출  
4. 콜백 라우트가 백엔드 `POST /auth/google/exchange`에 `code`와 `redirectUri`로 교환 요청  
5. 백엔드는 `id_token`을 검증하고 자체 `accessToken/refreshToken` 발급  
6. 프론트엔드가 `sb_at/sb_rt`를 httpOnly 쿠키로 설정 후 `/`로 리다이렉트

```mermaid
sequenceDiagram
  participant User
  participant FE as Frontend
  participant Google
  participant BE as Backend

  User->>FE: Click "Continue with Google"
  FE->>Google: 302 to accounts.google.com (auth request)
  Google-->>FE: GET /api/auth/google/callback?code=...&state=...
  FE->>BE: POST /auth/google/exchange { code, redirectUri }
  BE->>Google: Exchange code → tokens
  Google-->>BE: id_token (+ access_token)
  BE->>BE: verify id_token, upsert user, mint AT/RT
  BE-->>FE: { accessToken, refreshToken, user }
  FE->>FE: setCookie(sb_at, sb_rt)
  FE-->>User: 302 /
```

---

## 2. 콜백 → 코드 교환 (/auth/google/exchange)

### Flow
- 콜백(`/api/auth/google/callback`)에서 `code/state`를 검증  
- 백엔드 **`POST /auth/google/exchange`**로 `code`와 `redirectUri`를 전송  
- 응답의 `accessToken` / `refreshToken`을 httpOnly 쿠키로 저장:
  - `sb_at`: Access Token (exp 기반 만료)
  - `sb_rt`: Refresh Token (30일 유효)

```bash
POST /auth/google/exchange
body: {
  code: "<oauth_code>",
  redirectUri: "https://<site-origin>/api/auth/google/callback"
}
```

| 쿠키 | 설명 | 속성 | 만료 |
|------|------|------|------|
| `sb_at` | Access Token | httpOnly | JWT `exp` (기본 1시간) |
| `sb_rt` | Refresh Token | httpOnly | 30일 |
| `sb_did` | 디바이스 식별용 | 일반 쿠키 | 필요 시 서버 전송 |

---

## 3. 일반 요청 흐름 (/api/proxy 경유)

### ensureAtBeforeRequest

- 모든 요청 전 **`sb_at` 만료 여부 확인**
- 만료 또는 부재 시 `sb_rt`로 **리프레시 시도**
- 유효한 AT를 `Authorization: Bearer`로 백엔드에 전달

### 401 Handling

- 백엔드 응답이 `401`일 경우:
  1. 한 번 리프레시 후 재시도  
  2. 재시도 실패 시 쿠키 삭제  
  3. 응답 헤더 `x-auth-status: invalid` 설정

```js
// Pseudocode
if (isAtExpired()) {
  refreshWithRt();
}
setHeader('Authorization', `Bearer ${sb_at}`);
if (response.status === 401) {
  attemptRefreshOnce();
  if (fail) clearCookies();
}
```

---

## 4. 클라이언트 유지 / 복구 로직

### Lifecycle
- **탭 활성화 시** → `GET /api/proxy/users/me` 호출  
  → 서버측 리프레시 로직 트리거  

### Axios Interceptors
- **Request 인터셉터**
  - `sb_at` 부재 또는 60초 내 만료 예정 → 리프레시 시도
- **Response 인터셉터**
  - `401` 또는 `x-auth-status: invalid` → `/login`으로 리다이렉트

```js
axios.interceptors.request.use(async (config) => {
  if (shouldRefreshSoon()) await refreshTokens();
  return config;
});

axios.interceptors.response.use(null, (error) => {
  if (isUnauthorized(error)) redirectToLogin();
});
```

---

## 5. 로그아웃 (/api/auth/logout)

### Flow
1. `/api/auth/logout` 호출  
2. 서버가 `sb_rt`를 **백엔드 `/auth/signout`**에 전달  
3. `sb_at`, `sb_rt` 쿠키 삭제 후 세션 종료

```bash
POST /api/auth/logout
↓
/auth/signout (with sb_rt)
↓
clearCookies(sb_at, sb_rt)
```

---

## 6. 검증 포인트

| 항목 | 검증 내용 |
|------|------------|
| 요청 인증 | 모든 요청마다 `sb_at` 만료 여부 확인 및 자동 리프레시 |
| 실패 처리 | 백엔드 `401` 응답 시 1회 리프레시 후 재시도 → 실패 시 쿠키 삭제 및 `x-auth-status: invalid` |
| 보안 정책 | 모든 주요 토큰은 `httpOnly` 쿠키로 저장, `sb_rt`는 장기 보관 (30일), `sb_at`은 짧은 주기 만료 |

---

## 7. 쿠키 / 토큰 정책 요약

| 이름 | 용도 | 속성 | 만료 | 비고 |
|------|------|------|------|------|
| **sb_at** | Access Token | `httpOnly` | `exp` 또는 1시간 | 매 요청마다 검증 |
| **sb_rt** | Refresh Token | `httpOnly` | 30일 | 재발급 전용 |
| **sb_did** | Device ID | 클라이언트 | 세션 유지용 | 서버 리프레시에 포함 가능 |

---

## Diagram Summary

```mermaid
flowchart LR
A[Click Google Button] --> B[/api/auth/google/redirect]
B --> C[Google Login Page]
C --> D[/api/auth/google/callback?code&state]
D --> E[POST /auth/google/exchange]
E --> F[Set-Cookie sb_at/sb_rt]
F --> G[/api/proxy Request]
G --> H[ensureAtBeforeRequest → refresh if expired]
H --> I[Backend API]
I -->|401| J[Refresh once → clear cookies if fail]
J --> K[Client redirect /login]
```

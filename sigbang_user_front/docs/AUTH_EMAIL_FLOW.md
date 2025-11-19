# Email Auth Flow (Email/Password)

## Overview
- Signup via email/password creates a user (Supabase-auth password), stores user in our DB as unverified, and sends a verification email.
- Signin via email/password is blocked until `emailVerifiedAt` is set.
- Password management includes change (authenticated) and reset (via email token).

## Backend Endpoints
- POST `/auth/signup` → creates user, sends verification mail (no tokens returned)
- POST `/auth/signin` → returns access/refresh tokens if verified
- POST `/auth/email/resend` → resend verification mail
- POST `/auth/email/verify` → verify email with token
- POST `/auth/password/forgot` → send password reset mail
- POST `/auth/password/reset` → reset password with token
- PATCH `/auth/password` → change password (requires JWT)

## Email Links
- Verify: `${WEB_BASE_URL}/auth/verify?token=...`
- Reset: `${WEB_BASE_URL}/auth/reset?token=...`

`WEB_BASE_URL` should be configured in the API environment. Falls back to `PUBLIC_BASE_URL` or `http://localhost:3000`.

## Frontend Proxies (Next.js)
The following routes proxy to API and handle cookies when necessary:
- `/api/auth/signup`, `/api/auth/signin`
- `/api/auth/email/resend`, `/api/auth/email/verify`
- `/api/auth/password/forgot`, `/api/auth/password/reset`, `/api/auth/password/change`

`/api/auth/signin` sets httpOnly cookies for AT/RT (same as Google flow).

## Mobile (Flutter)
`AuthService` now supports:
- `signUpWithEmail`, `signInWithEmail`
- `resendVerification`
- `requestPasswordReset`, `resetPassword`
- `changePassword` (clears local tokens post-change)

## Security
- Email/Reset tokens: 24h expiry, single-use
- After password change/reset: revoke all refresh tokens
- Rate limiting is applied via Nest Throttler



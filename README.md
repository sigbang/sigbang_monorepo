# SigBang API - 요리 레시피 SNS 플랫폼 🍳👨‍🍳

**NestJS 기반의 요리 레시피 SNS 플랫폼 백엔드 API**

## 📋 프로젝트 개요

SigBang API는 요리 레시피를 공유하고 소통할 수 있는 SNS 플랫폼의 백엔드 서비스입니다. 사용자들이 자신만의 레시피를 업로드하고, 다른 사용자들과 상호작용할 수 있는 기능을 제공합니다.

## 🚀 기술 스택

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: Supabase Auth (JWT 기반)
- **File Storage**: Supabase Storage
- **Documentation**: Swagger/OpenAPI

### DevOps & Deployment
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (Reverse Proxy + Load Balancer)
- **CI/CD**: GitHub Actions
- **Hosting**: AWS EC2 (준비됨)

### Security & Performance
- **Rate Limiting**: @nestjs/throttler
- **CORS**: 크로스 오리진 리소스 공유 설정
- **Validation**: class-validator + class-transformer
- **Security Headers**: Helmet (Nginx 설정)

## 📚 주요 기능

### 🔐 인증 & 사용자 관리
- [x] Supabase Auth 기반 회원가입/로그인
- [x] JWT 토큰 인증 및 갱신
- [x] 사용자 프로필 관리 (닉네임, 이미지, 소개)
- [x] 계정 탈퇴 (Soft Delete)

### 🍽️ 레시피 관리
- [x] 레시피 CRUD (생성, 조회, 수정, 삭제)
- [x] 다중 이미지 업로드
- [x] 태그 시스템
- [x] 난이도 분류 (쉬움, 보통, 어려움)
- [x] 검색 및 필터링 (제목, 재료, 태그, 난이도, 조리시간)
- [x] 정렬 (최신순, 인기순, 조회수순)
- [x] 페이지네이션

### 💬 상호작용 기능
- [x] 좋아요 기능
- [x] 댓글 시스템
- [x] 레시피 저장(스크랩) 기능
- [x] 사용자별 레시피 목록 조회

### 🛡️ 관리자 기능
- [x] 신고된 콘텐츠 관리
- [x] 레시피/댓글 숨김 처리
- [x] 사용자 차단 기능
- [x] 관리자 활동 로그

## 🏗️ API 엔드포인트

### 인증 (/auth)
```
POST   /auth/signup     # 회원가입
POST   /auth/signin     # 로그인
POST   /auth/refresh    # 토큰 갱신
POST   /auth/signout    # 로그아웃
```

### 사용자 (/users)
```
GET    /users/me                    # 내 정보 조회
PATCH  /users/me                    # 내 정보 수정
POST   /users/me/profile-image      # 프로필 이미지 업로드
DELETE /users/me                    # 계정 탈퇴
GET    /users/me/recipes            # 내 레시피 목록
GET    /users/me/saved-recipes      # 저장한 레시피 목록
GET    /users/:id                   # 다른 사용자 정보 조회
GET    /users/:id/recipes           # 다른 사용자의 레시피 목록
```

### 레시피 (/recipes)
```
GET    /recipes              # 레시피 목록 조회 (검색, 필터, 페이지네이션)
GET    /recipes/:id          # 레시피 상세 조회
POST   /recipes              # 레시피 생성 🔒
PATCH  /recipes/:id          # 레시피 수정 🔒
DELETE /recipes/:id          # 레시피 삭제 🔒
POST   /recipes/:id/images   # 레시피 이미지 업로드 🔒
```

### 상호작용
```
POST   /recipes/:id/like              # 좋아요 토글 🔒
POST   /recipes/:id/save              # 저장 토글 🔒
GET    /recipes/:id/comments          # 댓글 목록 조회
POST   /recipes/:id/comments          # 댓글 작성 🔒
DELETE /recipes/:id/comments/:id      # 댓글 삭제 🔒
```

### 관리자 (/admin) 🔒👑
```
GET    /admin/reports            # 신고 목록 조회
PATCH  /admin/recipes/:id/hide   # 레시피 숨김 처리
PATCH  /admin/comments/:id/hide  # 댓글 숨김 처리
PATCH  /admin/users/:id/block    # 사용자 차단
```

🔒 인증 필요 | 👑 관리자 권한 필요

## 🛠️ 설치 및 실행

### 사전 요구사항
- Node.js 18+
- npm 또는 yarn
- Supabase 프로젝트 (데이터베이스 + Storage + Auth)

### 환경 설정

1. 저장소 클론
```bash
git clone https://github.com/your-username/sigbang_api.git
cd sigbang_api
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
```bash
cp .env.example .env
```

`.env` 파일에 Supabase 설정을 추가하세요:
```env
# Database (Supabase)
DATABASE_URL="postgresql://username:password@host:port/database"
SUPABASE_URL="your_supabase_project_url"
SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"

# JWT Secret
JWT_SECRET="your_jwt_secret_key_here"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV="development"

# File Upload
SUPABASE_STORAGE_BUCKET="recipe-images"

# OpenAI
OPENAI_API_KEY="your_openai_api_key"
# Optional: override default model for recipe generation
OPENAI_RECIPE_MODEL="gpt-4o-mini"
```

4. Prisma 설정
```bash
npx prisma generate
npx prisma db push
```

### 개발 모드 실행
```bash
npm run start:dev
```

### 프로덕션 빌드
```bash
npm run build
npm run start:prod
```

## 🐳 Docker로 실행

### 개발 환경
```bash
docker-compose up -d
```

### 프로덕션 환경
```bash
docker-compose -f docker-compose.yml up -d
```

## 📖 API 문서

서버 실행 후 다음 URL에서 Swagger API 문서를 확인할 수 있습니다:
```
http://localhost:3000/api
```

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov
```

## 📁 프로젝트 구조

```
src/
├── auth/                 # 인증 모듈
├── users/                # 사용자 관리 모듈
├── recipes/              # 레시피 관리 모듈
├── comments/             # 댓글 모듈
├── likes/                # 좋아요 모듈
├── saves/                # 저장 모듈
├── admin/                # 관리자 모듈
├── database/             # 데이터베이스 모듈 (Prisma + Supabase)
├── common/               # 공통 모듈
│   ├── decorators/       # 커스텀 데코레이터
│   ├── guards/           # 인증/인가 가드
│   ├── filters/          # 예외 필터
│   ├── interceptors/     # 인터셉터
│   └── pipes/            # 파이프
├── app.module.ts         # 루트 모듈
└── main.ts               # 애플리케이션 엔트리포인트
```

## 🚀 배포

### AWS EC2 배포 (Docker + Nginx)

1. EC2 인스턴스에 Docker 설치
2. GitHub Actions를 통한 자동 배포 설정
3. Let's Encrypt를 통한 SSL 인증서 설정

### 환경 변수 설정
GitHub Secrets에 다음 변수들을 설정해야 합니다:
- `HOST`: EC2 인스턴스 IP
- `USERNAME`: SSH 사용자명
- `SSH_KEY`: SSH 개인키
- `SLACK_WEBHOOK`: Slack 알림용 웹훅 (선택사항)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참고하세요.

## 📞 연락처

프로젝트 링크: [https://github.com/your-username/sigbang_api](https://github.com/your-username/sigbang_api)

---

**Made with ❤️ by SigBang Team**
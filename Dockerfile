# ---------- Build stage ----------
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Install deps (dev 포함)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci && npm cache clean --force

# Build
COPY . .
RUN npx prisma generate
RUN npm run build

# ---------- Production stage ----------
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# minimal runtime packages (dumb-init만 필요)
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init openssl \
  && rm -rf /var/lib/apt/lists/*

# 프로덕션 의존성만 설치
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 앱 산출물/스키마 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Prisma 클라이언트는 runtime 의 node_modules 기준으로 다시 생성
RUN npx prisma generate

# 런타임 sanity check (선택)
RUN node -e "console.log('node',process.version,'global crypto:',!!globalThis.crypto,'randomUUID:',typeof (globalThis.crypto && globalThis.crypto.randomUUID))"

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main.js"]

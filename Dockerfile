# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:18-slim AS production

WORKDIR /app

RUN apt-get update && \
    apt-get install -y dumb-init openssl libssl1.1 && \
    rm -rf /var/lib/apt/lists/

# Copy built application and Prisma files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma

COPY .env .env

# Start the application
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main"]
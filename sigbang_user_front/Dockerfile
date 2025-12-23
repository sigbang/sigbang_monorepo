# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
# Build-time arguments for Google OAuth client id
ARG GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
# Expose them as env vars so Next.js can inline at build time (including Edge runtime)
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# ---- runtime ----
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["npm","start"]



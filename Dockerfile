FROM node:20-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Fixed at build time: Next bakes the /uploads rewrite (pictures served by the API) into the build, and inlines NEXT_PUBLIC_* values.
# (The .env* files are not in the image, see .dockerignore, so they come in as build arguments.)
ARG API_BASE_URL=http://tazahat-api-service:8000
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
ENV API_BASE_URL=${API_BASE_URL} \
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
# next.config.ts is read again when the server starts
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "start"]

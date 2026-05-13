# Build from monorepo root: docker build -f apps/api/Dockerfile .
FROM node:22-alpine AS builder
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/cards-domain/package.json packages/cards-domain/
RUN pnpm install --frozen-lockfile
COPY packages/cards-domain packages/cards-domain
COPY apps/api apps/api
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build
RUN cd apps/api && ./node_modules/.bin/tsc --skipLibCheck --esModuleInterop --module commonjs --target ES2021 --experimentalDecorators --emitDecoratorMetadata --outDir dist --rootDir . prisma/seed.ts scripts/migrate-artworks.ts scripts/migrate-battle-audio.ts
# Portable prod tree: own node_modules + dist (no reliance on monorepo path layout). --legacy: workspace without injectWorkspacePackages.
# Regenerate client inside the deploy tree: `pnpm deploy` can omit hoisted `node_modules/.prisma` from the monorepo, causing
# `Cannot find module '.prisma/client/default'` at runtime when `migrate deploy` succeeds but Nest loads `@prisma/client`.
RUN pnpm --filter api --prod deploy --legacy /deploy/api \
    && cd /deploy/api && ./node_modules/.bin/prisma generate

FROM node:22-alpine AS runner
ARG APP_VERSION=unknown
WORKDIR /app
ENV NODE_ENV=production \
    APP_VERSION=$APP_VERSION
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs
COPY --from=builder --chown=nestjs:nodejs /deploy/api .
COPY --from=builder --chown=nestjs:nodejs /repo/apps/api/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /repo/apps/api/dist/scripts ./dist/scripts
# Assets needed by migration scripts (path resolved via __dirname/../../.. = /)
COPY --chown=nestjs:nodejs apps/web/public/cards/artworks /apps/web/public/cards/artworks
COPY --chown=nestjs:nodejs apps/web/public/audio/battles /apps/web/public/audio/battles
COPY --chown=nestjs:nodejs apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
USER nestjs
EXPOSE 3021
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]

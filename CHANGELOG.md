# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Changelog best practices

### General principles

- Changelogs are for humans, not machines.
- Include an entry for every version, with the latest first.
- Group similar changes under: Added, Changed, Improved, Deprecated, Removed, Fixed, Documentation, Performance, CI.
- **"Test" is not a valid changelog category** — fold tests into the related feature or fix.
- Use an **Unreleased** section for upcoming changes.
- Use ISO 8601 dates: `2026-05-01`.
- Avoid raw git dumps; summarize clearly.

### For contributors

When you open a PR:

1. Add bullets under **`[Unreleased]`** in the right category.
2. Keep wording user-facing where it helps (admin UI, charter app, API behavior).
3. Group related items.
4. Mention regression coverage inside the same bullet as the fix/feature when relevant.

**Example:**

```markdown
## [Unreleased]

### Added

- **Catalog**: Export deck summary as CSV from the catalog toolbar.

### Fixed

- **Wishlist**: Interim cards now use the real `year` string from definitions instead of a literal placeholder.

### CI

- **Publish**: `api-release.yml` builds the Nest API image on `main` and version tags using the shared redeploy/tag workflows.
```

On release, maintainers move **`[Unreleased]`** content into a dated **`## [0.x.y]`** section.

## [Unreleased]

### Changed

- **Ops — github-workflows**: Pin **BehindTheMusicTree/github-workflows** reusables to **`@v2.0.0`** (**`sync-env-to-server`**, **`set-image-tags-on-server`**, **`call-redeployment-webhook`**).

- **Ops — API release / Sync env**: **`api-release.yml`** preflight requires **`IMAGE_TAGS_POOL_DIR`** and calls **`set-image-tags-on-server`** (**`stack: tmd-admin`**, **`TMD_ADMIN_API_TAG`**) instead of **`REDEPLOYMENT_ROOT`** + **`set-image-tag-on-server`**. **Sync env** build jobs require **`ENV_POOL_DIR`** (same as infrastructure); reusable **`sync-env-to-server`** uploads only to the env pool—run **redeploy** to promote **`scripts/sync-env/`**.

- **Ops — Sync env to server**: **`sync-env-to-server.yml`** no longer substitutes defaults for **`TMD_ADMIN_NODE_ENV`**, **`TMD_ADMIN_S3_REGION`**, **`TMD_ADMIN_API_DB_SUPERUSER`**, or **`TMD_ADMIN_API_DB_APP_USER`**. Each **STAGING** / **PROD** environment must define those variables; the build steps exit with an error if any required var or secret is missing. GitHub names for DB bootstrap credentials are **`TMD_ADMIN_API_DB_*`** (aligned with **`TMD_ADMIN_API_APP_NAME`**); rename from **`TMD_ADMIN_DB_SUPERUSER`** / **`TMD_ADMIN_DB_APP_USER`** and matching **`_PASSWORD`** secrets.

- **Catalog / Prisma seed**: **`Card.rowKey`** is always slugified **`artist-title`** via **`catalogRowKey()`** in **`@repo/cards-domain`** (no `genre-` / `spotlight-` / `world-` / `blend-` / fixed La Macarena key / wishlist **`wl-`** prefixes). **`WishlistCardDef`** drops **`rowKey`**; seed and web wishlist derive it from **`artist`** + **`title`**. Existing DBs need a re-seed or rowKey migration; locally use **`pnpm --filter api db:reset`** or **`db:seed`**.

### Fixed

- **API Docker image**: After **`pnpm --filter api build`**, the image runs **`pnpm --filter api --prod deploy --legacy /deploy/api`** so the runner copies a **self-contained** deploy tree (**`dist/`** + production **`node_modules`**, local **`.pnpm`**). Fixes **`MODULE_NOT_FOUND`** for **`reflect-metadata`** and avoids fragile copies of the monorepo **`node_modules`** layout (**`--legacy`**: deploy without **`injectWorkspacePackages`** in **`pnpm-workspace.yaml`**).

### Added

- **Ops — Sync env to server**: [`.github/workflows/sync-env-to-server.yml`](.github/workflows/sync-env-to-server.yml) (manual **workflow_dispatch**), same reusable workflow as [hear-the-music-tree-api](https://github.com/BehindTheMusicTree/hear-the-music-tree-api): builds API + Postgres fragments per **STAGING** / **PROD**, uploads **`${ENV_POOL_DIR}/sync-env-<TMD_ADMIN_API_APP_NAME>-<env>.env`** and **`${ENV_POOL_DIR}/sync-env-<TMD_ADMIN_API_APP_NAME><DB_APP_NAME_SUFFIX>-<env>.env`** (**`ENV_POOL_DIR`** + **`DB_APP_NAME_SUFFIX`** required; align with **BehindTheMusicTree/infrastructure**). API fragment includes **R2** **`S3_*`** (**`TMD_ADMIN_S3_ENDPOINT`** required; **`TMD_ADMIN_R2_ACCESS_KEY_ID`** / **`TMD_ADMIN_R2_SECRET_ACCESS_KEY`** secrets). See **CONTRIBUTING**.

- **API**: Jest + Supertest e2e coverage for `GET /health` (`apps/api`).

- **API — data & storage**: Prisma + Postgres (**`Card`**, **`CardSongTransition`**), **`GET/POST/PATCH/DELETE /cards`**, **`PUT /cards/:id/songs-out`**, S3-compatible **`StorageModule`**, artwork **`GET/POST/DELETE /cards/:id/artwork`**, admin bearer **`ADMIN_API_TOKEN`**.

- **`@repo/cards-domain`**: Shared card types + track graph for API + web.

- **Web**: Cached **`BACKEND_URL`** fetchers (**`apps/web/lib/cards-api.ts`**), catalog/wishlist from API (**`deck-from-api.ts`**), **`revalidateTag('cards', 'max')`**, admin card artwork upload (**`app/admin/cards/[id]/`**).

- **Ops — Sync env**: API **`S3_*`** from GitHub vars/secrets only; **`apply-tmd-admin-env-from-sync`** (infra) copies promoted sync into **`compose/<API>.env`** with no MinIO compose env on the server (**Cloudflare R2** for staging/prod).

- **API Docker image**: **`prisma migrate deploy`** on container start (**`docker-entrypoint.sh`**); **`SKIP_PRISMA_MIGRATE=1`** to skip; **`packages/cards-domain`** + **`prisma/`** in build/run context.

### Removed

- _(Deferred until production bucket verified.)_ Bundled deck PNGs and static card JSON lists remain under **`apps/web/lib/cards/`** and **`apps/web/public/cards/artworks/deck/`** for now; remove after cutover.

### Changed

- **Ops — Sync env to server**: Dropped MinIO third fragment and **`sync-minio-*`** jobs; API fragment requires **`TMD_ADMIN_S3_ENDPOINT`** and **R2** token secrets **`TMD_ADMIN_R2_ACCESS_KEY_ID`** / **`TMD_ADMIN_R2_SECRET_ACCESS_KEY`** (replaces **`TMD_ADMIN_MINIO_ROOT_*`**). No **`S3_FORCE_PATH_STYLE`** in the synced fragment (R2 uses virtual-hosted style with the account endpoint).

- **Ops — Sync env to server**: Postgres fragment **`app_name`** uses **`TMD_ADMIN_API_APP_NAME` + `DB_APP_NAME_SUFFIX`** (no hardcoded **`_db`**). **`build-api-fragment`** and **`build-db-fragment`** require **`DB_APP_NAME_SUFFIX`** so the workflow fails fast when it is missing or empty.

- **Ops — Sync env**: DB fragment GitHub names **`TMD_ADMIN_API_DB_SUPERUSER`**, **`TMD_ADMIN_API_DB_SUPERUSER_PASSWORD`**, **`TMD_ADMIN_API_DB_APP_USER`**, **`TMD_ADMIN_API_DB_APP_USER_PASSWORD`** (replaces **`TMD_ADMIN_POSTGRES_*`**); emits **`POSTGRES_APP_*`** for infra initdb + composed **`DATABASE_URL`**.

- **Ops — Sync env**: DB fragment always **`POSTGRES_DB=app`**; logical DB name on the server is **BehindTheMusicTree/infrastructure** GitHub Variable **`TMD_ADMIN_DB_NAME`** (legacy **`TMD_ADMIN_POSTGRES_DB`**) in **`scripts/.env`**, not configured in this repo’s Sync env workflow.

- **Ops — Sync env**: API fragment no longer includes **`PORT`**. Nest listen port is **`TMD_ADMIN_API_LISTEN_PORT`** in **infrastructure** only (Ansible **`scripts/.env`**; optional GitHub Variable, default **3021**); **`apply-tmd-admin-env-from-sync.sh`** sets **`compose/<API>.env` `PORT`** on redeploy.

- **Ops — Sync env**: API fragment no longer includes **`DATABASE_URL`**. Prisma **`DATABASE_URL`** for staging/prod is owned by **infrastructure** (same pattern as **`PORT`**); remove GitHub secret **`TMD_ADMIN_DATABASE_URL`** from **STAGING** / **PROD** after infra supplies it.

- **API**: **`EXPOSE 3021`** in **`apps/api/Dockerfile`** and default **`PORT`** fallback **`3021`** in **`main.ts`** when **`PORT`** is unset (matches infrastructure **`TMD_ADMIN_API_LISTEN_PORT`** default).

- **CI — publish**: Aligned with [hear-the-music-tree-api](https://github.com/BehindTheMusicTree/hear-the-music-tree-api): GitHub Environments **`STAGING`** / **`PROD`**; **`set-image-tag-on-server.yml@main`**; **`call-redeployment-webhook.yml@v0.3.0`** with **`hook_id_base`**. API image pushes to **GHCR** (`ghcr.io/<GHCR_IMAGE_NAMESPACE>/<TMD_ADMIN_API_APP_NAME>:<tag>`) with **`GITHUB_TOKEN`** and **`packages: write`**; Docker Hub removed. Preflight **`check-pinned-tags`** (deploy vars only; no DB/AFP pins). **`call-redeployment-webhook`** uses **`TMD_ADMIN_WEBHOOK_SECRET_*`** when **`hook_id_base`** matches **`vars.TMD_ADMIN_REDEPLOYMENT_HOOK_ID_BASE`** — publish now requires that variable and passes it as **`hook_id_base`** (not **`REDEPLOYMENT_HOOK_ID_BASE`** alone).

### Documentation

- **API / Prisma**: [apps/api/prisma/README.md](apps/api/prisma/README.md) documents **`rowKey`** conventions and seed commands; **CONTRIBUTING** links to it under **API (Prisma catalog)**.

- **README**: Updated for the pnpm/Turborepo layout (`apps/web`, `apps/api`), root scripts, and Docker build entrypoint; **Sync env** pointer and corrected workflow filenames (**`api-release.yml`**, **`api-image-ghcr.yml`**, **`turbo-ci.yml`**).
- **CONTRIBUTING**: Publish/env vars table for **`REDEPLOYMENT_ROOT`**, webhook secrets, **`the-music-deck-admin`** infra paths; **Sync env** DB secrets **`TMD_ADMIN_API_DB_SUPERUSER_PASSWORD`** / **`TMD_ADMIN_API_DB_APP_USER_PASSWORD`**, required **`TMD_ADMIN_API_DB_SUPERUSER`** / **`TMD_ADMIN_API_DB_APP_USER`**, fixed **`POSTGRES_DB=app`** (infra **`TMD_ADMIN_DB_NAME`** / legacy **`TMD_ADMIN_POSTGRES_DB`**), plus **`SERVER_DEPLOY_*`**, **`DB_APP_NAME_SUFFIX`**, **`TMD_ADMIN_NODE_ENV`** / CORS, **`TMD_ADMIN_S3_*`**, **`TMD_ADMIN_R2_*`**; **`PORT`** / **`DATABASE_URL`** infrastructure-only; workflow table aligned with repo filenames.

## [0.1.0] - 2026-05-01

### Added

- **Monorepo**: [pnpm](https://pnpm.io/) workspace with [Turborepo](https://turbo.build/) — `apps/web` (Next.js charter/admin UI), `apps/api` (NestJS starter with `/health`), shared tooling from repository root.
- **Root `VERSION`**: Single source for semver used when publishing **`staging`** images from `main` (suffix `{VERSION}-staging` as container metadata).

### CI

- **Continuous integration**: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — install frozen lockfile, `pnpm lint`, `pnpm test`, `pnpm build` across workspace packages.

### Changed

- **Publish pipeline**: Mirrors [hear-the-music-tree-api](https://github.com/BehindTheMusicTree/hear-the-music-tree-api) — [`publish.yml`](.github/workflows/publish.yml) resolves environment from `main` vs `v*` tags (prerelease hyphen → staging, stable tag → prod), calls reusable [`build-and-push.yml`](.github/workflows/build-and-push.yml) (GHCR), then [`BehindTheMusicTree/github-workflows`](https://github.com/BehindTheMusicTree/github-workflows) **`set-image-tag-on-server`** and **`call-redeployment-webhook`** (same pattern as the API repo).

### Documentation

- **Contributing**: Added [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, branching, and releases.

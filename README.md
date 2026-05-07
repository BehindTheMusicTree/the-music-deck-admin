# The Music Deck — Admin & charter

Design system, visual charter, and supporting tooling for [The Music Deck](https://github.com/mignot/the-music-deck) — a music-themed card game.

This repository is separate from the game client. It holds the interactive charter (Next.js), card/catalog reference UI, and a small Nest API used for future admin or backend features.

---

## Monorepo layout

| Path | Role |
|------|------|
| [`apps/web`](apps/web) | Next.js 16 charter / admin UI (Turbopack dev, Vitest, ESLint) |
| [`apps/api`](apps/api) | NestJS API (`/health`), Docker image built from repo root |
| [`packages/`](packages/) | Reserved for shared workspace packages |

Tooling: **pnpm** workspaces + **Turborepo**. Node **22** matches the API Docker image.

---

## Prerequisites

- [Node.js 22](https://nodejs.org/)
- [pnpm 10.33.x](https://pnpm.io/) — enable via Corepack: `corepack enable`

---

## Commands (repository root)

```bash
pnpm install --frozen-lockfile   # after clone or lockfile change
pnpm dev                         # turbo: runs dev scripts in packages
pnpm lint
pnpm test
pnpm build
```

**Web app only** (charter on [http://localhost:3000](http://localhost:3000)):

```bash
pnpm --filter web dev
```

**API only**:

```bash
pnpm --filter api start:dev
```

---

## CI

[`.github/workflows/turbo-ci.yml`](.github/workflows/turbo-ci.yml) runs on pushes to **`main`** / **`develop`** and on pull requests: frozen install, **lint**, **test**, **build**.

---

## API Docker image

From the repository root (see [`apps/api/Dockerfile`](apps/api/Dockerfile)):

```bash
docker build -f apps/api/Dockerfile .
```

Release automation lives in [`.github/workflows/api-release.yml`](.github/workflows/api-release.yml): **GitHub Container Registry** build ([`api-image-ghcr.yml`](.github/workflows/api-image-ghcr.yml)), then [BehindTheMusicTree/github-workflows **`set-image-tags-on-server`**](https://github.com/BehindTheMusicTree/github-workflows) (**`@v2.0.0`**, **`tmd-admin-<env>.tags.env`**) and **`call-redeployment-webhook`** (**`@v2.0.0`**). Root **`VERSION`** drives semver metadata when publishing image tag **`staging`** from **`main`**.

**Sync env (manual):** [`.github/workflows/sync-env-to-server.yml`](.github/workflows/sync-env-to-server.yml) uploads API + Postgres fragments into **`ENV_POOL_DIR`** on the VPS (same **`sync-env-to-server`** reusable workflow as hear-the-music-tree-api). Run **redeploy** afterward so infrastructure promotes pool → **`scripts/sync-env/`**. **`DATABASE_URL`** is **not** in this fragment—it is set by [infrastructure](https://github.com/BehindTheMusicTree/infrastructure) on the server (same idea as **`PORT`** / **`TMD_ADMIN_API_LISTEN_PORT`**). **`app_name`** for the API fragment is **`TMD_ADMIN_API_APP_NAME`**, and for Postgres **`TMD_ADMIN_API_APP_NAME` + `DB_APP_NAME_SUFFIX`**. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

**VPS / webhook:** Configure GitHub Environments **`STAGING`** and **`PROD`** (uppercase) plus **`IMAGE_TAGS_POOL_DIR`**, **`ENV_POOL_DIR`**, **`REDEPLOYMENT_*`**, **`TMD_ADMIN_REDEPLOYMENT_HOOK_ID_BASE`**, **`TMD_ADMIN_WEBHOOK_SECRET_*`**, **`GHCR_IMAGE_NAMESPACE`**, **`TMD_ADMIN_API_APP_NAME`**, **`DB_APP_NAME_SUFFIX`**, and related secrets documented in [`CONTRIBUTING.md`](CONTRIBUTING.md) so hook URLs and image pulls match [infrastructure **The Music Deck admin** stack](https://github.com/BehindTheMusicTree/infrastructure/blob/main/deploy/tmd-admin/README.md).

---

## Repository structure (high level)

```
apps/web/
  app/              Next.js App Router pages
  components/       UI (GenreWheel, catalog tables, etc.)
  lib/              Card data, genres, helpers
  public/cards/     Artworks, prompts, examples
apps/api/
  src/              Nest modules (e.g. HealthController)
docs/               Product design docs — start at docs/INDEX.md
```

Design tokens for the charter live in **`apps/web/app/globals.css`**. Genre `.g-*` classes stay aligned with the game repo’s `globals.css` when colours change.

---

## Docs & contributing

- Product docs: [`docs/INDEX.md`](docs/INDEX.md)
- Contributor setup and releases: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Release notes: [`CHANGELOG.md`](CHANGELOG.md)

---

## Relationship to the game repo

| Concern | Lives in |
|---------|----------|
| Genre CSS variables (`.g-*`) in production game | `the-music-deck` → app `globals.css` |
| Charter, palette docs, card artwork prompts | This repo → `apps/web`, `public/cards/` |
| Game logic and player UI | `the-music-deck` |

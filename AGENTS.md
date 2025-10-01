# Repository Guidelines

Icebreaker.top is a pnpm-managed monorepo targeting Node 20. Start every contribution by syncing main and checking existing automation scripts.

## Project Structure & Module Organization
- `blog-archived/` hosts the Nuxt 2 client in `client/` and support scripts in `scripts/`; fixtures live under `fixtures/`.
- `article/` keeps long-form content in `content/` plus automation under `scripts/` and `actions/`.
- Add new user-facing apps under `apps/*` and shared utilities under `packages/*` so `turbo` and Vitest discover them.
- Root configs (`turbo.json`, `eslint.config.js`, `monorepo.config.ts`) define shared linting, build caching, and workspace wiring—extend them whenever new workspaces appear.

## Build, Test, and Development Commands
- `pnpm install` respects the enforced preinstall hook; never swap to npm or yarn.
- `pnpm dev` runs `turbo run dev --parallel`; scope with `pnpm dev --filter @icebreakers/blog-archived`.
- `pnpm build` compiles production bundles, mirroring Netlify deploy expectations.
- `pnpm lint` executes ESLint and stylelint; rely on autofix before hand-tuning files.
- `pnpm test` runs Vitest with coverage, while `pnpm test:dev` keeps tests in watch mode.
- `pnpm script:sync` aligns markdown spacing and other shared assets—run before proposing content changes.

## Coding Style & Naming Conventions
- Write TypeScript ESM modules; avoid new CommonJS files.
- Name Vue components with PascalCase filenames (e.g. `blog-archived/client/components/global/OutSideLink.vue`); keep utility directories lowercase-kebab.
- Let ESLint and `@icebreakers/stylelint-config` enforce formatting; prefer editor format-on-save over manual tweaks.
- For markdown, allow the sync scripts to reflow spacing instead of manual edits.

## Testing Guidelines
- Use Vitest exclusively; co-locate `*.test.ts` or `*.spec.ts` beside the source they cover.
- Prefer deterministic fixtures under `blog-archived/fixtures/` and keep assertions meaningful to preserve coverage.
- Run `pnpm test` before pushing; add new tests whenever behavior changes or regressions are addressed.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat(blog-archived): add new hero block`); lint runs via Husky.
- Verify `pnpm lint` and `pnpm test` pass, update docs when behavior shifts, and attach screenshots for UI updates.
- Link issues in the PR description and add a Changeset when modifying published packages; keep generated artifacts out of Git.

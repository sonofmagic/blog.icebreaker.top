# Repository Guidelines

## Project Structure & Module Organization

icebreaker.top is a pnpm-managed monorepo. `blog-archived/` hosts the Nuxt 2 site (Vue code in `client/`, supporting scripts in `scripts/`). `article/` collects Markdown sources (`content/`) and automation scripts (`scripts/`, `actions/`). Root configs (`turbo.json`, `eslint.config.js`, `monorepo.config.ts`) power shared tooling; add new apps under `apps/*` and shared packages under `packages/*` so workspace and Vitest globs pick them up.

## Build, Test, and Development Commands

Work on Node 20 with pnpm 10; `pnpm install` is enforced by `preinstall`. `pnpm dev` launches `turbo run dev --parallel`; trim scope with `pnpm dev --filter @icebreakers/blog-archived`. Use `pnpm build` for production bundles and `pnpm lint` for ESLint + stylelint. `pnpm test` runs Vitest with coverage, while `pnpm test:dev` keeps tests watching. Monorepo helpers like `pnpm script:sync` wrap common automation tasks.

## Coding Style & Naming Conventions

Stick to ESM and TypeScript; avoid new CommonJS modules. The shared ESLint preset enforces Vue 2 SFC rules and ignores `**/fixtures/**`; rely on editor autofix or `pnpm lint`. Name Vue components with PascalCase filenames (e.g. `client/components/global/OutSideLink.vue`) and keep utility folders lowercase-kebab. CSS and PostCSS changes should satisfy the `@icebreakers/stylelint-config`. For markdown, let the existing sync scripts reflow spacing instead of manual edits.

## Testing Guidelines

Vitest is the only supported test runner. Co-locate `*.test.ts` or `*.spec.ts` files next to the source they verify, and expose shared helpers through `packages/*` so `vitest.workspace.ts` discovers them. Follow the fixture patterns in `blog-archived/fixtures/` for deterministic data. Coverage is on by default; prefer meaningful assertions over blanket `skip` or `todo`.

## Commit & Pull Request Guidelines

Commit messages must satisfy Conventional Commits (`commitlint` runs via Husky); use `<type>(scope): summary` with scopes like `blog-archived` or `article`. Before opening a PR, ensure `pnpm lint` and `pnpm test` pass, update documentation when behavior changes, and attach screenshots for UI tweaks. Describe the change, link issues, and add a Changeset whenever code in a publishable package ships. Keep generated assets out of version control to preserve clean Netlify deploy previews.

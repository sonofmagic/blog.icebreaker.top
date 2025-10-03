# Repository Guidelines

## Project Structure & Module Organization
Icebreaker.top is a pnpm-managed monorepo targeting Node 20. Front-end apps live under `apps/`, shared libraries in `packages/`, and the legacy Nuxt 2 client sits in `blog-archived/client/`. Long-form content appears in `article/content/` with helpers in `article/scripts/` and `article/actions/`. Co-locate tests beside source files (for example, `blog-archived/fixtures/userList.test.ts`) and keep automation utilities in `blog-archived/scripts/`.

## Build, Test, and Development Commands
Run `pnpm install` to satisfy the preinstall guard and sync workspace dependencies. Use `pnpm dev --filter @icebreakers/blog-archived` for Nuxt development or `pnpm dev` to start all active apps. `pnpm build` produces Netlify-ready bundles, `pnpm lint` runs ESLint plus Stylelint, and `pnpm test` executes the Vitest suite with coverage. Before shipping content updates, execute `pnpm script:sync` to normalize markdown and assets.

## Coding Style & Naming Conventions
Author ESM-based TypeScript or Vue files only—avoid CommonJS. Follow repository formatting via the root `eslint.config.js` and `@icebreakers/stylelint-config`; enable editor format-on-save instead of manual edits. Name Vue components with PascalCase filenames (e.g., `blog-archived/client/components/global/OutsideLink.vue`) and keep utility directories in lowercase-kebab case. Prefer descriptive module names that reflect feature scope.

## Testing Guidelines
Vitest is the standard test runner. Place `*.test.ts` or `*.spec.ts` beside the code under test and reuse deterministic fixtures from `blog-archived/fixtures/`. Target meaningful coverage, capturing regression cases for scripts and content processors. Run `pnpm test` locally before every push and ensure CI remains green when introducing new packages or Turbo pipelines.

## Commit & Pull Request Guidelines
Use Conventional Commits such as `feat(blog-archived): add hero block`. Each PR should describe scope, link related issues, and attach Netlify or UI screenshots for visual changes. Verify `pnpm lint` and `pnpm test` are clean, update documentation for behavior shifts, and add a Changeset for publishable packages. Keep generated artifacts out of Git history.

## Automation & Environment
Match the Node 20 target (consider Volta) and respect Husky hooks—they enforce linting and guardrails. Review `turbo.json`, `monorepo.config.ts`, and existing scripts before adding new tasks so caching and filters remain accurate. When unsure, run `git pull origin main --ff-only` before branching to sync with the automation defaults.

# Repository Guidelines

## Project Structure & Module Organization

Icebreaker.top is a Node 20 pnpm monorepo. Front-end apps live under `apps/`, shared logic in `packages/`, and the retired Nuxt 2 client sits here in `blog-archived/client/`. Long-form articles reside in `article/content/` with helpers in `article/scripts/` and `article/actions/`. Co-locate specs beside code (for example, `blog-archived/fixtures/userList.test.ts`) and keep automation helpers within `blog-archived/scripts/`. Store temporary scratch work elsewhere to keep the tree predictable.

## Build, Test, and Development Commands

Run `pnpm install` first to satisfy the preinstall guard and sync workspace deps. Start the Nuxt client with `pnpm dev --filter @icebreakers/blog-archived`; use `pnpm dev` to spin up all active apps. Ship-ready bundles come from `pnpm build`, and `pnpm lint` runs both ESLint and Stylelint. Execute `pnpm test` for the Vitest suite with coverage, and `pnpm script:sync` before publishing content to normalize markdown and assets.

## Coding Style & Naming Conventions

Author ESM TypeScript or Vue files only—avoid CommonJS modules. Vue components use PascalCase filenames (e.g., `OutsideLink.vue`) while utility directories stay lowercase-kebab-case. Let the root `eslint.config.js` and `@icebreakers/stylelint-config` dictate formatting; enable editor format-on-save rather than manual lint fixes. Keep comments purposeful and prefer descriptive module names that reflect feature scope.

## Testing Guidelines

Vitest is the runner of record. Name files `*.test.ts` or `*.spec.ts` and place them next to the source or fixtures they exercise. Reuse deterministic data from `blog-archived/fixtures/`, and target coverage for bug-prone scripts and content processors. Always run `pnpm test` before pushing to keep CI green.

## Commit & Pull Request Guidelines

Follow Conventional Commits, such as `feat(blog-archived): add hero block`. PRs should summarize scope, link related issues, and attach Netlify or UI screenshots for visual updates. Confirm `pnpm lint` and `pnpm test` pass locally, add documentation for behavior changes, and include a Changeset when touching publishable packages. Exclude generated artifacts from Git history.

## Automation & Environment

Match the Node 20 runtime (Volta recommended) and respect Husky hooks—they enforce linting and guardrails. Review `turbo.json` and `monorepo.config.ts` before introducing new tasks so caching and filters stay accurate. Run `git pull origin main --ff-only` before branching to align with automation defaults.

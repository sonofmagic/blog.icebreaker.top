# Repository Guidelines

Icebreaker.top is a pnpm-managed monorepo that targets Node 20. Start by updating main (`git pull origin main --ff-only`) and reviewing existing automation scripts before you branch off.

## Project Structure & Module Organization
`blog-archived/` contains the Nuxt 2 client under `client/`, shared fixtures in `fixtures/`, and helper utilities in `scripts/`. Long-form content lives in `article/content/` with supporting automation in `article/scripts/` and `article/actions/`. New front-end apps belong in `apps/*`; share reusable code in `packages/*` so Turbo tasks and Vitest detect them. Root configs such as `turbo.json`, `eslint.config.js`, and `monorepo.config.ts` coordinate workspace wiring—extend them when new workspaces appear.

## Build, Test, and Development Commands
Run `pnpm install` to respect the enforced preinstall hook; do not substitute npm or yarn. Use `pnpm dev` (or `pnpm dev --filter @icebreakers/blog-archived`) for local development. `pnpm build` produces production bundles aligned with Netlify deploys. `pnpm lint` calls ESLint and stylelint, and `pnpm test` executes the Vitest suite with coverage. Execute `pnpm script:sync` before submitting content to normalize markdown spacing and shared assets.

## Coding Style & Naming Conventions
Write TypeScript ESM modules and avoid introducing CommonJS files. Name Vue components with PascalCase filenames like `blog-archived/client/components/global/OutSideLink.vue`, while utilities stay in lowercase-kebab directories. Rely on the repository ESLint plus `@icebreakers/stylelint-config` for formatting; enable editor format-on-save instead of manual styling.

## Testing Guidelines
Vitest is the single testing framework. Co-locate `*.test.ts` or `*.spec.ts` beside the code under test, using deterministic fixtures from `blog-archived/fixtures/` when possible. Run `pnpm test` before each push and expand coverage with meaningful assertions whenever behavior changes.

## Commit & Pull Request Guidelines
Follow Conventional Commits, e.g. `feat(blog-archived): add hero block`. Ensure `pnpm lint` and `pnpm test` pass, update documentation when behavior shifts, and attach Netlify or UI screenshots for visual updates. Link relevant issues in the PR description, add a Changeset for published packages, and keep generated artifacts out of Git.

## Automation & Environment Notes
The project targets Node 20; match the version locally or via Volta. Turbo orchestrates workspace tasks, so keep new scripts declarative and cache-aware. Respect Husky hooks and the preinstall guard—they enforce consistent tooling across contributors.

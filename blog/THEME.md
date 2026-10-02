# Icefield theme

The homepage uses an original, deterministic Three.js icefield inspired by the
retrofuturist art direction of Retronova. No reference-site images, fonts or
scripts are embedded.

## Development

Use Node 24 LTS (>=24.11.0 <25) and pnpm. If `blog/content` is missing, run
`pnpm --filter @icebreakers/blog sync` once to link the existing article source.
Start the preview with `pnpm --filter @icebreakers/blog dev`; the default port is 9000. Native SQLite dependencies must be compiled with the same Node version.

## Theme and assets

- `app/assets/css/tailwind.css` defines semantic theme colors, typography, shared
  layout and prose. Existing `--gh-*` and Nuxt UI variables map to these tokens.
- `HomeHero.vue` keeps its heading, navigation and poster server-rendered.
  `IcefieldScene.vue` runs inside `ClientOnly` and imports the renderer only when
  visible on a desktop with motion enabled.
- `app/utils/icefield.ts` owns the seeded geometry, camera, lighting and disposal.
  The scene pauses offscreen, in background tabs and when explicitly paused.
  Mobile, reduced-motion and WebGL failures use the static poster.
- `public/images/icefield-poster.webp` is a 1920 × 1080 capture of the same scene.
  When changing the scene, export a fresh canvas capture at that size, without
  the hero text, shading, scan lines or developer overlays, and encode as WebP.
  Those overlays are applied by the hero component to both live and static views.
- Anton and IBM Plex Mono are served from `public/fonts`. Each font has its SIL
  Open Font License alongside it. Chinese text uses system sans-serif fonts.
- Nuxt Content generates GitHub light/dark syntax colors for readable code in
  both themes; code panel backgrounds use the shared surface token.

The theme keeps the existing routes, filter query parameters, theme storage key
and reading-history schema. No article migration is required.

## Acceptance

Run `pnpm lint`, `pnpm test`, `pnpm typecheck` and `pnpm --filter @icebreakers/blog build` on Node 24 LTS.
For visual changes, check desktop, tablet and a 390px phone in both themes.
Verify filtering and reload, empty results, load more, reading history and resume,
TOC keyboard interaction, code copying, wide tables, print layout, reduced motion,
WebGL fallback and repeated navigation away from and back to the homepage.

## Article reader

Article layout and prose are owned by `app/assets/css/reader.css`. The default
body is 18px (rem-based), 1.85 line height, at most 720px wide. A 220px chapter
rail appears from 1200px; smaller screens use a bottom tool strip and native
modal dialogs. Focus mode hides the shared header, footer and chapter rail.

`useReadingPreferences` shares SSR-safe defaults through Nuxt state and restores
16/18/20px and focus preferences on mount, using the independent
`icebreaker:reading-preferences` localStorage key. Storage failure leaves the
controls usable for the current session. Changing the layout anchors the current
visible block. Progress and resume both use the article body, excluding the site
footer; the existing reading-history format is unchanged.

Reader acceptance additionally covers keyboard dialog focus/escape, preference
reload, blocked storage, layout changes mid-paragraph, no-heading articles,
200% zoom, print and local horizontal overflow in code and tables.

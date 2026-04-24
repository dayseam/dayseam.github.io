# dayseam.github.io

Marketing site for [Dayseam](https://github.com/vedanthvdev/dayseam), the local-first macOS app that stitches your workday into an evidence-linked report.

Live at: https://dayseam.github.io

## Stack

- [Astro 4](https://astro.build) — static site, zero JS by default.
- [Tailwind CSS 3](https://tailwindcss.com) for styling.
- Deployed to GitHub Pages from `main` via `.github/workflows/deploy.yml`.

## Local development

```bash
pnpm install
pnpm dev
```

The dev server runs at `http://localhost:4321`.

To type-check and build:

```bash
pnpm check
pnpm build
```

## Deployment

Any push to `main` triggers the Pages deploy workflow. The workflow builds with Astro and publishes the `dist/` artifact to Pages.

## Custom domain

When a real domain is registered (`dayseam.com`, `dayseam.app`, or `dayseam.dev`), add a `CNAME` file to `public/` containing the domain and update the `site` value in `astro.config.mjs`. No other changes needed.

## Scope

This repo holds the Stage 1 launch site (one-page, static). Stage 2 will add scroll-driven sections tracking the narrative in [docs/review/2026-04-24-holistic-release-readiness-review.md](https://github.com/vedanthvdev/dayseam/blob/master/docs/review/2026-04-24-holistic-release-readiness-review.md) section 9.

Planning and issues for the website live in [vedanthvdev/dayseam#141](https://github.com/vedanthvdev/dayseam/issues/141).

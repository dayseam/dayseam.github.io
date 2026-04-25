# dayseam.github.io

The public marketing site for Dayseam, deployed to GitHub Pages at
[https://dayseam.github.io/](https://dayseam.github.io/).

> **Heads up:** this repository is a deploy mirror, not a source of
> truth. The canonical site code lives in the monorepo at
> [dayseam/dayseam](https://github.com/dayseam/dayseam) under
> [`apps/website/`](https://github.com/dayseam/dayseam/tree/master/apps/website).
> A sync workflow in the monorepo mirrors that tree into this repo's
> `main` branch on every push to `dayseam/dayseam` `master` that
> touches `apps/website/**`. Edits made directly here will be
> overwritten on the next sync. File bug reports and PRs against the
> monorepo, not this repo.

## Why two repos

Hosting the site at the root URL `https://dayseam.github.io/` (not
`/dayseam/`) requires a repository named exactly `dayseam.github.io`
under the `dayseam` org. The monorepo keeps the site alongside the
desktop app and its tests; this repo exists so GitHub Pages has a
repo with the right name to serve from. The sync workflow in the
monorepo is the bridge.

## Deploy pipeline

1. Engineer opens a PR against `dayseam/dayseam` touching
   `apps/website/**`.
2. PR merges to `master`.
3. `dayseam/dayseam` `.github/workflows/mirror-website.yml` rsyncs
   the `apps/website/` subtree to this repo's `main` branch.
4. `.github/workflows/deploy.yml` (in this repo) picks up the push,
   runs `astro check && astro build`, uploads the artifact, and
   deploys it to GitHub Pages via `actions/deploy-pages@v4`.
5. Site is live at `https://dayseam.github.io/` within a few minutes.

Pages is configured to deploy from `main` via GitHub Actions
(`build_type: workflow`), so the `deploy.yml` is the single
authoritative deployment surface. No branch-based Pages fallback.

## Local development

```bash
pnpm install
pnpm dev
# → http://localhost:4321
```

To reproduce what Pages serves:

```bash
pnpm build
pnpm preview
# → http://localhost:4321 (serving ./dist)
```

## Stack

- **[Astro 4](https://astro.build/)** for the static site shell.
  Zero JS by default, one React island for the scroll-driven hero.
- **TypeScript** in strict mode.
- **Tailwind CSS 3** with a Convergence-brand palette in
  `tailwind.config.mjs`.
- **Framer Motion 11** inside the React island for scroll-linked
  animation via `useScroll` / `useTransform`. Reduced-motion users
  get a static equivalent; the branch lives in
  `src/components/Hero.tsx`.

No analytics, no CMS, no backend. The site ships as static HTML + CSS
plus one JS bundle for the hero.

## Custom domain

Point a custom domain (e.g. `dayseam.com`) at this repo via the
`CNAME` file and the Pages settings. When that happens, also set
`SITE_URL=https://dayseam.com` in the deploy workflow env so
canonical tags, `og:url`, and the sitemap switch over from the
GitHub Pages URL without a code change.

## Attribution

See [`CREDITS.md`](./CREDITS.md) for attribution of the Simple Icons
brand marks shown in the connector grid and hero animation.

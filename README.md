# dayseam.github.io

The public marketing site for Dayseam, deployed to GitHub Pages at
[https://dayseam.github.io/](https://dayseam.github.io/).

This repository is the **canonical home** of the site code. Open
issues and PRs here for any change to the marketing site — the
design, copy, connector grid, hero animation, or deploy pipeline.
Bug reports about the desktop app still belong on the product
monorepo at [dayseam/dayseam](https://github.com/dayseam/dayseam).

> **Historical note:** until **DAY-171** the canonical site lived
> in `dayseam/dayseam` under `apps/website/`, and this repo was
> described as a "deploy mirror". That framing was accurate for
> exactly one PR: DAY-169 proposed (but never shipped) a
> `mirror-website.yml` sync workflow in the monorepo. DAY-171
> retired the two-repo split and deleted `apps/website/` from the
> monorepo — the Pages repo is the only place the site lives now.

## Why it lives in its own repo

GitHub Pages only serves the org-root URL
`https://dayseam.github.io/` from a repository named literally
`dayseam.github.io` under the `dayseam` org. Serving from
`dayseam/dayseam` would land at `/dayseam/` and break every
absolute-path asset the site ships. Since that constraint forced
this repo to exist anyway, DAY-171 made it the single source of
truth rather than keep a duplicate copy in the monorepo that had
to be synced across repos on every edit.

## Deploy pipeline

1. Engineer opens a PR against `dayseam/dayseam.github.io`
   touching any of `src/`, `public/`, `astro.config.mjs`,
   `tailwind.config.mjs`, `package.json`, etc.
2. PR merges to `master`.
3. [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)
   runs `astro check && astro build`, uploads the artifact, and
   deploys it to GitHub Pages via `actions/deploy-pages@v4`.
4. Site is live at `https://dayseam.github.io/` within a few
   minutes.

Pages is configured to deploy from `master` via GitHub Actions
(`build_type: workflow`), so `deploy.yml` is the single
authoritative deployment surface. No branch-based Pages fallback.
DAY-173 renamed the default branch from `main` to `master` to
match `dayseam/dayseam`; the rename was done through GitHub's
branch-rename endpoint, which updated open-PR targets and
branch-protection rules in the same call.

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

## Cross-repo contract with the desktop app

The five currently-shipping connector brand marks (GitHub, GitLab,
Jira, Confluence, Git) and their per-theme accent hexes are
duplicated between this repo's
[`src/data/connectors.ts`](./src/data/connectors.ts) and the
desktop app's
[`apps/desktop/src/components/ConnectorLogo.tsx`](https://github.com/dayseam/dayseam/blob/master/apps/desktop/src/components/ConnectorLogo.tsx).
When Simple Icons updates a mark upstream, or the brand palette
moves, change both repos in the same change set. There is no CI
gate spanning the two today; a future shared `@dayseam/ui` package
would close that loop.

## Custom domain

Point a custom domain (e.g. `dayseam.com`) at this repo via a
`CNAME` file in `public/` and the Pages settings. When that
happens, also set `SITE_URL=https://dayseam.com` in the deploy
workflow env so canonical tags, `og:url`, and the sitemap switch
over from the GitHub Pages URL without a code change.

## Attribution

See [`CREDITS.md`](./CREDITS.md) for attribution of the Simple Icons
brand marks shown in the connector grid and hero animation.

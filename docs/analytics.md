# Analytics & SEO runbook

Where Dayseam's marketing-site data lives, how it's wired up, and where
to look when something stops behaving. This file is the single source of
truth for those questions; if a new tool gets added, update this file in
the same change.

Two things are tracked, and only after the visitor accepts the cookie
banner:

- **Microsoft Clarity** — qualitative behaviour (session replay,
  heatmaps, scroll depth, rage clicks). Free, no sampling, no quotas.
- **Google Search Console** — search-side performance (queries,
  impressions, position, indexing health, Core Web Vitals). Not loaded
  on the page; verified via a static `<meta name="google-site-verification">`
  token.

A third slot is wired but inactive:

- **Google Analytics 4** — quantitative traffic and audience data.
  Component code is in place; `PUBLIC_GA_MEASUREMENT_ID` repo secret is
  unset, so the loader no-ops gracefully.

The desktop app's "zero telemetry" promise applies to the app, not this
site. The marketing site is allowed to have analytics because (a) it's
behind explicit opt-in consent, and (b) it answers the "is this thing
landing with anyone" question that the desktop app deliberately doesn't
need to.

## Dashboards

| Tool                  | What it answers                                                  | Open it                                                                                                              |
| --------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Microsoft Clarity     | "What did this user actually do? Where do they get stuck?"       | [clarity.microsoft.com/.../wixj0xbqz0](https://clarity.microsoft.com/projects/view/wixj0xbqz0)                       |
| Google Search Console | "Are we indexed? For which queries? Is anything broken?"         | [search.google.com/search-console](https://search.google.com/search-console?resource_id=https%3A%2F%2Fdayseam.github.io%2F) |
| Google Analytics 4    | "How much traffic, from where, doing what?"                      | _Pending. Add `PUBLIC_GA_MEASUREMENT_ID` to repo secrets to activate._                                               |

Quick router for "which dashboard for which question":

- **"How many people visited yesterday?"** — GA4 (when wired). Until
  then, Clarity → Insights gives a session count, just less polished.
- **"Where do people drop off on the home page?"** — Clarity →
  Heatmaps + Scroll heatmaps.
- **"Do users actually click Download?"** — Clarity → Recordings,
  filtered by clicks on the Download CTA.
- **"Is `/integrations/github` indexed?"** — GSC → URL Inspection →
  paste the URL.
- **"What are people searching for to find us?"** — GSC → Performance →
  Queries.
- **"Are we passing Core Web Vitals?"** — GSC → Experience → Core Web
  Vitals.

## Configuration

Three GitHub Actions repository secrets drive the integrations. They
live on `dayseam/dayseam.github.io` → Settings → Secrets and variables →
Actions → Repository secrets:

| Secret                       | Used by                          | Format                | Status              |
| ---------------------------- | -------------------------------- | --------------------- | ------------------- |
| `PUBLIC_CLARITY_PROJECT_ID`  | `src/components/Analytics.astro` | `^[a-z0-9]{6,16}$`    | Set (`wixj0xbqz0`)  |
| `PUBLIC_GSC_VERIFICATION`    | `src/layouts/Base.astro`         | Opaque GSC token      | Set                 |
| `PUBLIC_GA_MEASUREMENT_ID`   | `src/components/Analytics.astro` | `^G-[A-Z0-9]{8,12}$`  | Unset               |

All three are passed to the Astro build via
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)'s
`env:` block. They default to empty strings when unset, and both
`Analytics.astro` and `Base.astro` defensively no-op on missing or
malformed IDs — so removing a secret won't break the build, it'll just
stop emitting that integration.

## Consent flow

Two components implement the privacy-aware loading pattern:

- **[`src/components/CookieConsent.astro`](../src/components/CookieConsent.astro)** —
  fixed-bottom banner shown on first visit. "Accept" persists
  `dayseam-cookie-consent-v1=accepted` in `localStorage` and dispatches
  a `dayseam:consent-granted` custom event on `window`. "Decline"
  persists `=declined` and the banner stays dismissed. The footer's
  "Cookie preferences" link reopens the banner so a visitor can change
  their mind at any time.
- **[`src/components/Analytics.astro`](../src/components/Analytics.astro)** —
  emits an inline `<script>` that injects GA4 + Clarity *only* if
  `localStorage.getItem("dayseam-cookie-consent-v1") === "accepted"` on
  page load, or after the consent-granted event fires.

Three consequences worth knowing when debugging:

1. The first page view of an accepting visitor *is* captured — the
   inline loader runs synchronously during page load, after the
   `localStorage` check.
2. A visitor who accepts mid-session has the rest of that session
   captured but loses the initial pageview from before they accepted.
   This is the tradeoff for not pre-loading the trackers.
3. A Decline visitor produces zero third-party requests. The HTML
   *contains* references to `clarity.ms` and `googletagmanager.com` in
   the loader function, but the actual `<script>` tags are only
   injected by the post-consent loader, so they never resolve.

## Verifying the pipeline end-to-end

1. Open `https://dayseam.github.io/` in an incognito window.
2. Click Accept on the banner.
3. Click around for ~30 seconds — scroll, hover, click the Download CTA.
4. In Clarity → Recordings, your session should appear within
   2–3 minutes.
5. (When GA4 is wired) In GA4 → Reports → Realtime, the active-user
   counter should tick up within 60 seconds.
6. In GSC → Performance, search-query data takes ~7 days to become
   meaningful, so don't worry if it's empty initially.

If a step fails, the typical causes are:

- **Secret unset for that build** — check the Actions log for the
  deploy run; missing IDs are silently ignored.
- **Wrong ID format** — the regex in `Analytics.astro` rejects
  malformed IDs without logging. Re-paste the ID, watching for stray
  whitespace or wrapping characters.
- **Browser-side blocking** — uBlock Origin, Brave Shields, Privacy
  Badger, or DNS-level blockers will block `clarity.ms` and
  `googletagmanager.com`. Test in a clean profile or with extensions
  disabled.

## Adding a new analytics tool

1. Add a new env-var slot to `.github/workflows/deploy.yml`.
2. Read it via `import.meta.env.PUBLIC_<NAME>` in the relevant
   component.
3. Validate the ID format defensively with a regex. Silently no-op on
   malformed input — the goal is "missing analytics", not "broken
   site".
4. Make script injection conditional on the consent state. Re-use the
   `loadAnalytics` pattern in `Analytics.astro` (extend the same
   function rather than adding a parallel one — single point of
   consent-gating is easier to reason about).
5. Update this file's Dashboards + Configuration tables in the same
   PR.

## Rotating or revoking credentials

- **Clarity** — log in to
  [clarity.microsoft.com](https://clarity.microsoft.com/), recreate
  the project, paste the new ID into the `PUBLIC_CLARITY_PROJECT_ID`
  secret, re-run the deploy workflow. Update the dashboard link at the
  top of this file.
- **GSC** — verification tokens are tied to a property, not revocable
  in isolation. To invalidate, delete the URL-prefix property in
  Search Console; the meta tag becomes dead but harmless. Remove the
  `PUBLIC_GSC_VERIFICATION` secret to drop it from the next build.
- **GA4** — archive the property in GA4 Admin, replace the secret.
  Old data is retained per GA4's retention policy (default: 14 months
  for event data).

## Sitemap & robots

- [`astro.config.mjs`](../astro.config.mjs) is configured with
  `@astrojs/sitemap`. Every build emits `/sitemap-index.xml` →
  `/sitemap-0.xml`; new pages auto-appear with no manual edits.
- [`public/robots.txt`](../public/robots.txt) is a hand-maintained
  crawl policy that points at the sitemap and currently allows all
  bots.
- After a structural change (new top-level page, removed page, route
  restructure), GSC → Sitemaps → re-submit
  `https://dayseam.github.io/sitemap-index.xml` to nudge the indexer.
  This is belt-and-braces — Google will re-fetch on its own crawl
  schedule — but a manual ping shaves days off discovery for a new
  page.

## Related changes

- **DAY-207** introduced the analytics + SEO foundations (this stack).
- **DAY-208** is queued to add per-integration landing pages, which
  will auto-appear in the sitemap and become the first real test of
  whether the SEO scaffolding is converting.

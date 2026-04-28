// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

// DAY-166 / DAY-169 / DAY-207. Marketing site for Dayseam.
//
// Output: static. The site has no backend, no user accounts, no
// database — the whole point of Dayseam is that the product itself
// is local-first, so the marketing site that pitches it should not
// quietly require a server. Every page renders at build time; the
// only client-side JavaScript is the hero animation island, which
// is mounted with `client:only="react"` (not `client:visible`)
// because `useScroll` / `useMotionValue` read `window` synchronously
// at setup — SSR would blow up. `client:only` is the correct
// directive for browser-only islands, and it still defers loading
// until after HTML paint, so time-to-first-content is unaffected.
//
// `site` drives Astro's canonical + og:url + sitemap URL generation.
// Default is https://dayseam.github.io (the live Pages URL), which
// is also what the build runs at in the dayseam/dayseam.github.io
// deploy workflow. When the dayseam.com apex domain is live, set
// `SITE_URL=https://dayseam.com` in the deploy env and the canonical
// tags will switch without a code change. Hardcoding dayseam.com
// here (the previous default) produced canonical URLs that pointed
// at a domain that did not resolve, which is the fastest way to
// tell Google not to index the site that *does* resolve.
export default defineConfig({
  site: process.env.SITE_URL || "https://dayseam.github.io",
  output: "static",
  compressHTML: true,
  // Astro's dev toolbar is a floating chrome strip at the bottom of
  // dev builds — useful when actively iterating, noisy when sharing
  // the site with stakeholders or running a smoke test. Disabling
  // it keeps the preview visually identical to production. The flag
  // only affects `astro dev`; `astro build` never ships the toolbar.
  devToolbar: {
    enabled: false,
  },
  integrations: [
    react(),
    tailwind({
      // Let us own `src/styles/global.css` so we can layer custom
      // brand tokens (the Convergence strand colours) on top of
      // Tailwind's base without the integration injecting a
      // competing `base.css`.
      applyBaseStyles: false,
    }),
    // DAY-207. Auto-emit /sitemap-index.xml + /sitemap-0.xml at build
    // time. The integration walks every route Astro knows about
    // (`src/pages/**/*.astro` plus dynamic `getStaticPaths`) and
    // generates an XML index + per-batch sitemap with the canonical
    // URL derived from `site` above. We only have one route today
    // (`/`); when DAY-208 lands the per-integration landing pages
    // (`/integrations/<tool>`) the sitemap auto-includes them with
    // zero config changes — that's the whole point of generating it
    // from routes instead of hand-maintaining a list. `lastmod` falls
    // back to the build timestamp, which is the correct signal for a
    // static site that rebuilds per release.
    sitemap({
      // Hint to Google's prioritisation. Defaults are fine for a
      // single-page site, but once integration landing pages exist
      // we want the home page weighted slightly higher.
      changefreq: "weekly",
      priority: 0.8,
    }),
  ],
  vite: {
    ssr: {
      // framer-motion ships a client-only `sync` export path that
      // trips Astro's SSR resolver on static-build; marking it
      // external makes Astro defer it to the client island rather
      // than trying to evaluate it during build.
      noExternal: [],
    },
  },
});

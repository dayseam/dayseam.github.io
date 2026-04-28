// DAY-207. One-shot generator for `public/og-image.png` — the
// 1200x630 social-share card every Open Graph and Twitter Card
// preview reaches for when someone pastes a dayseam.github.io URL
// into Slack, X, LinkedIn, Discord, iMessage rich previews, etc.
//
// Why this exists at all
//
//   Without an og:image, every share preview falls back to the
//   browser's link-preview heuristic — usually a tiny favicon and
//   the page title in plain text. That's a measurable click-through
//   penalty: branded social cards consistently outperform plain
//   text-only previews on every platform's published case studies.
//   For a marketing site whose entire job is "make people click
//   the download CTA", the social card is the highest-leverage
//   single asset on the site.
//
// Why a script and not a checked-in pixel push
//
//   The Convergence mark is the canonical brand source of truth
//   (`public/dayseam-mark.svg` — see CREDITS.md "do not redraw,
//   re-rasterise"). If/when the strand colours or geometry change
//   in DAY-161-style brand work, every raster derived from the
//   mark needs to regenerate, and that needs to be a one-line
//   command. Hand-pushing a PNG and forgetting how it was built
//   means the next palette refresh either ships an off-brand
//   social card forever, or sends a future maintainer hunting
//   through three layers of design tooling. A `pnpm build:og`
//   script with the recipe in version control kills that risk.
//
// Why not let the build do it
//
//   `astro build` does not need this output to succeed — the PNG
//   is referenced from `og:image` meta but Astro doesn't validate
//   the target exists at build time. Running `sharp` on every
//   GitHub Pages deploy is wasted work for an asset that changes
//   on the order of once per palette refresh, and `sharp` carries
//   a non-trivial native binary that we'd rather not require on
//   the CI Node install. Generate locally, commit the PNG, deploy
//   the static asset.
//
// Reproducibility
//
//   The composition is fully described as inline SVG below — no
//   external image inputs, no font-file dependencies (text uses a
//   generic sans-serif stack that resolves to whatever the host's
//   librsvg picks; on the macOS dev machines the project is
//   actively built on, that's SF Pro). librsvg is bundled by
//   sharp's prebuilt binary, so re-running this script on a fresh
//   clone with `pnpm install && pnpm build:og` produces the same
//   PNG within the bounds of system-font resolution.
//
// Usage
//
//   pnpm build:og
//
//   The script writes `public/og-image.png` and exits 0 on
//   success. Commit the regenerated PNG.

import { mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "..", "public", "og-image.png");

// Brand tokens — must stay in sync with `public/dayseam-mark.svg`
// and `tailwind.config.mjs`. Any divergence here will produce a
// social card that contradicts the live site visually, which is
// the worst possible outcome for share-link CTR.
const COLORS = {
  charcoal: "#17171A",
  strandGold: "#E89A2C",
  strandTeal: "#2B8AA0",
  strandCoral: "#D94F6E",
  strandSage: "#5BA567",
  strandIndigo: "#4D6DD0",
  cream: "#F6F1E6",
  zincLight: "#E4E4E7",
  zincMid: "#A1A1AA",
  zincDim: "#71717A",
};

// Open Graph + Twitter both standardise on 1200x630 for the large
// summary card. LinkedIn and Slack inherit the same dimensions.
// Going larger doesn't help any consumer; going smaller produces
// scale-up blur on retina previews.
const WIDTH = 1200;
const HEIGHT = 630;

// Mark layout — rounded square, vertical-centered on the left.
const MARK_SIZE = 360;
const MARK_X = 90;
const MARK_Y = (HEIGHT - MARK_SIZE) / 2;

// Mark internals at MARK_SIZE — the Convergence geometry from the
// brand SVG, rescaled from 1024 → MARK_SIZE proportionally. Five
// strands fanning into a central point at (66%, 50%), exiting as a
// dashed seam to the right edge of the mark.
const MARK_SCALE = MARK_SIZE / 1024;
const SCALED_STROKE = Math.round(28 * MARK_SCALE);
const ANCHOR_X = Math.round(680 * MARK_SCALE);
const ANCHOR_Y = Math.round(512 * MARK_SCALE);
const STRAND_RADIUS = 229 * MARK_SCALE;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.charcoal}"/>

  <g transform="translate(${MARK_X}, ${MARK_Y})">
    <rect x="0" y="0" width="${MARK_SIZE}" height="${MARK_SIZE}" rx="${STRAND_RADIUS}" ry="${STRAND_RADIUS}" fill="#0E0E10"/>
    <g stroke-width="${SCALED_STROKE}" stroke-linecap="round" fill="none">
      <line x1="${Math.round(292 * MARK_SCALE)}" y1="${Math.round(230 * MARK_SCALE)}" x2="${ANCHOR_X}" y2="${ANCHOR_Y}" stroke="${COLORS.strandGold}"/>
      <line x1="${Math.round(224 * MARK_SCALE)}" y1="${Math.round(364 * MARK_SCALE)}" x2="${ANCHOR_X}" y2="${ANCHOR_Y}" stroke="${COLORS.strandTeal}"/>
      <line x1="${Math.round(200 * MARK_SCALE)}" y1="${Math.round(512 * MARK_SCALE)}" x2="${ANCHOR_X}" y2="${ANCHOR_Y}" stroke="${COLORS.strandCoral}"/>
      <line x1="${Math.round(224 * MARK_SCALE)}" y1="${Math.round(660 * MARK_SCALE)}" x2="${ANCHOR_X}" y2="${ANCHOR_Y}" stroke="${COLORS.strandSage}"/>
      <line x1="${Math.round(292 * MARK_SCALE)}" y1="${Math.round(794 * MARK_SCALE)}" x2="${ANCHOR_X}" y2="${ANCHOR_Y}" stroke="${COLORS.strandIndigo}"/>
      <line x1="${ANCHOR_X}" y1="${ANCHOR_Y}" x2="${Math.round(980 * MARK_SCALE)}" y2="${ANCHOR_Y}" stroke="${COLORS.cream}" stroke-dasharray="${Math.round(44 * MARK_SCALE)} ${Math.round(24 * MARK_SCALE)}"/>
    </g>
  </g>

  <g font-family="-apple-system, 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif">
    <text x="540" y="290" font-size="92" font-weight="700" fill="#FFFFFF" letter-spacing="-2">Dayseam</text>
    <text x="540" y="350" font-size="32" font-weight="500" fill="${COLORS.zincLight}">The daily work report,</text>
    <text x="540" y="395" font-size="32" font-weight="500" fill="${COLORS.zincLight}">written from evidence.</text>
    <text x="540" y="455" font-size="22" font-weight="400" fill="${COLORS.zincMid}">GitHub. GitLab. Jira. Confluence. Outlook. Local git.</text>
    <text x="540" y="488" font-size="22" font-weight="400" fill="${COLORS.zincMid}">Stitched into Markdown, on your laptop.</text>
  </g>

  <g font-family="'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace">
    <text x="${WIDTH - 90}" y="${HEIGHT - 50}" font-size="20" fill="${COLORS.zincDim}" text-anchor="end">dayseam.github.io</text>
  </g>
</svg>`;

await mkdir(dirname(OUT_PATH), { recursive: true });

// Compression level 9 keeps the file under ~50 KB even at 1200x630.
// Twitter/Facebook cap at 8 MB; we're nowhere near, but small means
// the page-source HTML referencing the og-image isn't penalised on
// "page weight" SEO heuristics either.
await sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile(OUT_PATH);

const { size } = await stat(OUT_PATH);
const kb = Math.round(size / 1024);
console.log(`Wrote ${OUT_PATH} (${kb} KB, ${WIDTH}x${HEIGHT})`);

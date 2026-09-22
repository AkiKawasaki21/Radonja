# ANDRIJA RADONJIC — Portrait, archive, and field stories

Next.js 15 App Router, TypeScript, Tailwind CSS v4, GSAP, and Lenis. The brief supplies the identity, palette, typography, and content; the latest owner direction supplies the full name Andrija Radonjic and determines the portrait, scroll, and field-story presentation. `RADONJA-BRIEF.md`, all 14 supplied photographs, and the two supplied portrait originals are unchanged.

## Run

Requires Node.js 20.9+ and npm.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Production: `npm run build && npm start`.

## Experience

The existing tape loader opens into a centered, upward-looking portrait. The supplied `radonjamain.PNG` fills the hero and tilts subtly with a desktop pointer. The supplied `radonja.PNG` sits in the same image coordinate space, aligned by facial landmarks. Swiping across the screen sends a broad, curved stream through the gold artwork. A continuously curved boundary, tapered ends, and subtle ripples give it liquid movement; the wake recedes within 580ms of the last movement. Warm contour lines drift around the head and respond to the same swipe, with a brighter layer following the reveal. On phones, the optional Explore portrait control pauses page scrolling so touch gestures can move freely over the portrait. Unlock scroll restores navigation; the default remains normal vertical scrolling. The browser's native cursor is retained.

Scrolling scales down the entire original hero frame while the gold signature writes across it. The portrait remains at the center of this composition. The signature is a child of the hero scene, so this transition preserves the same frame instead of switching between separate portraits.

Photographs enter from the lower-right as the signature scene gives way to an open, staggered panorama. Continued downward scrolling moves the viewpoint rightward through the archive on both desktop and mobile. The ten photographs keep their original order and captions, with callouts after photographs 4 and 8. On mobile, each photo keeps its full source aspect ratio and fits within the available screen height; the first frame’s label arrives after the outgoing signature caption. Photographs retain their original colors at every input mode, including desktop. The full quote follows the gallery. Mobile sizing includes iPhone safe areas, stable scroll-scene heights, text-size adjustment control, and SVG direction icons to avoid platform emoji substitution. The On-field / Off-field choices remain paired on phones.

The On-field / Off-field gateway follows the quote. On-field opens a coach-facing film-room overlay with six individually selectable clip spaces, explicitly marked as footage coming soon. Off-field opens the story supplied by the owner: his grandfather Mojas Radonjic, his roots in Montenegro, playing for two clubs through a two-way contract, and the difficult decision to pursue a future in American college soccer. Both overlays support Escape, visible close controls, focus restoration, and scrolling within the overlay.

## Content

- `content/schedule.ts`: manually maintained next match, with the official UCR source and verification date.
- `content/quote.ts`: the brief's placeholder quote, highlighted keyword, and gallery fragments.
- `content/profile.ts`: the supplied off-field story.
- `content/clips.ts`: six planned clip categories and their photo previews; video footage is not supplied yet.
- `content/gallery.ts`: the ten photographs in the brief's order; callouts follow photographs 4 and 8.
- `public/signature.svg` and `content/signature.ts`: matching placeholder single-stroke artwork. Replace both when the signed original arrives.
- `public/photos/`: stable filenames; Next serves optimized AVIF/WebP copies with embedded blur placeholders.
- `public/portraits/`: exact PNG copies of the active portrait assets. Next Image serves these unoptimized to preserve the supplied pixels; blur placeholders appear only during loading.

Each Act 1 section is a client component in `components/act1/`. `lib/gsap.ts` registers the three plugins only in the browser. `app/providers.tsx` connects Lenis to the GSAP ticker and ScrollTrigger.

The loader counts decoded hero images and `document.fonts.ready`. Successful loads end in the tape wipe; slow or failed loads reveal the page at the deadline without falsely reporting completion. A CSS fail-open guarantees the overlay cannot linger beyond 1.6 seconds, even before hydration. Session storage skips repeat visits before paint.

Motion preferences are resolved centrally by `lib/motion-preference.ts`. The device preference is the default; visitors may explicitly enable the full scroll experience from the hero notice or choose full/reduced/device settings in the footer. That choice lasts for the session. Full motion uses the same connected portrait-to-signature transition and downward-driven horizontal gallery on phones and desktop. Reduced motion removes animation and pinning while keeping the signature over the same portrait and the archive compact; it no longer inserts a separate blank signature section. All motion CSS uses the same resolved setting as GSAP and Lenis. Gallery keyboard controls are Left/Right and Home/End. The portrait supports Enter/Space to toggle a still, full reveal; reduced-motion pointer activation uses the same still toggle.

## Portrait assets

The active portrait originals live one directory above this project: `../radonjamain.PNG` and `../radonja.PNG`. Both PNGs retain their full 1122×1402 dimensions and original encoded content, including the gold portrait’s transparency. Neither layer is recompressed or resized on the server. The previously supplied `spatialarea.HEIC` remains untouched but is no longer the hero source.

To regenerate the browser copies after installing dependencies:

```sh
node scripts/prepare-portraits.mjs
```

The script copies the originals directly to `public/portraits/radonja-main.png` and `public/portraits/hidden-portrait.png`. It does not modify `public/photos/` or the supplied originals.

## Check

```sh
npm run lint
npm run typecheck
npm run build
npm run check:bundle
# With the server running and Google Chrome installed:
npm run test:e2e
# To check a production server on another port:
PLAYWRIGHT_BASE_URL=http://localhost:3001 npm run test:e2e
```

The existing browser suite covers the earlier portrait geometry and reveal; its asset-coordinate and mask assertions need updating for the latest PNG and ribbon design. No verification was run for this revision at the user's request. `check:bundle` sums gzip sizes of the homepage's production JavaScript chunks and fails at 200 KB.

## Deploy

Every push to `main` publishes the site to GitHub Pages through `.github/workflows/pages.yml`. That build sets `GITHUB_PAGES=true`, which switches `next.config.ts` to a static export under the repository's base path with unoptimized images. Preview the Pages build locally:

```sh
GITHUB_PAGES=true PAGES_BASE_PATH=/Radonja npx next build
```

The files land in `out/`; serve that folder at `/Radonja/`.

## Performance verification

The targets remain less than 200 KB of gzipped homepage JavaScript and LCP below 2.5 seconds. The earlier scaffold's measurements do not describe this redesigned hero. Final production performance measurements for the redesign are pending; gallery images remain deferred until the section approaches the viewport.

Measure with the production server on port 3001:

```sh
npx lighthouse http://localhost:3001 --only-categories=performance --throttling-method=devtools --throttling.requestLatencyMs=150 --throttling.downloadThroughputKbps=1638 --throttling.uploadThroughputKbps=750 --throttling.cpuSlowdownMultiplier=4 --chrome-flags='--headless=new'
```

The portrait, archive, quote, and On-field / Off-field overlays are built. Match clips have no video assets yet; their spaces are intentional placeholders. The quote and signature remain placeholders from the brief.

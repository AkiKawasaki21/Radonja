# RADONJA — Act 1

Next.js 15 App Router, TypeScript, Tailwind CSS v4, GSAP, and Lenis. `RADONJA-BRIEF.md` remains the source of truth. The original brief and all 14 supplied photographs are unchanged.

## Run

Requires Node.js 20.9+ and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Production: `npm run build && npm start`.

## Content

- `content/schedule.ts`: manually maintained next match, with the official UCR source and verification date.
- `content/quote.ts`: the brief's placeholder quote, highlighted keyword, and gallery fragments.
- `content/gallery.ts`: the ten photographs in the brief's order; callouts follow photographs 4 and 8.
- `public/signature.svg` and `content/signature.ts`: matching placeholder single-stroke artwork. Replace both when the signed original arrives.
- `public/photos/`: stable filenames; Next serves optimized AVIF/WebP copies with embedded blur placeholders.

Each Act 1 section is a client component in `components/act1/`. `lib/gsap.ts` registers the three plugins only in the browser. `app/providers.tsx` connects Lenis to the GSAP ticker and ScrollTrigger.

The loader counts decoded hero images and `document.fonts.ready`. Successful loads end in the tape wipe; slow or failed loads reveal the page at the deadline without falsely reporting completion. A CSS fail-open guarantees the overlay cannot linger beyond 1.6 seconds, even before hydration. Session storage skips repeat visits before paint.

Reduced motion removes the loader, smooth scrolling, parallax, text entrance, signature draw, and gallery pin. The full signature and quote remain visible. Under 768px and with reduced motion, the gallery uses native horizontal scroll-snap. Desktop gallery keyboard controls: Left/Right, Home/End. The portrait also supports Enter/Space.

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

The browser suite checks all five sections, exact gallery order, desktop hover and keyboard controls, mobile scroll reveal, reduced motion, live preference/breakpoint changes, session skipping, and browser errors/warnings. `check:bundle` sums gzip sizes of the homepage's production JavaScript chunks and fails at 200 KB.

## Initial verification

- Production build, TypeScript, ESLint, and five Chrome behavior tests pass; no browser warnings, console errors, or uncaught exceptions.
- Homepage JavaScript: **171.9 KB gzip** (decimal KB, nine modern-browser chunks).
- Optimized hero: **32.3 KB AVIF** at the measured mobile size; **65.1 KB** for the largest configured 1920px request. Original JPEGs remain untouched.
- Lighthouse 13.5 mobile, direct DevTools throttling at 150ms latency, 1.638 Mbps down, 750 Kbps up, and 4× CPU slowdown: **LCP 2.3s**, performance **95**, CLS **0**.
- Lighthouse's default simulated slow-4G model: **LCP 3.1s**, performance **94**, accessibility **100**. This stricter estimate remains above the 2.5s target; production field performance still needs validation after deployment.
- Measurements used local production serving with a cold browser cache and cached Next image transformations. Gallery images are deferred until the section approaches the viewport.

Reproduce the direct-throttling measurement with the production server on port 3001:

```sh
npx lighthouse http://localhost:3001 --only-categories=performance --throttling-method=devtools --throttling.requestLatencyMs=150 --throttling.downloadThroughputKbps=1638 --throttling.uploadThroughputKbps=750 --throttling.cpuSlowdownMultiplier=4 --chrome-flags='--headless=new'
```

Only Act 1 is built. The quote and signature are intentionally placeholders from the brief; later acts are outside this scaffold.

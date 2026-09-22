# RADONJA — Brand + Act 1 build brief (source of truth)

Sept 21, 2026. Owner: Aleksa Vujosevic. Subject: Radonja, #15, D1 men's soccer, UC Riverside, Montenegrin.
Goal: a landonorris.com-grade personal site that puts him in front of MLS / higher-D1 programs before the late-Nov 2026 portal window (2025's window was Nov 24–Dec 24). Site live and circulating by ~Nov 15, 2026.

If you are an AI coding agent reading this: every decision below is final. Do not propose alternative palettes, fonts, or stacks. Build exactly this.

---

## 1. What the photos say
- Constants in nearly every frame: **#15**, **white-taped wrists**, short crop, light eyes, jaw. These are his visual signatures — not the UCR kit.
- Only two light moods exist: **golden-hour warm** and **stadium-night / B&W grit**. Nothing cool-toned → warm off-white type, black base (not navy).
- The strongest frames are B&W. The site leans monochrome; color arrives as a reward (hover / flag / golden hour).
- He is transferring → **never brand around UCR blue.**

## 2. Palette (final)
| Token | Hex | Use |
|---|---|---|
| carbon | `#0B0B0C` | page background |
| graphite | `#1C1C1F` | cards, rules, dividers |
| bone | `#F2EDE4` | all type |
| gold | `#C9A646` | THE accent — one element at a time (numeral, tape band, signature stroke, cursor) |
| goldDeep | `#8F7330` | hover / pressed / secondary |
| crimson | `#B3202A` | restricted: only inside flag moments (flag photo, loader's last 150 ms). Never UI. |

Why gold, not red: Montenegro's flag is a red field with a gold border and gold crest — he is the crest, not the field. Gold = the wrist tape at golden hour, premium on black, club-agnostic.

## 3. Motif system
1. **The tape band** — a short, thick horizontal bar (bone or gold). Literally his wrist tape. It is the loader bar, the underline under the numeral, the section divider, the hover underline. Primary mark; survives any number/club change.
2. **The numeral 15** — Anton, giant, gold.
3. **The flag reveal** — the site's "Lando helmet": B&W hero portrait → hover/press → color flag portrait crossfades in.
4. **Double-headed eagle** (Montenegrin crest) as thin gold line-art, hidden only: favicon, 404, footer. Never large.

## 4. Type (Google Fonts via next/font)
- Display: **Anton** (numerals, name) + **Bebas Neue** (eyebrows, captions)
- Quote: **Instrument Serif** italic
- Body/UI: **Instrument Sans**

## 5. Stack (final)
- Next.js 15 App Router + TypeScript + Tailwind v4. Deploy: Vercel.
- `gsap@^3.13` (ScrollTrigger, SplitText, DrawSVGPlugin — all free) + `lenis` for smooth scroll. No Rive. No Framer Motion.
- `next/image` AVIF/WebP, blur placeholders. Photos live in `/public/photos` (already present in this folder).
- Content in `/content/*.ts`. No CMS in v1.
- `prefers-reduced-motion` respected everywhere.
- Perf: LCP < 2.5 s on 4G, hero image ≤ 250 KB, total JS < 200 KB gz.

## 6. Photo map (`/public/photos`)
| File | What it is | Where it's used |
|---|---|---|
| hero-stare.jpg | B&W, looking up, training bib | Hero base image |
| hero-flag.jpg | Color, Montenegrin flag over shoulders, pointing | Hero hover/reveal |
| back-15.jpg | B&W, back of shirt #15, sweat | Quote background @ 12% |
| gallery-01-ucla-night.jpg | Wide night shot at UCLA | Rail 1 — "Westwood, under the lights" |
| gallery-02-night-profile.jpg | Night side profile, blue kit | Rail 2 — "Away day" |
| gallery-03-lmu-battle-bw.jpg | B&W physical battle vs LMU | Rail 3 — "Back to goal. Nobody moves him." |
| gallery-04-warmup-header.jpg | Golden hour, heading the ball | Rail 4 — "Warmups, Riverside" |
| gallery-05-golden-strike.jpg | Golden hour, striking | Rail 5 — "Left foot, last light" |
| gallery-06-volley-skyblue.jpg | Mid-air volley, sky-blue kit | Rail 6 — "Airborne" |
| gallery-07-home-whites.jpg | White kit, daytime | Rail 7 — "Home whites" |
| gallery-08-redlands-huddle.jpg | Redlands FC huddle, close-up | Rail 8 — "Summer. Redlands FC." |
| gallery-09-water-bw.jpg | B&W, water over head | Rail 9 — "The work nobody films" |
| gallery-10-flag.jpg | Flag portrait | Rail 10 — "Montenegro → California" |
| spare-dusk-walk.jpg | Dusk, walking | Spare |

Text callouts interleave after rails 4 and 8 (quote fragments from `/content/quote.ts`).
These are compressed web copies; full-res originals will replace them later — keep filenames stable.

## 7. Act 1 — section spec
Reference mechanics (verified on landonorris.com): GSAP ScrollTrigger + Lenis; loader/hover/signature done with Rive there — we do them with GSAP; horizontal section = pin wrapper → sticky → track of cards (eyebrow + caption) with text callouts interleaved; split-text line reveals.

**0. Loader** (≤1.6 s; skip on repeat visit via sessionStorage)
Carbon screen. Gold tape band grows left→right as a real preload bar (hero images + `document.fonts.ready`). Numeral counts 0→15 in Anton. On complete the band expands vertically into a full-screen wipe revealing the hero; last 150 ms flashes crimson→gold. GSAP timeline.

**1. Hero** (100vh)
Left: eyebrow "Nº 15 · STRIKER · MONTENEGRO" (Bebas); name "RADONJA" in Anton at `clamp(64px, 18vw, 260px)`; gold tape band under it. Right: full-bleed `hero-stare.jpg`. Hover (desktop): crossfade to `hero-flag.jpg` + scale 1.04, cursor → gold dot labelled "MNE". Mobile: crossfade driven by scroll progress. Bottom-left: "NEXT MATCH — {opponent} · {date}" from `/content/schedule.ts`. Bottom-right: pulsing tape band as scroll cue.

**2. Signature draw** (140vh, scroll-scrubbed)
`/public/signature.svg` (placeholder single-stroke path until he signs), gold stroke 3px on carbon, DrawSVG with `scrub: true`, start `top center`, end `bottom 80%`.

**3. Quote**
One sentence from `/content/quote.ts`, Instrument Serif italic at `clamp(32px, 6vw, 96px)`, SplitText by lines rising with 0.06 s stagger, one keyword in gold. Background `back-15.jpg` at 12% opacity with slight parallax.

**4. Horizontal gallery** (the "screen slides left" illusion)
Wrapper `height: 400vh`; inner pinned (`pin: true, scrub: 1`); flex track translated `x: -(track.scrollWidth - innerWidth)`. Cards from `/content/gallery.ts` `{ src, eyebrow, caption }` — 10 photos + 2 text-callout cards after items 4 and 8. Under 768px: unpin, native horizontal scroll-snap.

Lenis in `app/providers.tsx`, synced with ScrollTrigger (`lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add`).

## 8. Content placeholders (replace when real ones arrive)
- Position: STRIKER
- Surname: TBD (needed for hero copy + domain)
- Quote: "It doesn't matter where you start — it's what you do with the minutes nobody sees." (placeholder, keyword: minutes)
- Next match: pull from UCR schedule manually into `/content/schedule.ts`

## 9. Assets still needed from Radonja
1. Full-res originals of all 13 + photographer permission.
2. 60-min dark-background portrait shoot, direct eye contact: B&W hero, with flag, taped-wrists close-up, back of shirt.
3. Signature in thick black marker on white paper (flat, daylight) or iPad SVG → vectorize to single-stroke paths.
4. One sentence in his words. Prompts: "What does Montenegro mean in how you play?", "What's the thing you do that nobody sees?", "Where are you in three years?"
5. Facts: full name, position, height, preferred foot, DOB, hometown, club history, UCR roster/stats link, highlight reel link, socials, contact email for coaches/agents.

## 10. Roadmap
- Wk 1 (to Sep 28): scaffold + Act 1 with these photos; placeholder signature/quote.
- Wk 2: shoot, signature, quote, facts → swap in. OG share card.
- Wk 3–4: Act 2 — On Pitch (position, stats, highlights embed, schedule), Off Pitch, Contact (coach/agent form + email), SEO, analytics.
- By Nov 15: live → link in bio, sent to agents / MLS academies / D1 coaches before the late-Nov portal window.

---

## Claude Code kickoff prompt
Run from inside this folder (it already contains `RADONJA-BRIEF.md` and `public/photos/`):

```
Read RADONJA-BRIEF.md in this folder first — it is the source of truth; do not change any decision in it.

Scaffold a Next.js 15 (App Router, TypeScript) + Tailwind v4 project IN THIS DIRECTORY (keep the existing RADONJA-BRIEF.md and public/photos/ intact). Install gsap@^3.13 and lenis. Register ScrollTrigger, SplitText, DrawSVGPlugin in a client-only lib/gsap.ts. Load fonts via next/font/google: Anton, Bebas_Neue, Instrument_Serif (italic), Instrument_Sans. Tailwind tokens: carbon #0B0B0C, graphite #1C1C1F, bone #F2EDE4, gold #C9A646, goldDeep #8F7330, crimson #B3202A. Respect prefers-reduced-motion everywhere.

Build only Act 1 of the homepage, in this order, each as its own client component under components/act1/, using the photo filenames and captions from the brief's photo map:

1. Loader: full-screen carbon overlay. A 2px "tape band" grows left→right tied to real preloading (hero images + document.fonts.ready); a numeral counts 0→15 in Anton. On complete the band expands vertically to wipe and reveal the page; last 150ms flashes crimson→gold. Total ≤1.6s. Skip on repeat visits via sessionStorage.

2. Hero (100vh): left column eyebrow "Nº 15 · STRIKER · MONTENEGRO" in Bebas, the name "RADONJA" in Anton at clamp(64px, 18vw, 260px), a gold tape band under it. Right: full-bleed B&W portrait public/photos/hero-stare.jpg. On hover (desktop) crossfade to public/photos/hero-flag.jpg with scale 1.04 and swap the cursor to a gold dot with the label "MNE"; on mobile trigger the crossfade by scroll progress instead. Bottom-left: "NEXT MATCH — {opponent} · {date}" from content/schedule.ts. Bottom-right: a pulsing tape band as the scroll cue.

3. Signature: 140vh section. Create public/signature.svg as a placeholder single-stroke path and render it with stroke gold 3px on carbon, DrawSVG scrubbed by ScrollTrigger start "top center" end "bottom 80%".

4. Quote: one sentence from content/quote.ts (use the placeholder in the brief) in Instrument Serif italic at clamp(32px, 6vw, 96px), SplitText by lines rising with 0.06s stagger on enter, the keyword wrapped in gold. Background: public/photos/back-15.jpg at 12% opacity with slight parallax.

5. Horizontal gallery: wrapper height 400vh; inner pinned (pin: true, scrub: 1) and a flex track translated x: -(track.scrollWidth - innerWidth). Cards from content/gallery.ts: { src, eyebrow, caption } — the 10 gallery photos in the brief's order with their captions, plus two text-callout cards interleaved after items 4 and 8. Under 768px unpin and fall back to native horizontal scroll-snap.

Wire Lenis smooth scroll in app/providers.tsx and sync it with ScrollTrigger (lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add). Use next/image with AVIF, priority on the hero, blur placeholders. Target: total JS < 200KB gz, LCP < 2.5s. Run the dev server, open it, and confirm all five sections work with no console errors. Then git init and make the first commit.
```

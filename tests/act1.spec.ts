import { test as base, expect, type Page } from "@playwright/test";

const test = base.extend<{ runtimeErrors: string[] }>({
  runtimeErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        errors.push(`${message.type()}: ${message.text()} (${message.location().url})`);
      }
    });
    await use(errors);
    expect(errors, "The page must not log console warnings, errors, or uncaught exceptions").toEqual([]);
  }, { auto: true }],
});

const captions = [
  "Westwood, under the lights",
  "Away day",
  "Back to goal. Nobody moves him.",
  "Warmups, Riverside",
  "It doesn't matter where you start",
  "Left foot, last light",
  "Airborne",
  "Home whites",
  "Summer. Redlands FC.",
  "it's what you do with the minutes nobody sees.",
  "The work nobody films",
  "Montenegro → California",
];

async function openPage(page: Page, reducedMotion = false) {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "RADONJA", exact: true })).toBeVisible();
  await expect(page.getByTestId("loader")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  if (!reducedMotion) await expect(page.locator("html")).toHaveClass(/lenis/);
}

async function scrollToSection(page: Page, id: string, fraction = 0, anchor = 0) {
  await page.evaluate(({ id, fraction, anchor }) => {
    const section = document.getElementById(id)!;
    const y = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y + section.offsetHeight * fraction - innerHeight * anchor, behavior: "instant" });
  }, { id, fraction, anchor });
}

async function revealOpacity(page: Page) {
  return page.locator("#hero-flag").evaluate((image) => Number(getComputedStyle(image.parentElement!).opacity));
}

async function signatureLength(page: Page) {
  return page.locator("#signature path").evaluate((path) => parseFloat(getComputedStyle(path).strokeDasharray) || 0);
}

test("desktop: portrait hover and keyboard reveal, signature, quote, and complete pinned gallery", async ({ page }) => {
  await openPage(page);
  const portrait = page.getByRole("button", { name: "Reveal Radonja with the Montenegro flag" });
  await expect.poll(() => revealOpacity(page)).toBeLessThan(0.01);
  await portrait.hover({ position: { x: 150, y: 150 } });
  await expect.poll(() => revealOpacity(page)).toBeGreaterThan(0.99);
  await expect(portrait.getByText("MNE", { exact: true })).toBeVisible();
  await expect.poll(() => page.locator("#hero-flag").evaluate((image) => new DOMMatrixReadOnly(getComputedStyle(image.parentElement!).transform).a)).toBeCloseTo(1.04, 2);
  await page.mouse.move(5, 500);
  await expect.poll(() => revealOpacity(page)).toBeLessThan(0.01);
  await portrait.focus();
  await page.keyboard.press("Enter");
  await expect(portrait).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => revealOpacity(page)).toBeGreaterThan(0.99);
  await page.keyboard.press("Enter");
  await expect(portrait).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => revealOpacity(page)).toBeLessThan(0.01);

  await expect.poll(() => signatureLength(page)).toBeLessThan(1);
  await scrollToSection(page, "signature", 0.4, 0.5);
  await expect.poll(() => signatureLength(page)).toBeGreaterThan(20);
  const partialStroke = await signatureLength(page);
  await scrollToSection(page, "signature", 1, 0.8);
  await expect.poll(() => signatureLength(page)).toBeGreaterThan(partialStroke + 20);

  await scrollToSection(page, "quote", 0.3);
  const lines = page.locator("#quote .quote-line");
  await expect.poll(() => lines.count()).toBeGreaterThan(0);
  await expect.poll(() => lines.evaluateAll((elements) => elements.every((element) => Number(getComputedStyle(element).opacity) > 0.99))).toBe(true);
  await expect(page.locator("#quote blockquote")).toHaveAccessibleName("It doesn't matter where you start — it's what you do with the minutes nobody sees.");
  await expect(page.locator("#quote blockquote span").filter({ hasText: /^minutes$/ })).toHaveCSS("color", "rgb(201, 166, 70)");

  const gallery = page.locator("#gallery");
  await expect(gallery.locator("figure")).toHaveCount(12);
  expect(await gallery.locator("figure").evaluateAll((figures) => figures.map((figure) => (figure.querySelector("h3, blockquote")?.textContent ?? "").trim()))).toEqual(captions);
  await expect(gallery.locator(".pin-spacer")).toHaveCount(1);
  await scrollToSection(page, "gallery", 0.1);
  await expect(gallery.locator("img")).toHaveCount(10);
  await expect(gallery.getByRole("heading", { name: "THE GAME, IN FRAMES." })).toBeInViewport();
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect(gallery.getByRole("img", { name: "Montenegro → California", exact: true })).toBeInViewport({ ratio: 0.9 });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });

  test("scroll reveals the flag and the gallery uses native horizontal scroll-snap", async ({ page }) => {
    await openPage(page);
    await expect.poll(() => revealOpacity(page)).toBeLessThan(0.01);
    const portrait = page.getByRole("button", { name: "Reveal Radonja with the Montenegro flag" });
    await portrait.tap({ position: { x: 200, y: 220 } });
    await expect(portrait).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => revealOpacity(page)).toBeGreaterThan(0.99);
    // A manual reveal must not overwrite and kill the mobile ScrollTrigger tween.
    await scrollToSection(page, "hero", 0.2);
    await expect.poll(() => revealOpacity(page)).toBeGreaterThan(0.2);
    await expect.poll(() => revealOpacity(page)).toBeLessThan(0.4);
    await scrollToSection(page, "hero", 0.45);
    await expect.poll(() => revealOpacity(page)).toBeGreaterThan(0.5);
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    const scroller = page.getByLabel("Photographs and quotes from the pitch");
    await expect(scroller).toHaveCSS("overflow-x", "auto");
    await expect(scroller).toHaveCSS("scroll-snap-type", "x mandatory");
    await expect(scroller).toHaveAttribute("data-lenis-prevent", "");
    await scrollToSection(page, "gallery");
    await expect(page.locator("#gallery img")).toHaveCount(10);
    await scroller.evaluate((element) => element.scrollTo({ left: element.scrollWidth, behavior: "instant" }));
    await expect(page.locator("#gallery").getByRole("img", { name: "Montenegro → California", exact: true })).toBeInViewport({ ratio: 0.9 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("signature and quote remain static, gallery is unpinned, and Lenis is absent", async ({ page }) => {
    await openPage(page, true);
    await expect(page.locator("html")).not.toHaveClass(/lenis/);
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    await expect(page.locator("#signature path")).toHaveCSS("stroke-dasharray", "none");
    await expect(page.locator("#quote .quote-line")).toHaveCount(0);
    await scrollToSection(page, "quote", 0.2);
    const quote = page.locator("#quote blockquote");
    await expect(quote).toBeInViewport();
    await expect(quote).toHaveCSS("opacity", "1");
    await expect(quote).toHaveCSS("transform", "none");
    await expect(page.getByLabel("Photographs and quotes from the pitch")).toHaveCSS("scroll-snap-type", "x mandatory");
    await scrollToSection(page, "hero");
    await page.getByRole("button", { name: "Reveal Radonja with the Montenegro flag" }).press("Enter");
    await expect.poll(() => revealOpacity(page)).toBe(1);
    await expect(page.locator("#hero-flag").locator("..")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  });
});

test("live motion-preference and viewport changes clean up active animations", async ({ page }) => {
  await openPage(page);
  const portrait = page.getByRole("button", { name: "Reveal Radonja with the Montenegro flag" });
  await portrait.hover({ position: { x: 150, y: 150 } });
  await expect.poll(() => revealOpacity(page), { intervals: [20] }).toBeGreaterThan(0.05);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(page.locator("#signature path")).toHaveCSS("stroke-dasharray", "none");
  await expect(page.locator("#quote .quote-line")).toHaveCount(0);
  await expect(portrait.getByText("MNE", { exact: true })).toBeHidden();
  await expect.poll(() => revealOpacity(page)).toBeLessThan(0.01);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel("Photographs and quotes from the pitch")).toHaveCSS("scroll-snap-type", "x mandatory");
  await portrait.click({ position: { x: 200, y: 220 } });
  await expect.poll(() => revealOpacity(page)).toBe(1);
  await expect(page.locator("#hero-flag").locator("..")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await expect(portrait).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => revealOpacity(page)).toBeLessThan(0.01);
  await scrollToSection(page, "hero", 0.45);
  await expect.poll(() => revealOpacity(page)).toBeGreaterThan(0.5);
  await expect(page.locator(".pin-spacer")).toHaveCount(0);

  await scrollToSection(page, "hero");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator("#gallery .pin-spacer")).toHaveCount(1);
  await page.mouse.move(5, 500);
  await portrait.hover({ position: { x: 150, y: 150 } });
  await expect.poll(() => revealOpacity(page)).toBeGreaterThan(0.99);
  await expect(portrait.getByText("MNE", { exact: true })).toBeVisible();
});

test("the loader dismisses promptly and a repeat visit skips its animation", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("loader")).toHaveCount(0, { timeout: 2_000 });
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("radonja:act1:seen"))).toBe("1");
  // Observe the highest progress value after reload; skipping must never start a preload animation.
  await page.addInitScript(() => {
    Object.assign(window, { __repeatLoaderProgress: 0 });
    const observer = new MutationObserver(() => {
      const progress = Number(document.querySelector('[data-testid="loader"]')?.getAttribute("aria-valuenow") ?? 0);
      const state = window as typeof window & { __repeatLoaderProgress: number };
      state.__repeatLoaderProgress = Math.max(state.__repeatLoaderProgress, progress);
    });
    observer.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-valuenow"] });
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("loader")).toHaveCount(0, { timeout: 2_000 });
  expect(await page.evaluate(() => (window as typeof window & { __repeatLoaderProgress: number }).__repeatLoaderProgress)).toBe(0);
});

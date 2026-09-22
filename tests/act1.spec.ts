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
    expect(errors, "No console warnings, errors, or uncaught exceptions").toEqual([]);
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
const portraitName = "Reveal the hidden gold portrait";

async function openPage(page: Page, reducedMotion = false) {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "RADONJA", exact: true })).toBeVisible();
  await expect(page.getByTestId("loader")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  if (!reducedMotion) await expect(page.locator("html")).toHaveClass(/lenis/);
  await expect.poll(() => page.locator("#hero-stare").evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
}

async function scrollToSection(page: Page, id: string) {
  await page.evaluate((sectionId) => {
    const section = document.getElementById(sectionId)!;
    window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
  }, id);
}

async function scrollThroughPin(page: Page, id: "hero" | "gallery", progress: number) {
  await page.evaluate(({ id, progress }) => {
    const section = document.getElementById(id)!;
    const start = section.getBoundingClientRect().top + window.scrollY;
    // Both scenes reserve their scroll distance in the containing section.
    window.scrollTo({ top: start + (section.offsetHeight - innerHeight) * progress, behavior: "instant" });
  }, { id, progress });
}

async function opacity(page: Page) {
  return page.getByTestId("portrait-reveal").evaluate((element) => Number(getComputedStyle(element).opacity));
}

async function signatureLength(page: Page) {
  return page.locator("#signature-art path").evaluate((path) => parseFloat(getComputedStyle(path).strokeDasharray) || 0);
}

async function frameScale(page: Page) {
  return page.getByTestId("hero-frame").evaluate((element) => element.getBoundingClientRect().width / innerWidth);
}

async function headPoint(page: Page) {
  return page.getByTestId("portrait-plane").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width * 0.527, y: rect.top + rect.height * 0.455 };
  });
}

async function checkInitialPortrait(page: Page) {
  const geometry = await page.evaluate(() => {
    const frame = document.querySelector('[data-testid="hero-frame"]')!.getBoundingClientRect();
    const plane = document.querySelector('[data-testid="portrait-plane"]')!.getBoundingClientRect();
    const art = document.getElementById("hero-reveal")!.getBoundingClientRect();
    const title = document.getElementById("hero-title")!.getBoundingClientRect();
    // Compare facial landmarks measured independently in the two source assets.
    const baseEye = { x: plane.left + plane.width * 632.7 / 1200, y: plane.top + plane.height * 727.9 / 1600 };
    const hiddenEye = { x: art.left + art.width * 639 / 1122, y: art.top + art.height * 654.7 / 1402 };
    return {
      width: innerWidth, height: innerHeight,
      frameWidth: frame.width, frameHeight: frame.height,
      frameCenter: frame.left + frame.width / 2,
      titleCenter: title.left + title.width / 2,
      headCenter: plane.left + plane.width * 0.445,
      eye: baseEye, eyeAlignmentError: Math.hypot(baseEye.x - hiddenEye.x, baseEye.y - hiddenEye.y),
      planeWidth: plane.width,
    };
  });
  expect(geometry.frameWidth).toBeCloseTo(geometry.width, 0);
  expect(geometry.frameHeight).toBeCloseTo(geometry.height, 0);
  expect(Math.abs(geometry.frameCenter - geometry.width / 2)).toBeLessThan(2);
  expect(Math.abs(geometry.titleCenter - geometry.width / 2)).toBeLessThan(2);
  // His upward three-quarter pose places the visible eye right of the head's center.
  expect(Math.abs(geometry.headCenter - geometry.width / 2)).toBeLessThan(geometry.width * 0.11);
  expect(geometry.eye.y).toBeGreaterThan(geometry.height * 0.15);
  expect(geometry.eye.y).toBeLessThan(geometry.height * 0.7);
  expect(geometry.eyeAlignmentError).toBeLessThan(geometry.planeWidth * 0.025);
  await expect(page.getByRole("button", { name: portraitName })).not.toHaveCSS("cursor", "none");
  await expect(page.getByTestId("portrait-reveal")).toHaveCSS("pointer-events", "none");
}

async function checkZoomAndSignature(page: Page, mobile = false) {
  const titleWidth = (await page.locator("#hero-title").boundingBox())!.width;
  const originalImage = await page.locator("#hero-stare").getAttribute("src");
  await expect.poll(() => signatureLength(page)).toBeLessThan(1);
  await scrollThroughPin(page, "hero", 0.5);
  await expect.poll(() => frameScale(page)).toBeLessThan(0.85);
  await expect.poll(() => signatureLength(page)).toBeGreaterThan(30);
  const partialStroke = await signatureLength(page);
  const partialScale = await frameScale(page);
  expect(partialScale).toBeGreaterThan(mobile ? 0.59 : 0.43);
  await expect(page.locator("#signature-art")).toBeVisible();
  await expect.poll(async () => (await page.getByTestId("portrait-stage").boundingBox())!.y).toBeCloseTo(0, 0);

  await scrollThroughPin(page, "hero", 0.93);
  await expect.poll(() => frameScale(page)).toBeCloseTo(mobile ? 0.59 : 0.43, 2);
  await expect.poll(() => signatureLength(page)).toBeGreaterThan(partialStroke + 50);
  const geometry = await page.evaluate(() => {
    const frame = document.querySelector('[data-testid="hero-frame"]')!.getBoundingClientRect();
    const title = document.getElementById("hero-title")!.getBoundingClientRect();
    return { x: frame.left + frame.width / 2, y: frame.top + frame.height / 2, titleWidth: title.width, width: innerWidth, height: innerHeight };
  });
  expect(Math.abs(geometry.x - geometry.width / 2)).toBeLessThan(2);
  expect(Math.abs(geometry.y - geometry.height / 2)).toBeLessThan(2);
  // The headline scales with the photo: this catches a portrait-only zoom regression.
  expect(geometry.titleWidth / titleWidth).toBeCloseTo(await frameScale(page), 2);
  expect(await page.locator("#hero-stare").getAttribute("src")).toBe(originalImage);
}

async function checkGallery(page: Page) {
  const gallery = page.locator("#gallery");
  const scroller = page.getByLabel("Photographs and quotes from the pitch");
  await expect(gallery.locator("figure")).toHaveCount(12);
  expect(await gallery.locator("figure").evaluateAll((figures) => figures.map((figure) => (figure.querySelector("blockquote") ?? figure.querySelector("figcaption"))?.textContent?.trim()))).toEqual(captions);
  await expect(gallery.locator(".pin-spacer")).toHaveCount(1);
  await scrollThroughPin(page, "gallery", 0);
  await expect(gallery.locator("img")).toHaveCount(10);
  // The archive chrome stays hidden during its overlap with the departing signature.
  await expect(gallery.locator("header")).toHaveCSS("visibility", "hidden");
  const first = gallery.locator('[data-frame="1"]');
  await expect.poll(async () => (await first.boundingBox())!.y).toBeGreaterThan(page.viewportSize()!.height * 0.4);
  const incoming = (await first.boundingBox())!;
  expect(incoming.x).toBeGreaterThan(page.viewportSize()!.width * 0.25);
  await scrollThroughPin(page, "gallery", 0.09);
  await expect.poll(async () => (await first.boundingBox())!.y).toBeLessThan(incoming.y - 40);
  await expect(gallery.getByRole("heading", { name: "THE GAME, IN FRAMES." })).toBeInViewport();
  await scrollThroughPin(page, "gallery", 0.5);
  await expect.poll(async () => (await first.boundingBox())!.x).toBeLessThan(-page.viewportSize()!.width);
  await expect(gallery.getByRole("heading", { name: "THE GAME, IN FRAMES." })).toBeInViewport();
  await scrollThroughPin(page, "gallery", 0.999);
  await expect(gallery.getByRole("img", { name: "Montenegro → California", exact: true })).toBeInViewport({ ratio: 0.9 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  // Keyboard navigation must reach the same endpoints as vertical scrolling.
  await scroller.focus();
  await page.keyboard.press("Home");
  await expect.poll(async () => (await first.boundingBox())!.x).toBeGreaterThan(0);
  await page.keyboard.press("End");
  await expect(gallery.getByRole("img", { name: "Montenegro → California", exact: true })).toBeInViewport({ ratio: 0.9 });
}

test("desktop: centered spatial portrait, local pointer reveal, and whole-frame signature transition", async ({ page }) => {
  await openPage(page);
  await checkInitialPortrait(page);
  const portrait = page.getByRole("button", { name: portraitName });
  const reveal = page.getByTestId("portrait-reveal");
  await expect.poll(() => opacity(page)).toBeLessThan(0.01);
  const point = await headPoint(page);
  await page.mouse.move(point.x, point.y);
  await expect.poll(() => opacity(page)).toBeGreaterThan(0.99);
  await expect(reveal).not.toHaveAttribute("data-full", "true");
  await expect(reveal).not.toHaveCSS("mask-image", "none");
  const firstMaskX = await reveal.evaluate((element) => element.style.getPropertyValue("--reveal-x"));
  await page.mouse.move(point.x + 65, point.y + 35);
  await expect.poll(() => reveal.evaluate((element) => element.style.getPropertyValue("--reveal-x"))).not.toBe(firstMaskX);
  await expect.poll(() => page.getByTestId("portrait-plane").evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");
  await page.mouse.move(5, 5);
  await expect.poll(() => opacity(page)).toBeLessThan(0.01);
  await portrait.focus();
  await page.keyboard.press("Enter");
  await expect(portrait).toHaveAttribute("aria-pressed", "true");
  await expect(reveal).toHaveAttribute("data-full", "true");
  await expect(reveal).toHaveCSS("mask-image", "none");
  await expect.poll(() => opacity(page)).toBeGreaterThan(0.99);
  await page.keyboard.press("Enter");
  await expect(portrait).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => opacity(page)).toBeLessThan(0.01);
  await checkZoomAndSignature(page);
});

test("desktop: the staggered photo landscape pans through all frames before the quote", async ({ page }) => {
  await openPage(page);
  await checkGallery(page);
  await scrollToSection(page, "quote");
  const quote = page.locator("#quote blockquote");
  await expect(quote).toHaveAccessibleName("It doesn't matter where you start — it's what you do with the minutes nobody sees.");
  await expect(page.locator("#quote blockquote span").filter({ hasText: /^minutes$/ })).toHaveCSS("color", "rgb(201, 166, 70)");
  const lines = page.locator("#quote .quote-line");
  await expect.poll(() => lines.count()).toBeGreaterThan(0);
  await expect.poll(() => lines.evaluateAll((elements) => elements.every((element) => Number(getComputedStyle(element).opacity) > 0.99))).toBe(true);
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });

  test("touch reveals the aligned artwork without blocking native vertical scrolling", async ({ page, context }) => {
    await openPage(page);
    await checkInitialPortrait(page);
    const portrait = page.getByRole("button", { name: portraitName });
    await expect(portrait).toHaveCSS("touch-action", "pan-y pinch-zoom");
    const point = await headPoint(page);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: point.x, y: point.y }] });
    await expect.poll(() => opacity(page)).toBeGreaterThan(0.3);
    for (let index = 1; index <= 5; index++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: point.x, y: point.y - index * 30 }] });
      await page.evaluate(() => new Promise(requestAnimationFrame));
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(40);
    await expect.poll(() => opacity(page)).toBeLessThan(0.01);
    await cdp.detach();
    await scrollThroughPin(page, "hero", 0);
    await expect.poll(() => frameScale(page)).toBeCloseTo(1, 2);
    await checkZoomAndSignature(page, true);
    await checkGallery(page);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("keeps the portrait and signature static, with a native accessible gallery", async ({ page }) => {
    await openPage(page, true);
    await expect(page.locator("html")).not.toHaveClass(/lenis/);
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    await expect(page.getByTestId("hero-frame")).toHaveCSS("transform", "none");
    await expect(page.locator("#signature-art path")).toHaveCSS("stroke-dasharray", "none");
    await expect(page.locator("#quote .quote-line")).toHaveCount(0);
    const portrait = page.getByRole("button", { name: portraitName });
    await portrait.press("Enter");
    await expect.poll(() => opacity(page)).toBe(1);
    await expect(page.getByTestId("portrait-reveal")).toHaveCSS("mask-image", "none");
    await expect(page.getByTestId("portrait-plane")).toHaveCSS("transform", "none");
    await portrait.press("Enter");
    await expect.poll(() => opacity(page)).toBe(0);
    await page.getByRole("link", { name: "Scroll to the signature" }).click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(page.viewportSize()!.height * 0.8);
    await expect(page.locator("#signature-art")).toBeInViewport();
    await scrollToSection(page, "gallery");
    const scroller = page.getByLabel("Photographs and quotes from the pitch");
    await expect(scroller).toHaveCSS("overflow-x", "auto");
    await expect(scroller).toHaveCSS("scroll-snap-type", "x mandatory");
    await expect(scroller).toHaveAttribute("data-lenis-prevent", "");
    await expect(page.locator("#gallery img")).toHaveCount(10);
    await scroller.focus();
    await page.keyboard.press("End");
    await expect(page.locator('#gallery [data-frame="10"] img')).toBeInViewport({ ratio: 0.9 });
    await scrollToSection(page, "quote");
    await expect(page.locator("#quote blockquote")).toHaveCSS("opacity", "1");
    await expect(page.locator("#quote blockquote")).toHaveCSS("transform", "none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});

test("live motion-preference and viewport changes clean up and restore both scroll scenes", async ({ page }) => {
  await openPage(page);
  const portrait = page.getByRole("button", { name: portraitName });
  const point = await headPoint(page);
  await page.mouse.move(point.x, point.y);
  await expect.poll(() => opacity(page)).toBeGreaterThan(0.3);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(page.locator("#signature-art path")).toHaveCSS("stroke-dasharray", "none");
  await expect(page.getByTestId("portrait-plane")).toHaveCSS("transform", "none");
  await expect.poll(() => opacity(page)).toBeLessThan(0.01);
  await page.setViewportSize({ width: 390, height: 844 });
  await portrait.press("Enter");
  await expect.poll(() => opacity(page)).toBe(1);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await expect(page.locator(".pin-spacer")).toHaveCount(2);
  await expect(portrait).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => opacity(page)).toBeLessThan(0.01);
  await scrollThroughPin(page, "hero", 0.93);
  await expect.poll(() => frameScale(page)).toBeCloseTo(0.59, 2);
  await scrollThroughPin(page, "hero", 0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator(".pin-spacer")).toHaveCount(2);
  await scrollThroughPin(page, "hero", 0.93);
  await expect.poll(() => frameScale(page)).toBeCloseTo(0.43, 2);
});

test("the loader dismisses promptly and repeat visits skip the animation", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("loader")).toHaveCount(0, { timeout: 2_000 });
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("radonja:act1:seen"))).toBe("1");
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

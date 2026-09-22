import "client-only";
import { gsap } from "@/lib/gsap";

type Point = { x: number; y: number; time: number };
type SweepElements = {
  plane: HTMLDivElement;
  surface: HTMLButtonElement;
  reveal: HTMLDivElement;
  clipPath: SVGPathElement;
  reduced: boolean;
  mouse: boolean;
};

// The reveal and the contour accents share a flowing, quickly receding stream.
// Coordinates live in the photo's space so the artwork stays aligned during tilt.
export function createPortraitSweep({ plane, surface, reveal, clipPath, reduced, mouse }: SweepElements) {
  const lifetime = 580;
  let points: Point[] = [];
  let frameId = 0;
  let held = false;
  let visible = true;
  let painting = false;
  let lastTime = 0;
  let lastMove = 0;
  let planeWidth = 1;
  let planeHeight = 1;
  const wave = { x: 0, y: 0, energy: 0 };
  const target = { x: 0, y: 0 };
  const direction = { x: 1, y: 0 };
  const tiltX = reduced ? null : gsap.quickTo(plane, "rotationX", { duration: 0.7, ease: "power3.out" });
  const tiltY = reduced ? null : gsap.quickTo(plane, "rotationY", { duration: 0.7, ease: "power3.out" });

  const drawRibbon = (time: number) => {
    if (!points.length) {
      clipPath.setAttribute("d", "M0 0Z");
      return;
    }
    const radius = Math.min(160, Math.max(70, surface.clientWidth * 0.105));
    const first = points[0];
    const last = points[points.length - 1];
    const head = points.length > 1 ? points[points.length - 2] : first;
    const dx = (last.x - head.x) * planeWidth;
    const dy = (last.y - head.y) * planeHeight;
    const speed = Math.hypot(dx, dy);
    if (speed > 1) {
      direction.x = dx / speed;
      direction.y = dy / speed;
    }

    // Extend into pointed, curved ends. Even the first touch makes a water-like
    // shape rather than a rectangle or a circular spotlight under the pointer.
    const controls: Point[] = points.length === 1 ? [
      { ...first, x: first.x - direction.x * radius * 1.45 / planeWidth, y: first.y - direction.y * radius * 1.45 / planeHeight },
      { ...first, x: first.x - (direction.x * 0.55 + direction.y * 0.32) * radius / planeWidth, y: first.y + (direction.x * 0.32 - direction.y * 0.55) * radius / planeHeight },
      first,
      { ...first, x: first.x + direction.x * radius * 0.8 / planeWidth, y: first.y + direction.y * radius * 0.8 / planeHeight },
    ] : [
      { ...first, x: first.x - (points[1].x - first.x) * 0.5, y: first.y - (points[1].y - first.y) * 0.5 },
      ...points,
      { ...last, x: last.x + direction.x * radius * 0.8 / planeWidth, y: last.y + direction.y * radius * 0.8 / planeHeight },
    ];

    // Sample by distance so slow and fast gestures bend the stream consistently.
    const distances = [0];
    for (let index = 1; index < controls.length; index++) {
      const a = controls[index - 1];
      const b = controls[index];
      distances.push(distances[index - 1] + Math.hypot((b.x - a.x) * planeWidth, (b.y - a.y) * planeHeight));
    }
    const length = distances[distances.length - 1];
    const count = Math.min(80, Math.max(16, Math.ceil(length / 10)));
    let segment = 1;
    let samples: Point[] = Array.from({ length: count }, (_, index) => {
      const distance = length * index / (count - 1);
      while (segment < controls.length - 1 && distances[segment] < distance) segment++;
      const mix = (distance - distances[segment - 1]) / (distances[segment] - distances[segment - 1] || 1);
      const a = controls[segment - 1];
      const b = controls[segment];
      return { x: a.x + (b.x - a.x) * mix, y: a.y + (b.y - a.y) * mix, time: a.time + (b.time - a.time) * mix };
    });
    // Round the centerline before creating its banks; tight mouse turns become bends.
    for (let pass = 0; pass < 4; pass++) {
      samples = samples.map((point, index) => {
        if (!index || index === count - 1) return point;
        const a = samples[index - 1];
        const b = samples[index + 1];
        return { ...point, x: (a.x + point.x * 2 + b.x) / 4, y: (a.y + point.y * 2 + b.y) / 4 };
      });
    }

    const upper: { x: number; y: number }[] = [];
    const lower: { x: number; y: number }[] = [];
    samples.forEach((point, index) => {
      const before = samples[Math.max(0, index - 1)];
      const after = samples[Math.min(count - 1, index + 1)];
      const dx = (after.x - before.x) * planeWidth;
      const dy = (after.y - before.y) * planeHeight;
      const distance = Math.hypot(dx, dy) || 1;
      const remaining = Math.min(1, Math.max(0, (lifetime - (time - point.time)) / 360));
      const position = index / (count - 1);
      const taper = Math.pow(Math.sin(Math.PI * position), 0.65);
      const ripple = 1 + 0.09 * Math.sin(position * Math.PI * 3 - time * 0.007);
      const width = radius * remaining * taper * ripple;
      const drift = Math.sin(position * Math.PI * 2 - time * 0.004) * radius * 0.045 * taper * remaining;
      const x = point.x - dy / distance * drift / planeWidth;
      const y = point.y + dx / distance * drift / planeHeight;
      const normalX = -dy / distance * width / planeWidth;
      const normalY = dx / distance * width / planeHeight;
      upper.push({ x: x + normalX, y: y + normalY });
      lower.push({ x: x - normalX, y: y - normalY });
    });

    // A closed quadratic spline gives the entire boundary continuous curves.
    // The artwork remains sharp inside it: no blur, feathering, or square caps.
    const outline = [...upper, ...lower.reverse()];
    const midpoint = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      `${((a.x + b.x) / 2).toFixed(5)} ${((a.y + b.y) / 2).toFixed(5)}`;
    let path = `M${midpoint(outline[outline.length - 1], outline[0])}`;
    outline.forEach((point, index) => {
      path += `Q${point.x.toFixed(5)} ${point.y.toFixed(5)} ${midpoint(point, outline[(index + 1) % outline.length])}`;
    });
    clipPath.setAttribute("d", `${path}Z`);
  };

  const paint = (time: number) => {
    const delta = Math.min(3, (time - (lastTime || time - 16.67)) / 16.67);
    lastTime = time;
    points = points.filter((point) => time - point.time < lifetime);
    drawRibbon(time);
    wave.x += (target.x - wave.x) * Math.min(1, 0.085 * delta);
    wave.y += (target.y - wave.y) * Math.min(1, 0.085 * delta);
    const energy = points.length ? Math.max(0, 1 - (time - lastMove) / lifetime) : 0;
    wave.energy += (energy - wave.energy) * Math.min(1, 0.11 * delta);
    plane.style.setProperty("--wave-x", `${wave.x.toFixed(2)}px`);
    plane.style.setProperty("--wave-y", `${wave.y.toFixed(2)}px`);
    plane.style.setProperty("--wave-energy", wave.energy.toFixed(3));

    if (!points.length && !held && painting) {
      reveal.style.opacity = "0";
      painting = false;
    }
    const settling = Math.abs(target.x - wave.x) + Math.abs(target.y - wave.y) > 0.1 || wave.energy > 0.005;
    if (visible && !held && (points.length || settling)) frameId = requestAnimationFrame(paint);
    else frameId = 0;
  };

  const schedulePaint = () => {
    if (!frameId && visible && !reduced && !held) frameId = requestAnimationFrame(paint);
  };

  const move = (event: PointerEvent) => {
    if (reduced || held || !visible) return;
    const bounds = plane.getBoundingClientRect();
    planeWidth = bounds.width;
    planeHeight = bounds.height;
    const time = performance.now();
    const point = { x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height, time };
    const previous = points[points.length - 1];
    if (!previous || Math.hypot((point.x - previous.x) * planeWidth, (point.y - previous.y) * planeHeight) > 7) {
      points.push(point);
      if (points.length > 64) points.shift();
    } else previous.time = time;
    lastMove = time;

    const area = surface.getBoundingClientRect();
    const x = (event.clientX - area.left) / area.width - 0.5;
    const y = (event.clientY - area.top) / area.height - 0.5;
    target.x = x * 72;
    target.y = y * 54;
    if (mouse && event.pointerType !== "touch") {
      tiltX?.(-y * 3.5);
      tiltY?.(x * 4.5);
    }
    if (!painting) {
      gsap.killTweensOf(reveal);
      reveal.style.opacity = "1";
      painting = true;
    }
    schedulePaint();
  };

  const leave = () => {
    target.x = 0;
    target.y = 0;
    tiltX?.(0);
    tiltY?.(0);
    // The short wake drains away smoothly after the gesture ends.
    schedulePaint();
  };
  const press = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") move(event);
  };
  const release = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") leave();
  };
  const toggle = (event: MouseEvent) => {
    if (event.detail !== 0 && !reduced) return;
    held = !held;
    points = [];
    painting = false;
    cancelAnimationFrame(frameId);
    frameId = 0;
    clipPath.setAttribute("d", "M0 0Z");
    surface.setAttribute("aria-pressed", String(held));
    reveal.dataset.full = String(held);
    gsap.killTweensOf(reveal);
    reveal.style.opacity = held ? "1" : "0";
    if (!held) leave();
  };

  surface.addEventListener("pointermove", move, { passive: true });
  surface.addEventListener("pointerleave", leave);
  surface.addEventListener("pointerdown", press, { passive: true });
  surface.addEventListener("pointerup", release);
  surface.addEventListener("pointercancel", leave);
  surface.addEventListener("click", toggle);

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    plane.dataset.waveActive = String(visible);
    if (!visible) {
      cancelAnimationFrame(frameId);
      frameId = 0;
      points = [];
      painting = false;
      clipPath.setAttribute("d", "M0 0Z");
      if (!held) reveal.style.opacity = "0";
    }
  });
  observer.observe(surface);

  return () => {
    observer.disconnect();
    cancelAnimationFrame(frameId);
    surface.removeEventListener("pointermove", move);
    surface.removeEventListener("pointerleave", leave);
    surface.removeEventListener("pointerdown", press);
    surface.removeEventListener("pointerup", release);
    surface.removeEventListener("pointercancel", leave);
    surface.removeEventListener("click", toggle);
    surface.setAttribute("aria-pressed", "false");
    delete reveal.dataset.full;
    delete plane.dataset.waveActive;
    clipPath.setAttribute("d", "M0 0Z");
    tiltX?.tween.kill();
    tiltY?.tween.kill();
    gsap.killTweensOf([plane, reveal]);
    gsap.set(plane, { clearProps: "transform" });
    reveal.style.removeProperty("opacity");
    ["--wave-x", "--wave-y", "--wave-energy"].forEach((property) => plane.style.removeProperty(property));
  };
}

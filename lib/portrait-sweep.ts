import "client-only";
import { gsap } from "@/lib/gsap";

type Point = { x: number; y: number; time: number };
type Vector = { x: number; y: number };
type Gesture = { began: number; duration: number; at: (progress: number) => Vector };
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
  // The portrait keeps drifting on its own so the gesture advertises itself.
  // A narrower ribbon and a dimmer reveal keep a real swipe the stronger one.
  const ambient = {
    enabled: !reduced,
    width: 0.72,
    reveal: 0.72,
    // The idle stream holds a far longer tail, so a whole stretch of the ring
    // glows at once instead of one shard flickering.
    trail: 1500,
    fade: 980,
    resumeAfter: 2600,
    firstDelay: 1200,
    gesture: null as Gesture | null,
    nextAt: 0,
  };
  // The head, in the photo's own coordinates. The contour mask uses the same spot.
  const face = { x: 0.44, y: 0.45 };
  // The gold icon ring in the hidden artwork, measured in the same coordinates.
  // Radii are in plane widths so a circle here stays a circle on screen.
  const halo = { x: 0.447, y: 0.461, radius: 0.267 };
  let points: Point[] = [];
  let frameId = 0;
  let held = false;
  let visible = true;
  let revealed = 0;
  let strength = 1;
  let lastTime = 0;
  let lastMove = 0;
  let lastTouch = 0;
  let trail = lifetime;
  let fade = 360;
  let planeWidth = 1;
  let planeHeight = 1;
  let aspect = 1;
  const wave = { x: 0, y: 0, energy: 0 };
  const target = { x: 0, y: 0 };
  const direction = { x: 1, y: 0 };
  const tiltX = reduced ? null : gsap.quickTo(plane, "rotationX", { duration: 0.7, ease: "power3.out" });
  const tiltY = reduced ? null : gsap.quickTo(plane, "rotationY", { duration: 0.7, ease: "power3.out" });

  const setReveal = (value: number) => {
    if (revealed === value) return;
    revealed = value;
    gsap.killTweensOf(reveal);
    reveal.style.opacity = String(value);
  };

  // Hand the stream back to a real gesture: full width, full gold, short wake.
  const interrupt = () => {
    strength = 1;
    trail = lifetime;
    fade = 360;
    ambient.gesture = null;
  };

  const addPoint = (x: number, y: number, time: number) => {
    const previous = points[points.length - 1];
    if (!previous || Math.hypot((x - previous.x) * planeWidth, (y - previous.y) * planeHeight) > 7) {
      points.push({ x, y, time });
      if (points.length > (trail > lifetime ? 128 : 64)) points.shift();
    } else previous.time = time;
    lastMove = time;
  };

  const drawRibbon = (time: number) => {
    if (!points.length) {
      clipPath.setAttribute("d", "M0 0Z");
      return;
    }
    const radius = Math.min(160, Math.max(70, surface.clientWidth * 0.105)) * strength;
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
      const remaining = Math.min(1, Math.max(0, (trail - (time - point.time)) / fade));
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

  const measure = () => {
    const bounds = plane.getBoundingClientRect();
    planeWidth = bounds.width || 1;
    planeHeight = bounds.height || 1;
    // Geometry runs in a square space so a curve bends the same way in both axes.
    aspect = planeHeight / planeWidth;
    const area = surface.getBoundingClientRect();
    // The gold artwork only covers part of the photo. Outside it the reveal has
    // nothing to show, so the drift stays where it is in view and has paint.
    const art = (reveal.firstElementChild ?? reveal).getBoundingClientRect();
    return {
      left: (Math.max(area.left, art.left, bounds.left) - bounds.left) / planeWidth,
      right: (Math.min(area.right, art.right, bounds.right) - bounds.left) / planeWidth,
      top: (Math.max(area.top, art.top, bounds.top) - bounds.top) / planeHeight * aspect,
      bottom: (Math.min(area.bottom, art.bottom, bounds.bottom) - bounds.top) / planeHeight * aspect,
    };
  };

  // Passes come from every direction and land anywhere the artwork has paint —
  // across the face, over the top of the head, corner to corner.
  const composeGesture = (time: number): Gesture => {
    const view = measure();
    const centre = { x: halo.x, y: halo.y * aspect };
    const phase = Math.random() * Math.PI * 2;
    const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

    // Half the passes aim near the head, half anywhere in frame. Together they
    // cover the whole portrait without leaving the interesting part to chance.
    const anchor = () => {
      if (Math.random() < 0.5) {
        const angle = Math.random() * Math.PI * 2;
        const reach = Math.sqrt(Math.random()) * halo.radius * 0.8;
        return {
          x: clamp(centre.x + Math.cos(angle) * reach, view.left, view.right),
          y: clamp(centre.y + Math.sin(angle) * reach, view.top, view.bottom),
        };
      }
      return {
        x: view.left + Math.random() * (view.right - view.left),
        y: view.top + Math.random() * (view.bottom - view.top),
      };
    };

    if (Math.random() < 0.38) {
      // A curl around the head. The radius runs from over the face to outside
      // the icon ring, so no two circle the same line.
      const radius = halo.radius * (0.34 + Math.random() * 0.95);
      const from = Math.random() * Math.PI * 2;
      const sweep = (1.2 + Math.random() * 1.8) * (Math.random() < 0.5 ? -1 : 1);
      return {
        began: time,
        duration: (Math.abs(sweep) / (0.5 + Math.random() * 0.45)) * 1000,
        at: (progress) => {
          const angle = from + sweep * progress;
          // A slow breath in and out keeps it off a perfect circle.
          const reach = radius * (1 + 0.09 * Math.sin(progress * Math.PI * 2.4 + phase));
          return { x: centre.x + Math.cos(angle) * reach, y: centre.y + Math.sin(angle) * reach };
        },
      };
    }

    // A pass clean across the frame, from any edge, at any angle.
    const span = Math.hypot(view.right - view.left, view.bottom - view.top) * 1.15;
    const angle = Math.random() * Math.PI * 2;
    const along = { x: Math.cos(angle), y: Math.sin(angle) };
    const across = { x: -along.y, y: along.x };
    const through = anchor();
    const bend = (0.04 + Math.random() * 0.16) * (Math.random() < 0.5 ? -1 : 1);
    const at = (distance: number, lateral: number) => ({
      x: through.x + along.x * distance + across.x * lateral,
      y: through.y + along.y * distance + across.y * lateral,
    });
    const knots = [at(-span / 2, 0), at(-span * 0.18, bend), at(span * 0.18, -bend * 0.55), at(span / 2, 0)];
    return {
      began: time,
      // Hold a steady speed so long and short crossings flow alike.
      duration: (span / (0.42 + Math.random() * 0.3)) * 1000,
      at: (progress) => {
        const inverse = 1 - progress;
        const weights = [
          inverse * inverse * inverse,
          3 * inverse * inverse * progress,
          3 * inverse * progress * progress,
          progress * progress * progress,
        ];
        return {
          x: knots.reduce((sum, knot, index) => sum + knot.x * weights[index], 0),
          y: knots.reduce((sum, knot, index) => sum + knot.y * weights[index], 0),
        };
      },
    };
  };

  const drift = (time: number) => {
    const idle = ambient.enabled && visible && !held && !document.hidden && time - lastTouch > ambient.resumeAfter;
    if (!idle) {
      ambient.gesture = null;
      ambient.nextAt = 0;
      return;
    }
    if (!ambient.gesture) {
      if (!ambient.nextAt) ambient.nextAt = time + (lastTouch ? 0 : ambient.firstDelay);
      if (time < ambient.nextAt) return;
      ambient.gesture = composeGesture(time);
      points = [];
      strength = ambient.width;
      trail = ambient.trail;
      fade = ambient.fade;
      setReveal(ambient.reveal);
    }
    const progress = (time - ambient.gesture.began) / ambient.gesture.duration;
    if (progress >= 1) {
      ambient.gesture = null;
      // A short breath between crossings, so the stream reads as separate passes.
      ambient.nextAt = time + 160 + Math.random() * 420;
      return;
    }
    // Ease at both ends. Both happen past the frame edge, so on screen it glides.
    const eased = progress * progress * (3 - 2 * progress);
    const at = ambient.gesture.at(eased);
    addPoint(at.x, at.y / aspect, time);
    const x = (at.x - face.x) * 0.9;
    const y = (at.y / aspect - face.y) * 0.9;
    // Only the contour layers follow the drift. The plane itself stays square to
    // the viewer, so the two portrait layers keep their landmark alignment.
    target.x = x * 72 * 0.6;
    target.y = y * 54 * 0.6;
  };

  const paint = (time: number) => {
    const delta = Math.min(3, (time - (lastTime || time - 16.67)) / 16.67);
    lastTime = time;
    drift(time);
    points = points.filter((point) => time - point.time < trail);
    drawRibbon(time);
    wave.x += (target.x - wave.x) * Math.min(1, 0.085 * delta);
    wave.y += (target.y - wave.y) * Math.min(1, 0.085 * delta);
    const energy = points.length ? Math.max(0, 1 - (time - lastMove) / trail) : 0;
    wave.energy += (energy - wave.energy) * Math.min(1, 0.11 * delta);
    plane.style.setProperty("--wave-x", `${wave.x.toFixed(2)}px`);
    plane.style.setProperty("--wave-y", `${wave.y.toFixed(2)}px`);
    plane.style.setProperty("--wave-energy", wave.energy.toFixed(3));

    if (!points.length && !held && revealed) setReveal(0);
    const settling = Math.abs(target.x - wave.x) + Math.abs(target.y - wave.y) > 0.1 || wave.energy > 0.005;
    const drifting = ambient.enabled && !document.hidden;
    if (visible && !held && (points.length || settling || drifting)) frameId = requestAnimationFrame(paint);
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
    // A real gesture takes the stream over from the drift at full strength.
    if (strength !== 1) {
      points = [];
      interrupt();
    }
    lastTouch = time;
    addPoint((event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height, time);

    const area = surface.getBoundingClientRect();
    const x = (event.clientX - area.left) / area.width - 0.5;
    const y = (event.clientY - area.top) / area.height - 0.5;
    target.x = x * 72;
    target.y = y * 54;
    if (mouse && event.pointerType !== "touch") {
      tiltX?.(-y * 3.5);
      tiltY?.(x * 4.5);
    }
    setReveal(1);
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
    interrupt();
    lastTouch = performance.now();
    cancelAnimationFrame(frameId);
    frameId = 0;
    clipPath.setAttribute("d", "M0 0Z");
    surface.setAttribute("aria-pressed", String(held));
    reveal.dataset.full = String(held);
    setReveal(held ? 1 : 0);
    if (!held) leave();
  };
  // A backgrounded tab should not keep asking for frames.
  const onPageVisibility = () => { if (!document.hidden) schedulePaint(); };

  surface.addEventListener("pointermove", move, { passive: true });
  surface.addEventListener("pointerleave", leave);
  surface.addEventListener("pointerdown", press, { passive: true });
  surface.addEventListener("pointerup", release);
  surface.addEventListener("pointercancel", leave);
  surface.addEventListener("click", toggle);
  document.addEventListener("visibilitychange", onPageVisibility);

  // Pinning the stage flips it to position: fixed, which can deliver a stale
  // "left the viewport" entry alongside the current one. Only the last is true.
  const observer = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    plane.dataset.waveActive = String(visible);
    if (visible) {
      schedulePaint();
      return;
    }
    cancelAnimationFrame(frameId);
    frameId = 0;
    points = [];
    interrupt();
    ambient.nextAt = 0;
    clipPath.setAttribute("d", "M0 0Z");
    if (!held) setReveal(0);
  });
  observer.observe(surface);
  schedulePaint();

  return () => {
    observer.disconnect();
    cancelAnimationFrame(frameId);
    surface.removeEventListener("pointermove", move);
    surface.removeEventListener("pointerleave", leave);
    surface.removeEventListener("pointerdown", press);
    surface.removeEventListener("pointerup", release);
    surface.removeEventListener("pointercancel", leave);
    surface.removeEventListener("click", toggle);
    document.removeEventListener("visibilitychange", onPageVisibility);
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

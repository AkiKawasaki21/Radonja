"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import styles from "./Loader.module.css";

const SESSION_KEY = "radonja:act1:seen";

export default function Loader() {
  const [visible, setVisible] = useState(true);
  const overlay = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const numeral = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(SESSION_KEY) === "1"; } catch { /* Storage can be disabled. */ }
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(false);
      return;
    }

    let disposed = false;
    let exiting = false;
    let completed = 0;
    const bandElement = band.current;
    const numeralElement = numeral.current;
    const progress = { value: 0 };
    const startedAt = performance.now();
    const listeners: (() => void)[] = [];
    let timeline: gsap.core.Timeline | undefined;
    let finishTimer: ReturnType<typeof setTimeout> | undefined;

    const hide = () => {
      if (disposed) return;
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* Loading still works without storage. */ }
      setVisible(false);
      ScrollTrigger.refresh();
    };
    const finish = (loaded: boolean) => {
      if (exiting || disposed) return;
      exiting = true;
      overlay.current?.setAttribute("data-preload", loaded ? "complete" : "deadline");
      if (!loaded) {
        // Reveal the already usable page without claiming unfinished assets loaded.
        timeline = gsap.timeline({ onComplete: hide }).to(overlay.current, { opacity: 0, duration: 0.15 });
        return;
      }
      timeline = gsap.timeline({ onComplete: hide });
      timeline.to(numeral.current, { opacity: 0, duration: 0.1 })
        .to(band.current, { height: "100%", duration: 0.2, ease: "power3.in" }, 0)
        .set(band.current, { backgroundColor: "#B3202A" }, 0.2)
        .to(band.current, { backgroundColor: "#C9A646", duration: 0.075 }, 0.2)
        .to(overlay.current, { opacity: 0, duration: 0.075 }, 0.275);
    };
    const advance = () => {
      if (disposed || exiting) return;
      completed += 1;
      const value = completed / 3;
      gsap.to(band.current, { width: `${value * 100}%`, duration: 0.16, ease: "power1.out", overwrite: true });
      gsap.to(progress, { value: value * 15, duration: 0.16, onUpdate: () => {
        if (numeral.current) numeral.current.textContent = String(Math.round(progress.value)).padStart(2, "0");
      } });
      overlay.current?.setAttribute("aria-valuenow", String(Math.round(value * 100)));
      if (completed === 3) finishTimer = setTimeout(() => finish(true), Math.max(170, 550 - (performance.now() - startedAt)));
    };
    for (const id of ["hero-stare", "hero-reveal"]) {
      const img = document.getElementById(id) as HTMLImageElement | null;
      if (!img) continue;
      const decoded = () => { void img.decode().then(advance).catch(() => { /* Failed images never count as loaded. */ }); };
      if (img.complete && img.naturalWidth > 0) decoded();
      else {
        img.addEventListener("load", decoded, { once: true });
        listeners.push(() => img.removeEventListener("load", decoded));
      }
    }
    void document.fonts.ready.then(advance);
    // Slow or failed assets must never trap the visitor. Do not fake 100% at the deadline.
    const deadline = setTimeout(() => finish(false), 1200);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      if (!motion.matches) return;
      exiting = true;
      clearTimeout(deadline);
      clearTimeout(finishTimer);
      timeline?.kill();
      gsap.killTweensOf([bandElement, numeralElement, progress]);
      hide();
    };
    motion.addEventListener("change", onMotionChange);
    return () => {
      disposed = true;
      clearTimeout(deadline);
      clearTimeout(finishTimer);
      listeners.forEach((remove) => remove());
      motion.removeEventListener("change", onMotionChange);
      timeline?.kill();
      gsap.killTweensOf([bandElement, numeralElement, progress]);
    };
  }, []);

  if (!visible) return null;
  return (
    <div ref={overlay} className={styles.loader} role="progressbar" aria-label="Loading portraits and fonts" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} data-testid="loader">
      <span className={styles.label}>MONTENEGRO → CALIFORNIA</span>
      <span ref={numeral} className={styles.numeral}>00</span>
      <div ref={band} className={styles.band} />
      <span className={styles.bottom}>RADONJA / Nº 15</span>
    </div>
  );
}

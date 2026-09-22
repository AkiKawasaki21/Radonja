"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false });
      const syncLock = () => {
        if (document.documentElement.dataset.scrollLocked === "true") lenis.stop();
        else lenis.start();
      };
      window.addEventListener("radonja:scroll-lock", syncLock);
      syncLock();
      const tick = (time: number) => lenis.raf(time * 1000);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      return () => {
        window.removeEventListener("radonja:scroll-lock", syncLock);
        gsap.ticker.remove(tick);
        lenis.off("scroll", ScrollTrigger.update);
        lenis.destroy();
      };
    });
    document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => media.revert();
  }, []);

  return children;
}

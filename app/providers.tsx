"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useMotionPreference } from "@/lib/motion-preference";

export default function Providers({ children }: { children: React.ReactNode }) {
  const { reduced } = useMotionPreference();
  useEffect(() => {
    // Ignore iOS browser-toolbar height changes; scene heights use stable svh units.
    ScrollTrigger.config({ ignoreMobileResize: true });
    let active = true;
    document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh(); });
    if (reduced) return () => { active = false; };
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
      active = false;
      window.removeEventListener("radonja:scroll-lock", syncLock);
      gsap.ticker.remove(tick);
      lenis.off("scroll", ScrollTrigger.update);
      lenis.destroy();
    };
  }, [reduced]);

  return children;
}

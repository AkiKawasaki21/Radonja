"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { createPortraitSweep } from "@/lib/portrait-sweep";
import { acquireScrollLock } from "@/lib/scroll-lock";
import { useMotionPreference } from "@/lib/motion-preference";
import { nextMatch } from "@/content/schedule";
import portraitPhoto from "@/public/portraits/radonja-main.png";
import hiddenPortrait from "@/public/portraits/hidden-portrait.png";
import Signature from "./Signature";
import PortraitWaves from "./PortraitWaves";
import styles from "./Hero.module.css";

export default function Hero() {
  const { reduced, setPreference } = useMotionPreference();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLButtonElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const atmosphereRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<SVGPathElement>(null);
  const lockControlRef = useRef<HTMLDivElement>(null);
  const releaseLockRef = useRef<(() => void) | null>(null);
  const [portraitLocked, setPortraitLocked] = useState(false);
  const unlockPortrait = useCallback(() => {
    releaseLockRef.current?.();
    releaseLockRef.current = null;
    setPortraitLocked(false);
  }, []);

  useEffect(() => {
    if (!portraitLocked) return;
    const release = acquireScrollLock();
    releaseLockRef.current = release;
    const mobile = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const onViewport = () => { if (!mobile.matches) unlockPortrait(); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") unlockPortrait(); };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) unlockPortrait();
    });
    observer.observe(surfaceRef.current!);
    mobile.addEventListener("change", onViewport);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pagehide", unlockPortrait);
    return () => {
      release();
      if (releaseLockRef.current === release) releaseLockRef.current = null;
      observer.disconnect();
      mobile.removeEventListener("change", onViewport);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pagehide", unlockPortrait);
    };
  }, [portraitLocked, unlockPortrait]);

  useEffect(() => {
    const section = sectionRef.current!;
    const stage = stageRef.current!;
    const frame = frameRef.current!;
    const plane = planeRef.current!;
    const surface = surfaceRef.current!;
    const reveal = revealRef.current!;
    const clipPath = sweepRef.current!;
    const signature = section.querySelector<HTMLElement>("[data-signature]")!;
    const stroke = signature.querySelector("path")!;
    const media = gsap.matchMedia();

    media.add({
      all: "(min-width: 0px)",
      small: "(max-width: 767px)",
      mouse: "(hover: hover) and (pointer: fine)",
    }, (context) => {
      const { small, mouse } = context.conditions!;
      const cleanupSweep = createPortraitSweep({
        plane, surface, reveal, clipPath, reduced, mouse,
      });

      if (!reduced) {
        gsap.set(signature, { autoAlpha: 0 });
        gsap.set(stroke, { drawSVG: "0%" });
        const timeline = gsap.timeline({
          scrollTrigger: {
            id: "portrait-story",
            trigger: section,
            start: "top top",
            end: () => `+=${section.offsetHeight - stage.offsetHeight}`,
            pin: stage,
            pinSpacing: false,
            scrub: 0.65,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        timeline.to(lockControlRef.current, { autoAlpha: 0, pointerEvents: "none", duration: 0.055 }, 0.01)
          .to(frame, { scale: small ? 0.59 : 0.43, duration: 0.67, ease: "power1.inOut" }, 0.05)
          .fromTo(atmosphereRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.1)
          .to(signature, { autoAlpha: 1, duration: 0.16 }, 0.22)
          .to(stroke, { drawSVG: "100%", duration: 0.54, ease: "none" }, 0.29)
          .to(frame, { filter: "brightness(0.68)", duration: 0.36 }, 0.3)
          .to({}, { duration: 0.17 });
      }

      return cleanupSweep;
    });
    return () => media.revert();
  }, [reduced]);

  return (
    <section ref={sectionRef} id="hero" className={styles.story} aria-labelledby="hero-title">
      <span id="signature" className={styles.signatureAnchor} aria-hidden="true" />
      <div ref={stageRef} className={styles.stage} data-testid="portrait-stage">
        <div ref={atmosphereRef} className={styles.atmosphere} aria-hidden="true">
          <span>THE MINUTES</span><em>NOBODY SEES.</em>
          <svg viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice">
            <path d="M-300 800C500 1000 700-400 1500 160S1700 1200 500 1000-400 200 20 0M-120 900C550 980 900-320 1440 210S1500 1050 470 900-230 150 120-100M-50 980C710 850 1000-150 1500 380S1240 1000 480 770-110 200 300-120" />
          </svg>
        </div>

        <div ref={frameRef} className={styles.frame} data-testid="hero-frame">
          <button id="portrait-explorer" ref={surfaceRef} className={styles.portraitSurface} type="button" aria-label="Reveal the hidden gold portrait" aria-pressed="false" aria-describedby="portrait-instructions" data-portrait-locked={portraitLocked} data-lenis-prevent={portraitLocked ? "" : undefined}>
            <div ref={planeRef} className={styles.plane} data-testid="portrait-plane">
              <svg className={styles.filterDefinitions} aria-hidden="true">
                <defs>
                  <clipPath id="portrait-sweep" clipPathUnits="objectBoundingBox">
                    <path ref={sweepRef} d="M0 0Z" />
                  </clipPath>
                </defs>
              </svg>
              <Image id="hero-stare" src={portraitPhoto} alt="Andrija Radonjic looking toward the sky before the match" fill priority unoptimized sizes="(max-width: 767px) 116svh, 112vw" placeholder="blur" className={styles.basePhoto} />
              <PortraitWaves clipId="portrait-sweep" />
              <div ref={revealRef} className={styles.reveal} data-testid="portrait-reveal" aria-hidden="true">
                <div className={styles.artBounds}>
                  <Image id="hero-reveal" src={hiddenPortrait} alt="" fill loading="eager" fetchPriority="low" unoptimized sizes="(max-width: 767px) 70svh, 68vw" placeholder="blur" className={styles.hiddenPhoto} />
                </div>
              </div>
            </div>
          </button>
          <div className={styles.shade} aria-hidden="true" />
          <header className={styles.masthead}>
            <a href="#hero" aria-label="Andrija Radonjic, back to the top" className={styles.monogram} onClick={unlockPortrait}>15<span /></a>
            <span className={styles.location}>MONTENEGRO <i>→</i> CALIFORNIA</span>
          </header>
          <div ref={lockControlRef} className={styles.exploreControl}>
            <button
              type="button"
              className={styles.exploreLock}
              aria-pressed={portraitLocked}
              aria-controls="portrait-explorer"
              aria-describedby="portrait-lock-status"
              onClick={() => portraitLocked ? unlockPortrait() : setPortraitLocked(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="5" y="10" width="14" height="11" rx="2" />
                <path d={portraitLocked ? "M8 10V6a4 4 0 0 1 8 0v4" : "M8 10V6a4 4 0 0 1 7.7-1.5"} />
                <path d="M12 14v3" />
              </svg>
              <span>{portraitLocked ? "Unlock scroll" : "Explore portrait"}</span>
            </button>
            <span id="portrait-lock-status" className={styles.lockStatus} role="status">
              {portraitLocked ? "Swipe freely. Tap to unlock." : "Lock scrolling to swipe"}
            </span>
          </div>
          <div className={styles.titleBlock}>
            <p className={styles.eyebrow}>Nº 15 · STRIKER · MONTENEGRO</p>
            <h1 id="hero-title" aria-label="Andrija Radonjic"><span className={styles.firstName}>ANDRIJA</span>RADONJIC</h1>
            <span className={styles.tape} aria-hidden="true" />
          </div>
          <p id="portrait-instructions" className={styles.portraitHint}>
            <span className={styles.mouseHint}>SWIPE ACROSS THE PORTRAIT</span>
            <span className={styles.touchHint}>{portraitLocked ? "SWIPE TO REVEAL" : "TOUCH TO REVEAL"}</span>
          </p>
          <div className={styles.bottom}>
            <a className={styles.nextMatch} href={nextMatch.sourceUrl} target="_blank" rel="noreferrer">
              <span>NEXT MATCH <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" /></svg></span>
              <span>{nextMatch.opponent} <i>·</i> <time dateTime={nextMatch.dateTime}>{nextMatch.date}</time></span>
            </a>
            <a className={styles.scrollCue} href={reduced ? "#gallery" : "#signature"} aria-label="Scroll into the story" onClick={unlockPortrait}><span>SCROLL INTO THE STORY</span><i /></a>
          </div>
        </div>
        <Signature />
        <div className={styles.motionNotice} hidden={!reduced}>
          <span>Reduced motion is on</span>
          <button type="button" onClick={() => { unlockPortrait(); setPreference("full"); }}>Enable full experience</button>
        </div>
      </div>
    </section>
  );
}

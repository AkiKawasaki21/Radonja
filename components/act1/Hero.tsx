"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { nextMatch } from "@/content/schedule";
import stare from "@/public/photos/hero-stare.jpg";
import flag from "@/public/photos/hero-flag.jpg";
import styles from "./Hero.module.css";

export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const portrait = useRef<HTMLButtonElement>(null);
  const reveal = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cursorElement = cursor.current;
    const media = gsap.matchMedia();
    media.add({
      desktop: "(min-width: 768px) and (hover: hover) and (pointer: fine)",
      mobile: "(max-width: 767px), (pointer: coarse)",
      reduced: "(prefers-reduced-motion: reduce)",
    }, (context) => {
      const { desktop, mobile, reduced } = context.conditions!;
      const target = portrait.current!;
      const layer = reveal.current!;
      let pressed = false;
      const crossfade = (visible: boolean) => {
        gsap.to(layer, { opacity: visible ? 1 : 0, scale: visible && !reduced ? 1.04 : 1, duration: reduced ? 0 : 0.65, ease: "power2.out", overwrite: mobile && !reduced ? false : "auto" });
      };
      const enter = () => {
        crossfade(true);
        if (desktop) gsap.set(cursorElement, { autoAlpha: 1 });
      };
      const leave = () => {
        if (!pressed) crossfade(false);
        gsap.set(cursorElement, { autoAlpha: 0 });
      };
      const move = (event: PointerEvent) => {
        const bounds = target.getBoundingClientRect();
        gsap.set(cursorElement, { x: event.clientX - bounds.left, y: event.clientY - bounds.top });
      };
      const toggle = () => {
        pressed = !pressed;
        target.setAttribute("aria-pressed", String(pressed));
        crossfade(pressed);
      };
      if (desktop) {
        target.addEventListener("pointerenter", enter);
        target.addEventListener("pointerleave", leave);
        target.addEventListener("pointermove", move);
      }
      target.addEventListener("click", toggle);
      if (mobile && !reduced) {
        gsap.fromTo(layer, { opacity: 0, scale: 1 }, {
          opacity: 1, scale: 1.04, ease: "none",
          scrollTrigger: { trigger: section.current, start: "top top", end: "65% top", scrub: true },
        });
      }
      return () => {
        target.removeEventListener("pointerenter", enter);
        target.removeEventListener("pointerleave", leave);
        target.removeEventListener("pointermove", move);
        target.removeEventListener("click", toggle);
        target.setAttribute("aria-pressed", "false");
        gsap.killTweensOf([layer, cursorElement]);
        gsap.set(layer, { clearProps: "opacity,transform" });
        gsap.set(cursorElement, { clearProps: "visibility,opacity,transform" });
      };
    }, section);
    return () => media.revert();
  }, []);

  return (
    <section ref={section} className={styles.hero} aria-labelledby="hero-title" id="hero">
      <button ref={portrait} className={styles.portrait} type="button" aria-label="Reveal Radonja with the Montenegro flag" aria-pressed="false">
        <Image id="hero-stare" src={stare} alt="Radonja looking up under stadium lights, photographed in black and white" fill priority quality={65} sizes="(max-width: 767px) 100vw, 58vw" placeholder="blur" className={styles.stare} />
        <div ref={reveal} className={styles.reveal}>
          <Image id="hero-flag" src={flag} alt="Radonja wearing the red and gold flag of Montenegro" fill priority quality={65} sizes="(max-width: 767px) 100vw, 58vw" placeholder="blur" className={styles.flag} />
        </div>
        <span className={styles.imageShade} />
        <span ref={cursor} className={styles.cursor} aria-hidden="true"><i />MNE</span>
      </button>

      <div className={styles.masthead} aria-hidden="true">
        <span className={styles.number}>15<span className={styles.numberBand} /></span>
        <span className={styles.location}>MONTENEGRO <span>→</span> CALIFORNIA</span>
      </div>

      <div className={styles.titleBlock}>
        <p className={styles.eyebrow}>Nº 15 · STRIKER · MONTENEGRO</p>
        <h1 id="hero-title">RADONJA</h1>
        <span className={styles.tape} aria-hidden="true" />
      </div>

      <div className={styles.bottom}>
        <a className={styles.nextMatch} href={nextMatch.sourceUrl} target="_blank" rel="noreferrer">
          <span>NEXT MATCH <span aria-hidden="true">↗</span></span>
          <span className={styles.fixture}><span aria-hidden="true">— </span>{nextMatch.opponent} <span>·</span> <time dateTime={nextMatch.dateTime}>{nextMatch.date}</time></span>
        </a>
        <a href="#signature" className={styles.scrollCue} aria-label="Scroll to signature">
          <span>SCROLL TO DISCOVER</span>
          <i aria-hidden="true" />
        </a>
      </div>
      <span className={styles.portraitHint} aria-hidden="true">HOLDING HOME CLOSE. <span>↗</span></span>
    </section>
  );
}

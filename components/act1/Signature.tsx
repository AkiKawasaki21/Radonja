"use client";

import { useLayoutEffect, useRef } from "react";
import { signaturePath } from "@/content/signature";
import { gsap } from "@/lib/gsap";
import styles from "./Signature.module.css";

export default function Signature() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        pathRef.current,
        { drawSVG: "0%" },
        {
          drawSVG: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top center",
            end: "bottom 80%",
            scrub: true,
          },
        },
      );
    });

    return () => media.revert();
  }, []);

  return (
    <section
      id="signature"
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="signature-title"
    >
      <div className={styles.topline}>
        <h2 id="signature-title" className={styles.label}>
          <span>01</span> THE MARK
        </h2>
        <span className={styles.index}>RADONJA / Nº 15</span>
      </div>

      <div className={styles.canvas}>
        <span className={styles.watermark} aria-hidden="true">
          15
        </span>
        <svg
          className={styles.signature}
          viewBox="0 0 960 360"
          fill="none"
          role="img"
          aria-label="Radonja's signature, placeholder mark"
        >
          <path
            ref={pathRef}
            d={signaturePath}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className={styles.bottomline} aria-hidden="true">
        <span className={styles.band} />
        <span>MONTENEGRO → CALIFORNIA</span>
      </div>
    </section>
  );
}

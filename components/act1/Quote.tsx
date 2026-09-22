"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { quote } from "@/content/quote";
import { gsap, SplitText } from "@/lib/gsap";
import { useMotionPreference } from "@/lib/motion-preference";
import backPhoto from "@/public/photos/back-15.jpg";
import styles from "./Quote.module.css";

export default function Quote() {
  const { reduced } = useMotionPreference();
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLQuoteElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const [beforeKeyword, afterKeyword] = quote.text.split(quote.keyword);

  useLayoutEffect(() => {
    if (reduced) return;

    const context = gsap.context(() => {
      const split = SplitText.create(textRef.current!, {
        type: "lines",
        mask: "lines",
        linesClass: "quote-line",
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 110,
            opacity: 0,
            duration: 1.05,
            ease: "power3.out",
            stagger: 0.06,
            scrollTrigger: {
              trigger: textRef.current,
              start: "top 82%",
              once: true,
            },
          });
        },
      });

      gsap.fromTo(
        photoRef.current,
        { yPercent: -4 },
        {
          yPercent: 4,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );

      return () => split.revert();
    }, sectionRef);

    return () => context.revert();
  }, [reduced]);

  return (
    <section
      id="quote"
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="quote-title"
    >
      <div ref={photoRef} className={styles.background} aria-hidden="true">
        <Image
          src={backPhoto}
          alt=""
          fill
          sizes="100vw"
          placeholder="blur"
          quality={75}
          className={styles.photo}
        />
      </div>

      <div className={styles.content}>
        <h2 id="quote-title" className={styles.label}>
          <span>03</span> THE MINDSET
        </h2>
        <span className={styles.quotationMark} aria-hidden="true">
          “
        </span>
        <blockquote ref={textRef} className={styles.quote}>
          {beforeKeyword}
          <span className={styles.keyword}>{quote.keyword}</span>
          {afterKeyword}
        </blockquote>
        <div className={styles.attribution}>
          <span className={styles.band} aria-hidden="true" />
          ANDRIJA RADONJIC / Nº15
        </div>
      </div>
    </section>
  );
}

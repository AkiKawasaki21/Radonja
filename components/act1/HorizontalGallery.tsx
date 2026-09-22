'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gallery, type GalleryPhoto } from '@/content/gallery';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import styles from './HorizontalGallery.module.css';

function PhotoImage({ photo }: { photo: GalleryPhoto }) {
  return (
    <Image
      src={photo.src}
      alt={photo.caption}
      fill
      placeholder="blur"
      quality={75}
      sizes={photo.index === 1 ? '(max-width: 767px) 85vw, 48vw' : '(max-width: 767px) 78vw, 34vw'}
      className={`${styles.image} ${photo.index === 10 ? styles.flagImage : ''}`}
      draggable={false}
    />
  );
}

export default function HorizontalGallery() {
  const [loadImages, setLoadImages] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    // Native lazy loading starts too far ahead on mobile and competes with the hero.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setLoadImages(true);
        observer.disconnect();
      }
    }, { rootMargin: '100% 0px' });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const inner = innerRef.current;
    const track = trackRef.current;
    const scroller = scrollerRef.current;
    if (!section || !inner || !track || !scroller) return;

    const media = gsap.matchMedia();
    media.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: inner,
          start: 'top top',
          end: () => `+=${section.offsetHeight - inner.offsetHeight}`,
          pin: true,
          pinSpacing: false,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      timeline.to(track, {
        x: () => -Math.max(0, track.scrollWidth - window.innerWidth),
        ease: 'none',
      }, 0);
      timeline.to(progressRef.current, { scaleX: 1, ease: 'none' }, 0);

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const trigger = timeline.scrollTrigger;
        const distance = Math.max(0, track.scrollWidth - window.innerWidth);
        if (!trigger || !distance) return;
        event.preventDefault();

        const cards = Array.from(track.children) as HTMLElement[];
        const firstOffset = cards[0]?.offsetLeft ?? 0;
        const positions = cards.map((card) => Math.min(distance, card.offsetLeft - firstOffset));
        const currentOffset = trigger.progress * distance;
        let targetOffset = 0;
        if (event.key === 'End') targetOffset = distance;
        if (event.key === 'ArrowRight') {
          targetOffset = positions.find((position) => position > currentOffset + 4) ?? distance;
        }
        if (event.key === 'ArrowLeft') {
          targetOffset = positions.reverse().find((position) => position < currentOffset - 4) ?? 0;
        }
        const targetScroll = trigger.start + (targetOffset / distance) * (trigger.end - trigger.start);
        trigger.scroll(targetScroll);
      };
      scroller.addEventListener('keydown', onKeyDown);
      return () => scroller.removeEventListener('keydown', onKeyDown);
    });
    media.add('(max-width: 767px), (prefers-reduced-motion: reduce)', () => {
      scroller.setAttribute('data-lenis-prevent', '');
      return () => scroller.removeAttribute('data-lenis-prevent');
    });

    // Font metrics affect both the track width and its position after the quote.
    let active = true;
    document.fonts.ready.then(() => {
      if (active) ScrollTrigger.refresh();
    });

    return () => {
      active = false;
      media.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} id="gallery" className={styles.section} aria-labelledby="gallery-title">
      <noscript>
        <style>{`.${styles.section}{height:auto}.${styles.inner}{height:auto}.${styles.scroller}{overflow-x:auto}.${styles.track}{height:min(68svh,620px)}`}</style>
      </noscript>
      <div ref={innerRef} className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.headingGroup}>
            <p className={styles.eyebrow}>03 / THE ARCHIVE</p>
            <h2 id="gallery-title" className={styles.title}>THE GAME, IN FRAMES<span>.</span></h2>
          </div>
          <div className={styles.guide} aria-hidden="true">
            <span className={styles.desktopHint}>SCROLL TO EXPLORE</span>
            <span className={styles.mobileHint}>SWIPE TO EXPLORE</span>
            <span className={styles.arrow}>↗</span>
          </div>
        </header>

        <p id="gallery-instructions" className={styles.screenReaderOnly}>Use the left and right arrow keys, or scroll, to explore the gallery.</p>
        <div ref={scrollerRef} className={styles.scroller} role="region" tabIndex={0} aria-label="Photographs and quotes from the pitch" aria-describedby="gallery-instructions">
          <div ref={trackRef} className={styles.track}>
            {gallery.map((item) => item.kind === 'photo' ? (
              <figure className={`${styles.photoCard} ${item.index === 1 ? styles.wideCard : ''}`} key={item.src.src}>
                <div className={styles.imageFrame} style={loadImages ? undefined : { backgroundImage: `url(${item.src.blurDataURL})` }}>
                  {loadImages && <PhotoImage photo={item} />}
                  <noscript><PhotoImage photo={item} /></noscript>
                  <span className={styles.photoNumber} aria-hidden="true">{String(item.index).padStart(2, '0')}</span>
                </div>
                <figcaption className={styles.caption}>
                  <p className={styles.photoEyebrow}>{item.eyebrow}</p>
                  <h3>{item.caption}</h3>
                </figcaption>
              </figure>
            ) : (
              <figure className={styles.callout} key={item.eyebrow}>
                <span className={styles.calloutTape} aria-hidden="true" />
                <blockquote>{item.caption}</blockquote>
                <figcaption>{item.eyebrow}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        <footer className={styles.footer}>
          <span>EVERY FRAME. EVERY MINUTE.</span>
          <span className={styles.progress} aria-hidden="true"><span ref={progressRef} className={styles.progressFill} /></span>
          <span>10 FRAMES / Nº 15</span>
        </footer>
      </div>
    </section>
  );
}

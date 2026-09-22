'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { gallery, type GalleryPhoto } from '@/content/gallery';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import styles from './HorizontalGallery.module.css';

const entranceDuration = 0.1;

function PhotoImage({ photo }: { photo: GalleryPhoto }) {
  return (
    <Image
      src={photo.src}
      alt={photo.caption}
      fill
      placeholder="blur"
      quality={75}
      sizes={photo.index === 1 || photo.index === 3 || photo.index === 8 ? '(max-width: 767px) 82vw, 40vw' : '(max-width: 767px) 76vw, 30vw'}
      className={styles.image}
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
  const landscapeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    // Keep the entire archive out of the hero's image-loading budget.
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
    media.add({
      desktop: '(min-width: 768px)',
      mobile: '(max-width: 767px)',
      reduced: '(prefers-reduced-motion: reduce)',
    }, (context) => {
      const distance = () => Math.max(0, track.scrollWidth - scroller.clientWidth);
      const cardPositions = () => Array.from(track.children).map((child) => {
        const card = child as HTMLElement;
        return Math.max(0, Math.min(distance(), card.offsetLeft - (scroller.clientWidth - card.offsetWidth) / 2));
      });

      const destination = (key: string, current: number) => {
        const positions = cardPositions();
        if (key === 'End') return distance();
        if (key === 'Home') return 0;
        if (key === 'ArrowRight') return positions.find((position) => position > current + 8) ?? distance();
        return positions.reverse().find((position) => position < current - 8) ?? 0;
      };

      if (context.conditions?.reduced) {
        scroller.setAttribute('data-lenis-prevent', '');
        const updateProgress = () => {
          if (progressRef.current) progressRef.current.style.transform = `scaleX(${distance() ? scroller.scrollLeft / distance() : 1})`;
        };
        const onKeyDown = (event: KeyboardEvent) => {
          if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          scroller.scrollTo({ left: destination(event.key, scroller.scrollLeft), behavior: 'instant' });
        };
        scroller.addEventListener('scroll', updateProgress, { passive: true });
        scroller.addEventListener('keydown', onKeyDown);
        updateProgress();
        return () => {
          scroller.removeAttribute('data-lenis-prevent');
          scroller.removeEventListener('scroll', updateProgress);
          scroller.removeEventListener('keydown', onKeyDown);
          if (progressRef.current) progressRef.current.style.removeProperty('transform');
          scroller.scrollLeft = 0;
        };
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          id: 'photo-landscape',
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

      // The first photograph rises from the lower-right into an open panorama.
      timeline.fromTo(track,
        { y: () => inner.offsetHeight * 0.16 },
        { y: 0, duration: entranceDuration, ease: 'power1.out' },
        0,
      );
      // The incoming photographs share the screen with the departing signature.
      // Only establish the archive's opaque canvas once its own pin takes over.
      timeline.fromTo(inner,
        { '--gallery-backdrop': 0 },
        { '--gallery-backdrop': 1, duration: 0.12, ease: 'none' },
        0,
      );
      timeline.fromTo(inner.querySelectorAll('header, footer'),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.065, ease: 'none' },
        0.02,
      );
      // Let the signature caption pass before introducing the first frame's label.
      timeline.fromTo(track.querySelector('[data-frame="1"] > p'),
        { autoAlpha: 0 },
        { autoAlpha: 0.65, duration: 0.035, ease: 'none' },
        0.045,
      );
      timeline.fromTo(landscapeRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.12, ease: 'none' },
        0,
      );
      timeline.to(track, {
        x: () => -distance(),
        duration: 1 - entranceDuration,
        ease: 'none',
      }, entranceDuration);
      timeline.to(landscapeRef.current, { xPercent: -12, duration: 1, ease: 'none' }, 0);
      timeline.to(progressRef.current, { scaleX: 1, duration: 1, ease: 'none' }, 0);

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const trigger = timeline.scrollTrigger;
        if (!trigger || !distance()) return;
        event.preventDefault();
        const panProgress = Math.max(0, (trigger.progress - entranceDuration) / (1 - entranceDuration));
        const target = destination(event.key, panProgress * distance());
        const targetProgress = event.key === 'Home' ? 0 : entranceDuration + (target / distance()) * (1 - entranceDuration);
        trigger.scroll(trigger.start + targetProgress * (trigger.end - trigger.start));
      };
      scroller.addEventListener('keydown', onKeyDown);
      return () => scroller.removeEventListener('keydown', onKeyDown);
    });

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
        <style>{`.${styles.section}{height:auto;margin-top:0;background:var(--color-carbon)}.${styles.inner}{height:auto;min-height:100svh;--gallery-backdrop:1}.${styles.scroller}{overflow-x:auto}.${styles.track}{height:74svh;padding-left:5vw}.${styles.photoCard}{margin-top:0}.${styles.landscape}{display:none}`}</style>
      </noscript>
      <div ref={innerRef} className={styles.inner}>
        <div ref={landscapeRef} className={styles.landscape} aria-hidden="true">
          <span className={styles.outlineNumber}>15</span>
          <svg className={styles.contours} viewBox="0 0 1800 1000" fill="none" preserveAspectRatio="xMidYMid slice">
            <path d="M-240 810C160 520 250 1040 630 715S1050-135 1490 160s615 65 740-130M-220 885C235 540 250 1110 680 795S1085-35 1450 235s610 90 825-90M-160 960C250 635 405 1120 710 895s480-880 855-585 650 125 730-70M-90 230C275-125 670 520 1040 265S1600 375 1830 650M-100 150C280-160 635 390 1070 160S1610 290 1930 595" />
          </svg>
        </div>

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>03 / THE ARCHIVE</p>
            <h2 id="gallery-title" className={styles.title}>THE GAME, IN FRAMES<span>.</span></h2>
          </div>
          <p className={styles.guide} aria-hidden="true">
            <span className={styles.scrollHint}>SCROLL DOWN. LOOK AROUND.</span>
            <span className={styles.swipeHint}>SWIPE TO EXPLORE</span>
            <span className={styles.arrow}>↘</span>
          </p>
        </header>

        <p id="gallery-instructions" className={styles.screenReaderOnly}>Scroll down to move through the photographs. You can also focus this gallery and use the left and right arrow keys, Home, or End. With reduced motion, swipe or scroll horizontally.</p>
        <div ref={scrollerRef} className={styles.scroller} role="region" tabIndex={0} aria-label="Photographs and quotes from the pitch" aria-describedby="gallery-instructions">
          <div ref={trackRef} className={styles.track}>
            {gallery.map((item) => item.kind === 'photo' ? (
              <figure
                className={styles.photoCard}
                data-frame={item.index}
                key={item.src.src}
                style={{ '--image-ratio': item.src.width / item.src.height } as CSSProperties}
              >
                <p className={styles.photoEyebrow}><span>{String(item.index).padStart(2, '0')}</span> {item.eyebrow}</p>
                <div className={styles.imageFrame} style={loadImages ? undefined : { backgroundImage: `url(${item.src.blurDataURL})` }}>
                  {loadImages && <PhotoImage photo={item} />}
                  <noscript><PhotoImage photo={item} /></noscript>
                </div>
                <figcaption className={styles.caption}>{item.caption}</figcaption>
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

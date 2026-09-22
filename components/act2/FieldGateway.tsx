"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import actionPhoto from "@/public/photos/gallery-06-volley-skyblue.jpg";
import portraitPhoto from "@/public/photos/hero-flag.jpg";
import storyPhoto from "@/public/photos/spare-dusk-walk.jpg";
import { filmRoomSlots } from "@/content/clips";
import { profile } from "@/content/profile";
import { acquireScrollLock } from "@/lib/scroll-lock";
import styles from "./FieldGateway.module.css";

type FieldView = "on-field" | "off-field";

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 19 19 5M5 5h14v14" />
    </svg>
  );
}

export default function FieldGateway() {
  const [activeView, setActiveView] = useState<FieldView | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const selected = filmRoomSlots[selectedIndex];

  useEffect(() => {
    if (!activeView) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const releaseScrollLock = acquireScrollLock();
    if (!dialog.open) dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      releaseScrollLock();
      if (dialog.open) dialog.close();
    };
  }, [activeView]);

  const openView = (view: FieldView, event: MouseEvent<HTMLButtonElement>) => {
    openerRef.current = event.currentTarget;
    setActiveView(view);
  };

  const closeView = () => dialogRef.current?.close();

  const handleClose = () => {
    setActiveView(null);
    openerRef.current?.focus({ preventScroll: true });
  };

  const handleBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeView();
  };

  const changeFrame = (step: number) => {
    setSelectedIndex((current) => (current + step + filmRoomSlots.length) % filmRoomSlots.length);
  };

  return (
    <section id="beyond-the-frame" className={styles.section} aria-labelledby="field-gateway-title">
      <h2 id="field-gateway-title" className={styles.screenReaderOnly}>On the field. Off the field.</h2>
      <div className={styles.sectionLabel}><span>04 / TWO SIDES</span><span>Nº 15 · ANDRIJA RADONJIC</span></div>

      <div className={styles.panels}>
        <button className={`${styles.panel} ${styles.onField}`} type="button" onClick={(event) => openView("on-field", event)} aria-label="Open the on-field film room" aria-haspopup="dialog">
          <Image src={actionPhoto} alt="" fill placeholder="blur" sizes="50vw" quality={75} className={styles.panelPhoto} />
          <span className={styles.panelShade} aria-hidden="true" />
          <span className={styles.panelNumber} aria-hidden="true">01</span>
          <span className={styles.panelCopy}>
            <span className={styles.panelEyebrow}>THE GAME, FRAME BY FRAME</span>
            <span className={styles.panelTitle}>ON THE<br />FIELD<span>.</span></span>
            <span className={styles.panelLink}>ENTER THE FILM ROOM <ArrowUpRight /></span>
          </span>
        </button>

        <button className={`${styles.panel} ${styles.offField}`} type="button" onClick={(event) => openView("off-field", event)} aria-label="Read Andrija Radonjic’s off-field story" aria-haspopup="dialog">
          <Image src={portraitPhoto} alt="" fill placeholder="blur" sizes="50vw" quality={75} className={styles.panelPhoto} />
          <span className={styles.panelShade} aria-hidden="true" />
          <span className={styles.panelNumber} aria-hidden="true">02</span>
          <span className={styles.panelCopy}>
            <span className={styles.panelEyebrow}>THE PERSON BEHIND THE NUMBER</span>
            <span className={styles.panelTitle}>OFF THE<br />FIELD<span>.</span></span>
            <span className={styles.panelLink}>READ HIS STORY <ArrowUpRight /></span>
          </span>
        </button>
      </div>

      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="field-dialog-title" onClose={handleClose} onClick={handleBackdrop}>
        <div className={styles.dialogShell}>
          <header className={styles.dialogHeader}>
            <div>
              <p className={styles.dialogEyebrow}>{activeView === "on-field" ? "ON THE FIELD / Nº 15" : "OFF THE FIELD / Nº 15"}</p>
              <h2 id="field-dialog-title">{activeView === "on-field" ? "THE FILM ROOM" : "HIS STORY"}</h2>
            </div>
            <button ref={closeRef} type="button" className={styles.closeButton} onClick={closeView} aria-label="Close dialog"><span aria-hidden="true">×</span></button>
          </header>

          <div className={styles.dialogScroll} data-scroll-lock-allow data-lenis-prevent>
            {activeView === "on-field" && (
              <div className={styles.filmRoom}>
                <div className={styles.viewer}>
                  <div className={styles.previewMeta}><span>PHOTO PREVIEW</span><span>VIDEO COMING SOON</span></div>
                  <div className={styles.previewFrame}>
                    <Image key={selected.id} src={selected.photo} alt={selected.alt} fill placeholder="blur" sizes="(max-width: 767px) 90vw, 60vw" className={styles.previewImage} />
                  </div>
                  <div className={styles.viewerFooter}>
                    <div aria-live="polite" aria-atomic="true">
                      <p className={styles.frameIndex}>{String(selectedIndex + 1).padStart(2, "0")} / 06</p>
                      <h3>{selected.title}</h3>
                    </div>
                    <div className={styles.frameControls}>
                      <button type="button" onClick={() => changeFrame(-1)} aria-label="Previous clip slot"><span aria-hidden="true">←</span></button>
                      <button type="button" onClick={() => changeFrame(1)} aria-label="Next clip slot"><span aria-hidden="true">→</span></button>
                    </div>
                  </div>
                </div>

                <div className={styles.clipIndex}>
                  <p className={styles.indexEyebrow}>FOR COACHES &amp; SCOUTS</p>
                  <p className={styles.filmNotice}>Match footage is coming soon. Explore the six planned clip categories below.</p>
                  <ol className={styles.clipList} aria-label="Film room clip categories">
                    {filmRoomSlots.map((clip, index) => (
                      <li key={clip.id}>
                        <button type="button" className={styles.clipButton} aria-pressed={selectedIndex === index} aria-label={`Select ${clip.title}, video coming soon`} onClick={() => setSelectedIndex(index)}>
                          <span className={styles.clipNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                          <span className={styles.clipText}><span>{clip.title}</span><small>{clip.status}</small></span>
                          <ArrowUpRight className={styles.clipMark} />
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {activeView === "off-field" && (
              <article className={styles.story}>
                <div className={styles.storyPortrait}>
                  <Image src={storyPhoto} alt="Andrija Radonjic walking across the pitch at dusk" fill placeholder="blur" sizes="(max-width: 767px) 90vw, 38vw" className={styles.storyImage} />
                  <p>{profile.origin} <span aria-hidden="true">→</span> {profile.destination}</p>
                </div>
                <div className={styles.storyCopy}>
                  <p className={styles.storyIntroduction}>{profile.introduction}</p>
                  {profile.chapters.map((chapter) => (
                    <section className={styles.chapter} key={chapter.number} aria-labelledby={`story-chapter-${chapter.number}`}>
                      <h3 id={`story-chapter-${chapter.number}`}><span>{chapter.number}</span>{chapter.title}</h3>
                      <p>{chapter.text}</p>
                    </section>
                  ))}
                  <span className={styles.storyTape} aria-hidden="true" />
                </div>
              </article>
            )}
          </div>
        </div>
      </dialog>
    </section>
  );
}

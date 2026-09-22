"use client";

import { useMotionPreference } from "@/lib/motion-preference";
import styles from "./MotionControl.module.css";

export default function MotionControl() {
  const { reduced, preference, setPreference } = useMotionPreference();

  return (
    <aside className={styles.control} aria-label="Animation preference">
      <span className={styles.message}>{reduced ? "Reduced motion is on" : "Full scroll experience"}</span>
      <button type="button" onClick={() => setPreference(reduced ? "full" : "reduced")}>
        {reduced ? "Enable full experience" : "Reduce motion"}
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" /></svg>
      </button>
      {preference !== "system" && <button type="button" className={styles.reset} onClick={() => setPreference("system")}>Use device setting</button>}
    </aside>
  );
}

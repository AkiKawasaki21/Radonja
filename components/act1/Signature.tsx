"use client";

import { signaturePath } from "@/content/signature";
import styles from "./Signature.module.css";

/** The parent portrait scene draws this stroke while the original frame scales back. */
export default function Signature() {
  return (
    <div id="signature-art" className={styles.signature} data-signature aria-labelledby="signature-title">
      <h2 id="signature-title" className={styles.label}>01 / THE MARK</h2>
      <svg viewBox="0 0 960 360" fill="none" role="img" aria-label="Radonja’s signature, placeholder mark">
        <path d={signaturePath} stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className={styles.caption}>MONTENEGRO → CALIFORNIA</p>
    </div>
  );
}

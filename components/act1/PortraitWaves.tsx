"use client";

import styles from "./PortraitWaves.module.css";

// The same contours run beneath both layers, so the swipe reveals their brighter edge.
const contours = [
  "M-160 145C90 315 205-20 445 105S610 365 930 185 1130 170 1130 170",
  "M-155 191C95 355 214 25 454 150S629 410 953 229 1150 215 1150 215",
  "M-140 242C119 400 244 70 485 201S655 451 980 276 1170 261 1170 261",
  "M-195 648C35 330 105 738 296 594S599 242 748 466 971 555 1065 344",
  "M-178 705C60 382 127 795 320 644S614 300 770 520 1008 597 1107 393",
  "M-147 767C87 437 160 844 352 699S653 364 808 576 1040 655 1130 457",
  "M-114 825C130 496 196 908 391 754S689 428 845 634 1076 716 1168 513",
  "M-137 1128C137 921 119 770 343 859S560 1145 754 926 882 1041 1066 939",
  "M-134 1190C165 976 147 826 370 916S589 1198 788 984 911 1099 1104 992",
  "M-122 1254C190 1034 181 886 404 977S625 1258 824 1045 956 1152 1143 1057",
];

function Contours() {
  return (
    <svg
      className={styles.contours}
      viewBox="0 0 900 1200"
      preserveAspectRatio="none"
      fill="none"
      focusable="false"
    >
      {contours.map((path, index) => (
        <path key={path} d={path} className={index % 3 === 1 ? styles.boneLine : undefined} />
      ))}
    </svg>
  );
}

export default function PortraitWaves({ clipId }: { clipId: string }) {
  return (
    <div className={styles.waves} aria-hidden="true">
      <div className={styles.base}>
        <div className={styles.response}>
          <div className={styles.ambient}><Contours /></div>
        </div>
      </div>
      <div className={styles.accent} style={{ clipPath: `url(#${clipId})` }}>
        <div className={styles.response}>
          <div className={styles.ambient}><Contours /></div>
        </div>
      </div>
    </div>
  );
}

import type { Metadata, Viewport } from "next";
import { Anton, Bebas_Neue, Instrument_Sans, Instrument_Serif } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const anton = Anton({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-anton" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-bebas" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic", display: "swap", variable: "--font-instrument-serif" });
const sans = Instrument_Sans({ subsets: ["latin"], display: "swap", variable: "--font-instrument-sans" });

export const metadata: Metadata = {
  title: "ANDRIJA RADONJIC — Nº 15 · Striker · Montenegro",
  description: "From Montenegro to California. Andrija Radonjic, number 15. The game, the work, and the minutes nobody sees.",
};

export const viewport: Viewport = { themeColor: "#0B0B0C", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${anton.variable} ${bebas.variable} ${serif.variable} ${sans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(()=>{let p="system";try{const v=sessionStorage.getItem("radonja:motion");if(v==="full"||v==="reduced")p=v}catch{}const r=document.documentElement;r.dataset.motionPreference=p;r.dataset.motion=p==="reduced"||(p==="system"&&matchMedia("(prefers-reduced-motion: reduce)").matches)?"reduced":"full"})()` }} />
        <script dangerouslySetInnerHTML={{ __html: `try{if(sessionStorage.getItem("radonja:act1:seen")==="1")document.documentElement.dataset.radonjaSeen="true"}catch{}` }} />
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

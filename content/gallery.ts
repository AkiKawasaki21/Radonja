import type { StaticImageData } from 'next/image';
import uclaNight from '../public/photos/gallery-01-ucla-night.jpg';
import nightProfile from '../public/photos/gallery-02-night-profile.jpg';
import lmuBattle from '../public/photos/gallery-03-lmu-battle-bw.jpg';
import warmupHeader from '../public/photos/gallery-04-warmup-header.jpg';
import goldenStrike from '../public/photos/gallery-05-golden-strike.jpg';
import volley from '../public/photos/gallery-06-volley-skyblue.jpg';
import homeWhites from '../public/photos/gallery-07-home-whites.jpg';
import redlandsHuddle from '../public/photos/gallery-08-redlands-huddle.jpg';
import water from '../public/photos/gallery-09-water-bw.jpg';
import flag from '../public/photos/gallery-10-flag.jpg';
import { quoteFragments } from './quote';

export type GalleryPhoto = {
  kind: 'photo';
  src: StaticImageData;
  eyebrow: string;
  caption: string;
  index: number;
};

export type GalleryCallout = {
  kind: 'callout';
  eyebrow: string;
  caption: string;
};

export const gallery: (GalleryPhoto | GalleryCallout)[] = [
  { kind: 'photo', src: uclaNight, eyebrow: 'UCLA · NIGHT GAME', caption: 'Westwood, under the lights', index: 1 },
  { kind: 'photo', src: nightProfile, eyebrow: 'ON THE ROAD', caption: 'Away day', index: 2 },
  { kind: 'photo', src: lmuBattle, eyebrow: 'VS. LMU', caption: 'Back to goal. Nobody moves him.', index: 3 },
  { kind: 'photo', src: warmupHeader, eyebrow: 'BEFORE THE WHISTLE', caption: 'Warmups, Riverside', index: 4 },
  { kind: 'callout', eyebrow: 'THE MINDSET / 01', caption: quoteFragments[0] },
  { kind: 'photo', src: goldenStrike, eyebrow: 'GOLDEN HOUR', caption: 'Left foot, last light', index: 5 },
  { kind: 'photo', src: volley, eyebrow: 'ALL IN', caption: 'Airborne', index: 6 },
  { kind: 'photo', src: homeWhites, eyebrow: 'RIVERSIDE', caption: 'Home whites', index: 7 },
  { kind: 'photo', src: redlandsHuddle, eyebrow: 'TOGETHER', caption: 'Summer. Redlands FC.', index: 8 },
  { kind: 'callout', eyebrow: 'THE MINDSET / 02', caption: quoteFragments[1] },
  { kind: 'photo', src: water, eyebrow: 'AFTER HOURS', caption: 'The work nobody films', index: 9 },
  { kind: 'photo', src: flag, eyebrow: 'NEVER FAR FROM HOME', caption: 'Montenegro → California', index: 10 },
];

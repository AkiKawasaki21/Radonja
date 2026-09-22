import finishing from "@/public/photos/gallery-05-golden-strike.jpg";
import movement from "@/public/photos/gallery-07-home-whites.jpg";
import holdUp from "@/public/photos/gallery-03-lmu-battle-bw.jpg";
import aerial from "@/public/photos/gallery-06-volley-skyblue.jpg";
import pressing from "@/public/photos/gallery-02-night-profile.jpg";
import match from "@/public/photos/gallery-01-ucla-night.jpg";

// These are photo previews. Add actual video sources when the clips are supplied.
export const filmRoomSlots = [
  { id: "finishing", title: "Finishing", photo: finishing, alt: "Andrija Radonjic striking the ball at golden hour", status: "Coming soon" },
  { id: "movement", title: "Movement", photo: movement, alt: "Andrija Radonjic wearing the white home kit during a daytime match", status: "Coming soon" },
  { id: "hold-up-play", title: "Hold-up play", photo: holdUp, alt: "Andrija Radonjic in a physical battle for the ball against LMU", status: "Coming soon" },
  { id: "aerial-play", title: "Aerial play", photo: aerial, alt: "Andrija Radonjic airborne for a volley", status: "Coming soon" },
  { id: "pressing", title: "Pressing", photo: pressing, alt: "A side profile of Andrija Radonjic during a night game", status: "Coming soon" },
  { id: "match-sequence", title: "Match sequence", photo: match, alt: "Andrija Radonjic on the pitch at UCLA under the lights", status: "Coming soon" },
] as const;

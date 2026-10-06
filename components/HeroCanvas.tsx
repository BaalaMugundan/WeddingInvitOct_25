"use client";

import { useEffect, useRef, useState } from "react";
import { HERO, WEDDING } from "@/lib/wedding";

/** Seconds into the clip at which the card begins its 1 s fade-in. */
const OVERLAY_REVEAL_SECONDS = 8;

/* HERO — full-viewport intro video (the "envelope reveal").
   A muted, auto-playing, inline <video> fills the stage unobstructed.
   Renders at natural screen height (h-100svh) with no scroll-tracking wrapper. */
export default function HeroCanvas() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const atTopRef = useRef(true);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  /** Reveal the card once playback passes the reveal mark (fires ~4×/s). */
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.currentTime >= OVERLAY_REVEAL_SECONDS) {
      setIsOverlayVisible(true);
    }
  };

  /** Stop the clip and reveal the finale immediately. */
  const skipIntro = () => {
    videoRef.current?.pause();
    setIsOverlayVisible(true);
  };

  // Scroll-up replay: returning to the very top rewinds the clip and re-hides
  // the card, so the intro plays again and the reveal waits for the mark.
  useEffect(() => {
    atTopRef.current = window.scrollY === 0;
    const handleScroll = () => {
      if (window.scrollY > 0) {
        atTopRef.current = false;
        return;
      }
      if (atTopRef.current) return;
      atTopRef.current = true;
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = 0;
      void video.play();
      setIsOverlayVisible(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-maroon-950">
      {/* Intro video — `muted` + `playsInline` keep silent autoplay allowed. */}
      <video
        ref={videoRef}
        src="/hero-envelope.mp4"
        autoPlay
        muted
        playsInline
        className="absolute inset-0 z-0 h-full w-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsOverlayVisible(true)}
      />

      {/* Cinematic vignette — keeps the text legible over the footage. */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-maroon-950/80 via-transparent to-maroon-950/90" />

      {/* Invitation card — bound to lib/wedding.ts config. Hidden (opacity-0)
          so the footage is unobstructed, then fades in over 1s starting at the
          reveal mark (or immediately on Skip Intro). */}
      <div
        className={`absolute inset-0 z-20 flex items-center justify-center px-6 transition-opacity duration-1000 ease-in-out ${
          isOverlayVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex w-full max-w-[calc(100%-3rem)] flex-col items-center justify-center rounded-2xl border border-gold-400/50 bg-maroon-950/70 px-5 py-4 text-center shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <p className="font-script text-2xl leading-snug text-gold-300">{HERO.eyebrow}</p>
          <p className="mt-2 font-script text-5xl leading-tight text-cream-50">
            {WEDDING.coupleNames}
          </p>
          <p className="mb-2 mt-1 font-script text-2xl leading-snug text-gold-300">
            {HERO.tagline}
          </p>
          <p className="font-display text-lg font-semibold tracking-[0.2em] text-cream-50">
            {WEDDING.dateDisplay}
          </p>
          <p className="mt-1 font-sans text-[9px] uppercase tracking-[0.25em] text-cream-50/70">
            {WEDDING.venueShort}
          </p>
        </div>
      </div>

      {/* Skip Intro — offered only while the video is still playing. */}
      {!isOverlayVisible && (
        <button
          type="button"
          onClick={skipIntro}
          className="absolute bottom-6 right-6 z-30 rounded-full border border-gold-400/60 bg-maroon-950/70 px-4 py-2 font-sans text-[10px] font-medium uppercase tracking-[0.25em] text-cream-50/90 shadow-lg backdrop-blur-md transition-colors hover:bg-maroon-950/90 hover:text-gold-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
        >
          Skip Intro
        </button>
      )}
    </section>
  );
}

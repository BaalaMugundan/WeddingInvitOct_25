"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";
import { WEDDING, HERO, HERO_SEQUENCE, heroFrameUrl } from "@/lib/wedding";

/* HERO — canvas image-sequence scrubbing ("envelope reveal").
   Outer wrapper is 400vh; inner stage is sticky top-0 h-100svh.
   Frames are preloaded once into Image objects, then a rAF loop maps
   smoothed scroll progress 0..1 → frame index and cover-draws it.
   Decoding still JPGs is far cheaper on mobile GPUs than seeking video. */
export default function HeroCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frames = useRef<HTMLImageElement[]>([]);
  const target = useRef(0);
  const smooth = useRef(0);
  const currentIdx = useRef(-1);
  const drawRef = useRef<(idx: number) => void>(() => {});
  // Latches true once the envelope starts opening — hint never comes back.
  const hasOpenedRef = useRef(false);
  const total = HERO_SEQUENCE.frameCount;

  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    target.current = latest;
    // Fade-out threshold: once past 10%, hide the hint permanently,
    // even if the user scrolls back to 0. Ref guard avoids stale closures
    // and redundant state updates on every scroll tick.
    if (latest > 0.1 && !hasOpenedRef.current) {
      setHasOpened(true);
      hasOpenedRef.current = true;
    }
  });

  const hintOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const hintY = useTransform(scrollYProgress, [0, 0.12], [0, -40]);
  const finaleOpacity = useTransform(scrollYProgress, [0.72, 0.92], [0, 1]);
  const finaleScale = useTransform(scrollYProgress, [0.72, 0.92], [0.92, 1]);
  const shadeOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.25, 0.1, 0.45]);

  // Cover-fit draw with fallback to the nearest decoded frame (no flicker).
  useEffect(() => {
    drawRef.current = (idx: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const list = frames.current;
      let img: HTMLImageElement | undefined;
      for (let i = idx; i >= 0; i--) {
        const c = list[i];
        if (c && c.complete && c.naturalWidth > 0) {
          img = c;
          break;
        }
      }
      if (!img) {
        for (let i = idx + 1; i < list.length; i++) {
          const c = list[i];
          if (c && c.complete && c.naturalWidth > 0) {
            img = c;
            break;
          }
        }
      }
      if (!img) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const cw = canvas.width;
      const ch = canvas.height;
      if (!cw || !ch) return;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      currentIdx.current = idx;
      setReady(true);
    };
  }, []);

  // Size the canvas backing store to the stage (DPR capped for low-end GPUs).
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(stage.clientWidth * dpr);
      const h = Math.round(stage.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        if (currentIdx.current >= 0) drawRef.current(currentIdx.current);
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  // Preload every frame once; decode eagerly; first frame paints immediately.
  useEffect(() => {
    let cancelled = false;
    frames.current = [];
    setLoaded(0);
    currentIdx.current = -1;
    for (let i = 0; i < total; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = heroFrameUrl(i);
      if (i < 12) img.fetchPriority = "high";
      img.onload = () => {
        if (cancelled) return;
        setLoaded((n) => n + 1);
        // Paint frame 0 ASAP so the hero is never blank on slow 3G.
        if (i === 0) drawRef.current(0);
        // Keep the currently targeted frame fresh as frames stream in.
        const want = Math.min(total - 1, Math.floor(smooth.current * total));
        if (want !== currentIdx.current) drawRef.current(want);
      };
      img.onerror = () => {
        if (!cancelled) setLoaded((n) => n + 1);
      };
      frames.current.push(img);
    }
    return () => {
      cancelled = true;
    };
  }, [total]);

  // rAF loop: ease smooth toward target, draw only when the index changes.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      smooth.current += (target.current - smooth.current) * 0.16;
      if (Math.abs(target.current - smooth.current) < 0.0005) {
        smooth.current = target.current;
      }
      const idx = Math.min(total - 1, Math.max(0, Math.floor(smooth.current * total)));
      if (idx !== currentIdx.current) drawRef.current(idx);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total]);

  const pct = Math.round((loaded / Math.max(total, 1)) * 100);

  return (
    <section ref={wrapRef} className="relative h-[400vh] bg-maroon-950">
      {/* Pinned stage — stays fixed while the 400vh wrapper scrolls */}
      <div ref={stageRef} className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={HERO.frameAlt}
        />
        {/* Loading veil until the first frame is on screen */}
        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-maroon-950 px-6 text-center">
            <p className="font-script text-4xl text-gold-300">{HERO.title}</p>
            <p className="text-[11px] uppercase tracking-[0.3em] text-cream-200/70">
              {HERO.loadingLabel} {pct}%
            </p>
            <div className="h-1 w-40 overflow-hidden rounded-full bg-cream-200/20">
              <div
                className="h-full rounded-full bg-gold-400 transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Cinematic vignette, deepens as the envelope opens */}
        <motion.div
          style={{ opacity: shadeOpacity }}
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-maroon-950/80 via-transparent to-maroon-950/90"
        />

        {/* Opening hint — fades smoothly as scrubbing begins, then stays
            hidden permanently once the envelope has started opening. */}
        <motion.div
          style={hasOpened ? undefined : { opacity: hintOpacity, y: hintY }}
          animate={hasOpened ? { opacity: 0, y: -40 } : {}}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`absolute inset-x-0 top-[12svh] flex flex-col items-center px-6 text-center ${
            hasOpened ? "pointer-events-none opacity-0" : ""
          }`}
          aria-hidden={hasOpened}
        >
          <p className="font-script text-4xl text-gold-300 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] sm:text-5xl">
            {HERO.title}
          </p>
          <p className="mt-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.35em] text-cream-100/90">
            <span className="inline-block h-px w-8 bg-gold-400/80" />
            {HERO.scrollHint}
            <span className="inline-block h-px w-8 bg-gold-400/80" />
          </p>
          <motion.span
            animate={ready ? { y: [0, 10, 0] } : {}}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="mt-4 text-2xl text-gold-300"
            aria-hidden
          >
            {HERO.scrollIcon}
          </motion.span>
        </motion.div>

        {/* Finale card — blooms in as the envelope fully opens, perfectly
            centered in the viewport. Full-cover flex wrapper (not Tailwind
            translate) so Framer's scale transform can't fight the centering. */}
        <motion.div
          style={{ opacity: finaleOpacity, scale: finaleScale }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-6"
        >
          <div className="w-full max-w-sm rounded-2xl border border-gold-400/50 bg-maroon-950/70 px-6 py-5 text-center shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
            <p className="font-script text-3xl text-gold-300">{WEDDING.coupleLine}</p>
            <p className="mt-1 font-display text-xl font-semibold tracking-wide text-cream-50">
              {WEDDING.dateShort}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-cream-200/80">
              {HERO.finaleHint}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

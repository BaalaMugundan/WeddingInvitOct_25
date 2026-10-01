"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";
import { WEDDING, HERO, HERO_SEQUENCE, heroFrameUrl } from "@/lib/wedding";

/* HERO — canvas image-sequence scrubbing ("envelope reveal").
   Outer wrapper is 400vh; inner stage is sticky top-0 h-100svh.
   Perf notes:
   - Scroll progress lives in refs + MotionValues only — NEVER useState per frame.
   - Frames preload with limited concurrency; first frame is prioritised so the
     veil lifts fast and network contention stays low.
   - The rAF loop is paused when the hero is off-screen (IntersectionObserver),
     the 2d context is cached, and setState is only fired on coarse progress
     steps + once when ready (React bails out otherwise, but we avoid even that).
   - Decoding still WEBPs is far cheaper on mobile GPUs than seeking video. */
export default function HeroCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frames = useRef<HTMLImageElement[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const target = useRef(0);
  const smooth = useRef(0);
  const currentIdx = useRef(-1);
  const drawRef = useRef<(idx: number) => void>(() => {});
  const visibleRef = useRef(true);
  const readyRef = useRef(false);
  const progressStepRef = useRef(-1);
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
  // Uses cached ctx + backing-store dims; fires React state at most once
  // (ready latch) — no per-frame re-renders.
  useEffect(() => {
    drawRef.current = (idx: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const list = frames.current;
      let img: HTMLImageElement | undefined = list[idx];
      if (!(img && img.complete && img.naturalWidth > 0)) {
        img = undefined;
        for (let i = idx; i >= 0; i--) {
          const c = list[i];
          if (c && c.complete && c.naturalWidth > 0) {
            img = c;
            break;
          }
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
      let ctx = ctxRef.current;
      if (!ctx) {
        ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctxRef.current = ctx;
      }
      const cw = sizeRef.current.w || canvas.width;
      const ch = sizeRef.current.h || canvas.height;
      if (!cw || !ch) return;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      currentIdx.current = idx;
      if (!readyRef.current) {
        readyRef.current = true;
        setReady(true);
      }
    };
  }, []);

  // Size the canvas backing store to the stage (DPR capped at 1.5 for low-end
  // GPUs — cuts pixels pushed per drawImage ~44% vs DPR 2 on this 430px frame).
  // Caches ctx + dims in refs so the per-frame draw never calls getContext or
  // measures layout. Re-fits on orientation change only.
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(stage.clientWidth * dpr));
      const h = Math.max(1, Math.round(stage.clientHeight * dpr));
      if (sizeRef.current.w !== w || sizeRef.current.h !== h) {
        canvas.width = w;
        canvas.height = h;
        sizeRef.current = { w, h };
        const ctx = canvas.getContext("2d");
        if (ctx) ctxRef.current = ctx;
        if (currentIdx.current >= 0) drawRef.current(currentIdx.current);
      }
    };
    fit();
    window.addEventListener("orientationchange", fit);
    return () => window.removeEventListener("orientationchange", fit);
  }, []);

  // Visibility gate — pauses the rAF loop once the hero scrolls off-screen,
  // so we burn zero CPU/GPU on frames the user can't see.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { rootMargin: "100px" }
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, []);

  // Preload frames with limited concurrency (12 in flight) so 240
  // simultaneous requests don't thrash the network / decoder. First frames
  // load first, so the veil lifts fast.
  // Progress setState fires on ~2% steps only — not 240 individual renders.
  useEffect(() => {
    let cancelled = false;
    const list: (HTMLImageElement | undefined)[] = new Array(total);
    frames.current = list as HTMLImageElement[];
    progressStepRef.current = -1;
    setLoaded(0);
    currentIdx.current = -1;
    const CONCURRENCY = 12;
    let next = 0;
    let settled = 0;
    const bump = () => {
      settled += 1;
      const step = Math.floor((settled / total) * 50);
      if (step !== progressStepRef.current) {
        progressStepRef.current = step;
        setLoaded(settled);
      }
    };
    const loadOne = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        if (i < 12) img.fetchPriority = "high";
        img.onload = () => {
          if (cancelled) return resolve();
          list[i] = img;
          // Paint frame 0 ASAP so the hero is never blank on slow 3G.
          if (i === 0) drawRef.current(0);
          // Keep the currently targeted frame fresh as frames stream in.
          const want = Math.min(total - 1, Math.floor(smooth.current * total));
          if (want !== currentIdx.current) drawRef.current(want);
          bump();
          resolve();
        };
        img.onerror = () => {
          if (!cancelled) bump();
          resolve();
        };
        img.src = heroFrameUrl(i);
      });
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (!cancelled && next < total) {
        const i = next++;
        await loadOne(i);
      }
    });
    void Promise.all(workers);
    return () => {
      cancelled = true;
    };
  }, [total]);

  // rAF loop: ease smooth toward target, draw only when the index changes.
  // Skips work entirely when the hero is off-screen (visibility gate) and
  // snaps instantly when settled so we don't spin rAF forever.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (!visibleRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const diff = target.current - smooth.current;
      if (Math.abs(diff) < 0.0005) {
        smooth.current = target.current;
      } else {
        smooth.current += diff * 0.16;
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
      {/* Pinned stage — stays fixed while the 400vh wrapper scrolls.
          content-visibility skips off-screen paint work for the huge section. */}
      <div
        ref={stageRef}
        className="sticky top-0 h-[100svh] w-full overflow-hidden [content-visibility:auto] [contain-intrinsic-size:430px_100svh]"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full transform-gpu will-change-transform [image-rendering:auto]"
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

        {/* Cinematic vignette, deepens as the envelope opens.
            transform-gpu + will-change promote the animated opacity layer to
            its own compositor tile (no main-thread repaint per scroll tick). */}
        <motion.div
          style={{ opacity: shadeOpacity }}
          className="pointer-events-none absolute inset-0 transform-gpu bg-gradient-to-b from-maroon-950/80 via-transparent to-maroon-950/90 will-change-[opacity]"
        />

        {/* Opening hint — fades smoothly as scrubbing begins, then stays
            hidden permanently once the envelope has started opening. */}
        <motion.div
          style={hasOpened ? undefined : { opacity: hintOpacity, y: hintY }}
          animate={hasOpened ? { opacity: 0, y: -40 } : {}}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`absolute inset-x-0 top-[12svh] flex transform-gpu flex-col items-center px-6 text-center will-change-[opacity,transform] ${
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
          {/* GPU-promoted bob: transform-only keyframes never touch layout.
              Rendered only while the hero isn't ready-hidden to save a layer. */}
          {!hasOpened && (
            <motion.span
              animate={ready ? { y: [0, 10, 0] } : {}}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
              className="mt-4 inline-block transform-gpu text-2xl text-gold-300 will-change-transform"
              aria-hidden
            >
              {HERO.scrollIcon}
            </motion.span>
          )}
        </motion.div>

        {/* Finale card — blooms in as the envelope fully opens, perfectly
            centered in the viewport. Full-cover flex wrapper (not Tailwind
            translate) so Framer's scale transform can't fight the centering. */}
        <motion.div
          style={{ opacity: finaleOpacity, scale: finaleScale }}
          className="pointer-events-none absolute inset-0 flex transform-gpu items-center justify-center px-6 will-change-[opacity,transform]"
        >
          <div className="w-full max-w-sm rounded-2xl border border-gold-400/50 bg-maroon-950/70 px-6 py-5 text-center shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-sm">
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

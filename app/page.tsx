import HeroCanvas from "@/components/HeroCanvas";
import Storyboard from "@/components/Storyboard";
import ScratchCard from "@/components/ScratchCard";
import Itinerary from "@/components/Itinerary";
import { FOOTER } from "@/lib/wedding";

export default function Home() {
  return (
    <main className="min-h-svh w-full bg-cream-50 font-sans text-ink-900">
      {/* 1 — pinned canvas image-sequence scrub */}
      <HeroCanvas />
      {/* 2 — polaroid storyboard with caricature */}
      <Storyboard />
      {/* 3 — scratch-to-reveal date */}
      <ScratchCard />
      {/* 4 — itinerary + add-to-calendar */}
      <Itinerary />
      <footer className="bg-maroon-950 px-6 py-10 text-center">
        <p className="font-script text-3xl text-gold-300">{FOOTER.title}</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-cream-200/60">
          {FOOTER.sub}
        </p>
      </footer>
    </main>
  );
}


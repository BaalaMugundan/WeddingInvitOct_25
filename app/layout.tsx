import type { Metadata } from "next";
import { Great_Vibes, Cormorant_Garamond, Jost } from "next/font/google";
import { SITE } from "@/lib/wedding";
import "./globals.css";

const script = Great_Vibes({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const sans = Jost({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${script.variable} ${display.variable} ${sans.variable} h-full antialiased`}
    >
      {/* Outside the phone-frame: dark elegant backdrop on desktop */}
      <body className="min-h-full bg-zinc-950 font-sans text-ink-900">
        {/* Mobile-first wrapper: 430px phone frame, centred with premium shadow */}
        <div className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-x-clip bg-cream text-ink-900 shadow-2xl shadow-black/60">
          {children}
        </div>
      </body>
    </html>
  );
}


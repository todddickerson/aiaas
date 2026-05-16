import type { Metadata } from "next";
import {
  Inter_Tight,
  Instrument_Serif,
  JetBrains_Mono,
  Space_Grotesk,
  Unbounded,
} from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import {
  DEFAULT_ACCENT,
  DEFAULT_MODE,
  DEFAULT_VARIANT,
} from "@/lib/theme";

import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  display: "swap",
});

const fontVars = [
  interTight.variable,
  instrumentSerif.variable,
  jetbrainsMono.variable,
  spaceGrotesk.variable,
  unbounded.variable,
].join(" ");

export const metadata: Metadata = {
  metadataBase: new URL("https://aiaas.com"),
  title: {
    default: "AIaaS.com — Hire an AI agent. Unlimited executions.",
    template: "%s · AIaaS.com",
  },
  description:
    "AIaaS.com is where non-technical operators hire production AI agents from any runtime, with one bill, one wallet, one context vault, and human UX wrapped around every run.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-mode={DEFAULT_MODE}
      data-accent={DEFAULT_ACCENT}
      data-variant={DEFAULT_VARIANT}
      style={{ colorScheme: DEFAULT_MODE }}
      className={fontVars}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

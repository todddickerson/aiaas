import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";
import { DEFAULT_ACCENT, DEFAULT_MODE } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: "AIaaS.com — Hire an AI agent. Unlimited executions.",
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
      style={{ colorScheme: DEFAULT_MODE }}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

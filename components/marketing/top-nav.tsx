"use client";

import Link from "next/link";
import { Search } from "lucide-react";

import { LogoMark } from "@/components/marketing/logo-mark";
import { WalletBalance } from "@/components/marketing/wallet-balance";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Discover" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/manifesto", label: "Manifesto" },
  { href: "/publish", label: "Publish" },
  { href: "/developers", label: "Developers" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export function TopNav() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-border backdrop-blur"
      style={{ background: "color-mix(in oklab, var(--bg) 90%, transparent)" }}
    >
      <div className="mx-auto flex max-w-[1360px] items-center gap-6 px-4 py-3 md:gap-9 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 pr-3 md:border-r md:border-line-soft"
        >
          <LogoMark size={28} />
          <span
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            AIaaS<span style={{ color: "var(--accent)" }}>.com</span>
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center gap-5 text-sm text-muted-foreground md:flex"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <button
            type="button"
            // TODO Day 3: open cmdK-style search modal
            className="hidden items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground md:flex"
            style={{ fontFamily: "var(--font-mono)" }}
            aria-label="Search agents, operators, chains"
          >
            <Search className="size-3.5" aria-hidden />
            <span className="text-text-faint">⌘K</span>
            <span>agents · operators · chains</span>
          </button>
          <WalletBalance />
          <ThemeToggle />
          <Button size="sm" className="hidden whitespace-nowrap rounded-full sm:inline-flex">
            Sign in
          </Button>
        </div>
      </div>
    </header>
  );
}

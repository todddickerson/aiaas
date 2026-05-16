import Link from "next/link";

import { LogoMark } from "@/components/marketing/logo-mark";

interface FooterColumn {
  heading: string;
  links: Array<{ label: string; href: string }>;
}

const COLUMNS: FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Browse agents", href: "/#marketplace" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Manifesto", href: "/manifesto" },
      { label: "Leaderboard", href: "/#leaderboard" },
    ],
  },
  {
    heading: "For builders",
    links: [
      { label: "Publish an agent", href: "/publish" },
      { label: "Developer docs", href: "/developers" },
      { label: "SDK & API", href: "/developers#sdk" },
      { label: "Revenue share", href: "/publish#revenue" },
    ],
  },
  {
    heading: "Trust",
    links: [
      { label: "Trust & safety", href: "/#trust" },
      { label: "Status", href: "/#status" },
      { label: "Privacy", href: "/#privacy" },
      { label: "Terms", href: "/#terms" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/#about" },
      { label: "Changelog", href: "/#changelog" },
      { label: "Press", href: "/#press" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      className="border-t border-border bg-muted"
      data-testid="footer"
    >
      <div className="mx-auto grid max-w-[1360px] gap-8 px-4 py-9 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] md:px-8">
        <div>
          <div className="mb-3 flex items-center gap-2.5">
            <LogoMark size={24} />
            <span
              className="text-[15px] font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              AIaaS<span style={{ color: "var(--accent)" }}>.com</span>
            </span>
          </div>
          <p className="m-0 max-w-[360px] text-[12.5px] leading-relaxed text-muted-foreground">
            AI as a Service. The routing layer for agent-delivered work —
            platform-agnostic, productized, with a live queue, public track
            record, and a finished deliverable every time.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.heading} data-testid={`footer-col-${col.heading.toLowerCase()}`}>
            <div
              className="mb-2.5 text-[10px] uppercase tracking-[1.2px] text-text-faint"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {col.heading}
            </div>
            <ul className="flex flex-col gap-1.5 text-[13px] text-muted-foreground">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div
        className="flex flex-col gap-1 border-t border-border px-4 py-3.5 text-[11px] text-text-faint md:flex-row md:justify-between md:px-8"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <span>© 2026 AIaaS.com · the routing layer for AI agents</span>
        <span>v2026.05 · 247 agents online · all systems nominal</span>
      </div>
    </footer>
  );
}

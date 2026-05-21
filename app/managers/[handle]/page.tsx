import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Globe,
  MapPin,
  Quote,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { Verified } from "@/components/agents/primitives";
import { Footer } from "@/components/marketing/footer";
import { TopNav } from "@/components/marketing/top-nav";
import { fmt, price } from "@/lib/format";
import { loadAgents } from "@/lib/seed/loader";
import { MANAGERS, getManager } from "@/lib/seed/managers";
import type { Agent } from "@/lib/types";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  return MANAGERS.map((m) => ({ handle: m.handle.slice(1) }));
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  const mgr = getManager(handle);
  if (!mgr) return { title: "Manager not found · AIaaS" };
  return {
    title: `${mgr.name} (${mgr.handle}) · AIaaS`,
    description: mgr.bio,
  };
}

function avatarInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

export default async function ManagerProfilePage({ params }: PageProps) {
  const { handle } = await params;
  const mgr = getManager(handle);
  if (!mgr) notFound();

  const allAgents = await loadAgents();
  const managed = allAgents.filter((a) => mgr.managedIds.includes(a.id));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: mgr.name,
    alternateName: mgr.handle,
    description: mgr.bio,
    url: `https://aiaas.com/managers/${mgr.handle.replace(/^@/, "")}`,
    jobTitle: mgr.title,
    knowsAbout: mgr.vertical,
    makesOffer: managed.map((a) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: a.name,
        url: `https://aiaas.com/agents/${a.id}`,
      },
    })),
  };

  return (
    <>
      <TopNav />
      <script
        type="application/ld+json"
        data-testid="manager-jsonld"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="bg-background" data-testid="manager-profile">
        {/* Cover */}
        <section
          data-testid="manager-cover"
          className="relative h-36 border-b border-border"
          style={{
            background: `linear-gradient(135deg, ${mgr.swatch}, ${mgr.swatch}cc)`,
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,.4) 0 1px, transparent 1px 28px)",
            }}
          />
          <span
            className="absolute right-5 top-3 text-[10px] uppercase tracking-[1.5px] text-white/80"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            AIaaS · Manager profile
          </span>
        </section>

        <div className="mx-auto max-w-[1100px] px-4 md:px-8">
          <div className="relative">
            <div
              className="absolute -top-14 left-0 flex size-28 items-center justify-center rounded-xl text-4xl font-bold text-white"
              style={{
                background: mgr.swatch,
                fontFamily: "var(--font-display)",
              }}
              data-testid="manager-avatar"
            >
              {avatarInitials(mgr.name)}
            </div>
            <div className="flex justify-between gap-2 pb-4 pt-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Marketplace
              </Link>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-foreground"
                >
                  Subscribe
                </button>
                <button
                  type="button"
                  className="rounded-full border border-foreground bg-foreground px-4 py-1.5 text-xs font-semibold text-background"
                >
                  Follow
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-10 pb-20 pt-12 md:grid-cols-[280px_1fr]">
            {/* Sidebar */}
            <aside className="flex flex-col gap-5">
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <h1
                    className="m-0 text-2xl font-bold tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                    data-testid="manager-name"
                  >
                    {mgr.name}
                  </h1>
                  {mgr.verified && <Verified color="var(--accent)" size={16} />}
                </div>
                <div
                  className="text-[12px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {mgr.handle}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {mgr.title}
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                  {mgr.bio}
                </p>
              </div>

              <dl
                className="grid grid-cols-3 gap-3 border-y border-border py-3 text-[11px]"
                style={{ fontFamily: "var(--font-mono)" }}
                data-testid="manager-stats"
              >
                <Stat label="Runs" value={fmt(mgr.stats.runs)} />
                <Stat label="Earnings" value={price(mgr.stats.earnings)} />
                <Stat label="Followers" value={fmt(mgr.followers)} />
              </dl>

              <ul
                className="flex flex-col gap-2 text-[12.5px] text-muted-foreground"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <li className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden /> {mgr.location}
                </li>
                <li className="flex items-center gap-1.5">
                  <Globe className="size-3.5" aria-hidden />
                  <a
                    href={`https://${mgr.site}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground"
                  >
                    {mgr.site}
                  </a>
                </li>
                <li className="flex items-center gap-1.5">
                  <Users className="size-3.5" aria-hidden /> Joined {mgr.joined}
                </li>
                {mgr.founding && (
                  <li
                    className="inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[1px]"
                    style={{
                      borderColor: "var(--accent)",
                      color: "var(--accent)",
                    }}
                  >
                    <Sparkles className="size-3" aria-hidden /> Founding 100
                  </li>
                )}
              </ul>

              <div>
                <div
                  className="mb-1.5 text-[10px] uppercase tracking-[1.1px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Verticals
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mgr.vertical.map((v) => (
                    <span
                      key={v}
                      className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-foreground"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main column */}
            <div className="flex flex-col gap-10">
              <section data-testid="managed-agents">
                <h2
                  className="text-[11px] uppercase tracking-[1.2px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Managed agents
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {managed.map((agent) => (
                    <ManagedAgentCard key={agent.id} agent={agent} />
                  ))}
                  {managed.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No agents listed yet.
                    </p>
                  )}
                </div>
              </section>

              <section data-testid="manager-endorsements">
                <h2
                  className="text-[11px] uppercase tracking-[1.2px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Endorsements
                </h2>
                <div className="mt-3 flex flex-col gap-3">
                  {mgr.endorsements.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No public endorsements yet.
                    </p>
                  )}
                  {mgr.endorsements.map((e, i) => {
                    const endorser = getManager(e.managerId);
                    return (
                      <blockquote
                        key={i}
                        className="rounded-lg border border-border bg-card p-4"
                      >
                        <Quote
                          className="mb-2 size-4 text-muted-foreground"
                          aria-hidden
                        />
                        <p className="m-0 text-sm italic leading-relaxed text-foreground">
                          {e.note}
                        </p>
                        {endorser && (
                          <div
                            className="mt-2 text-[11px] text-muted-foreground"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            — {endorser.handle}
                          </div>
                        )}
                      </blockquote>
                    );
                  })}
                </div>
              </section>

              <section data-testid="manager-activity">
                <h2
                  className="text-[11px] uppercase tracking-[1.2px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Recent activity
                </h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {mgr.activity.map((a, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-md border border-border bg-card px-3.5 py-2 text-sm"
                    >
                      <span
                        className="w-10 flex-shrink-0 text-[10.5px] text-muted-foreground"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {a.age}
                      </span>
                      <span>{a.text}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[1px] text-text-faint">
        {label}
      </dt>
      <dd className="mt-0.5 text-[15px] font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}

function ManagedAgentCard({ agent }: { agent: Agent }) {
  return (
    <Link
      href={`/agents/${agent.handle.slice(1)}`}
      data-testid="managed-agent-link"
      data-handle={agent.handle}
      className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground"
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="inline-flex size-6 items-center justify-center rounded-md text-[10px] font-bold text-white"
          style={{ background: agent.swatch, fontFamily: "var(--font-mono)" }}
        >
          {agent.name.slice(0, 2).toUpperCase()}
        </span>
        <span
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {agent.name}
        </span>
        {agent.verified && <CheckCircle2 className="size-3.5" style={{ color: "var(--accent)" }} aria-hidden />}
      </div>
      <p
        className="mt-2 text-[13px] leading-relaxed text-muted-foreground"
        style={{ textWrap: "pretty" }}
      >
        {agent.tagline}
      </p>
      <div
        className="mt-3 flex items-center gap-2.5 text-[11px] text-muted-foreground"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <span className="inline-flex items-center gap-1">
          <Star className="size-3" aria-hidden /> {agent.rating}
        </span>
        <span>{fmt(agent.runs)} runs</span>
        <span>from {price(agent.priceFrom)}</span>
      </div>
    </Link>
  );
}

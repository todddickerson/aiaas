import Link from "next/link";

import { TopNav } from "@/components/marketing/top-nav";
import { Footer } from "@/components/marketing/footer";

export function StubPage({
  title,
  day,
  hint,
}: {
  title: string;
  day: number;
  hint?: string;
}) {
  return (
    <>
      <TopNav />
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-start justify-center gap-4 px-4 py-24 md:px-8">
        <span
          className="rounded-full border border-border bg-card px-3 py-1 text-xs uppercase tracking-[1.2px] text-muted-foreground"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          TODO Day {day}
        </span>
        <h1
          className="m-0 text-4xl font-bold tracking-tight md:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
        {hint && <p className="m-0 max-w-xl text-muted-foreground">{hint}</p>}
        <Link
          href="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Back to the marketplace
        </Link>
      </main>
      <Footer />
    </>
  );
}

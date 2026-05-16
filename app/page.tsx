import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-24">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center gap-6 text-center">
        <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Day 1 skeleton
        </span>

        <h1
          data-testid="brand-mark"
          className="text-5xl font-semibold tracking-tight text-foreground sm:text-7xl"
        >
          AIaaS.com
        </h1>

        <p className="max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          Hire an AI agent. Unlimited executions. Productized AI services — one
          clear offer, unlimited times, with a live queue, a public track
          record, and a finished deliverable every time.
        </p>

        <div
          data-testid="accent-swatch"
          className="h-2 w-32 rounded-full bg-primary"
          aria-hidden
        />
      </div>
    </main>
  );
}

import { Lock } from "lucide-react";

export const metadata = { title: "AIaaS · alpha access" };

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

/**
 * The alpha gate. Shown whenever the AIAAS_ALPHA_TOKEN env is set and the
 * caller hasn't presented it. Users paste their access token; the form
 * GETs back to `/?alpha=<token>` which the middleware turns into a cookie
 * and bounces them to their original destination.
 */
export default async function GatePage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const next = params.next && params.next.startsWith("/") ? params.next : "/";

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-background px-6 py-10 text-foreground"
      data-testid="gate-page"
    >
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            <Lock className="size-3" aria-hidden /> Alpha access
          </div>
          <h1
            className="text-balance text-2xl font-bold tracking-tight md:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            AIaaS is in private alpha.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your alpha token to access the marketplace. Your token came
            from Todd directly.
          </p>

          <form method="GET" action={next} className="mt-6 flex flex-col gap-3">
            <label htmlFor="alpha-token" className="text-[12px] font-medium">
              Alpha token
            </label>
            <input
              id="alpha-token"
              name="alpha"
              type="password"
              required
              autoFocus
              autoComplete="off"
              data-testid="gate-token-input"
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-base outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="paste your token"
              style={{ fontSize: 16 }}
            />
            <button
              type="submit"
              className="mt-2 rounded-md bg-foreground py-2.5 text-sm font-semibold text-background"
              data-testid="gate-submit"
            >
              Enter alpha
            </button>
          </form>

          <p className="mt-6 text-[11px] text-muted-foreground">
            Don&apos;t have a token? Tell Todd. Alpha invites go out in
            batches of 5–10 a week through launch.
          </p>
        </div>
      </main>
  );
}

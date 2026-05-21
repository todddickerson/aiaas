import { CheckCircle2, XCircle } from "lucide-react";

export const metadata = { title: "AIaaS · status" };
export const dynamic = "force-dynamic";

interface HealthPayload {
  ok: boolean;
  uptimeMs: number;
  latencyMs: number;
  agentCount: number;
  sentry: "wired" | "stub";
  commit: string;
  now: string;
}

async function fetchHealth(): Promise<HealthPayload | null> {
  // Server-side fetch against the same deployment. When running locally
  // we hit ourselves; in prod the Vercel domain.
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.VERCEL_URL ??
    "http://127.0.0.1:3000";
  const url = base.startsWith("http") ? `${base}/api/health` : `https://${base}/api/health`;
  try {
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) return null;
    return (await resp.json()) as HealthPayload;
  } catch {
    return null;
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export default async function StatusPage() {
  const health = await fetchHealth();
  const ok = health?.ok ?? false;

  return (
    <main
      className="mx-auto max-w-3xl px-6 py-12 text-foreground"
      data-testid="status-page"
    >
      <div className="mb-8 flex items-center gap-3">
        {ok ? (
          <CheckCircle2
            className="size-7 text-[color:var(--success)]"
            aria-hidden
          />
        ) : (
          <XCircle className="size-7 text-[color:var(--destructive)]" aria-hidden />
        )}
        <h1
          className="text-3xl font-bold tracking-tight"
          data-testid="status-headline"
        >
          {ok ? "All systems operational." : "Degraded."}
        </h1>
      </div>

      <p className="text-sm text-muted-foreground">
        This page reads the same {`/api/health`} endpoint Cloudflare + our
        external monitors hit. If you&apos;re seeing red here, expect that
        Sentry has alerted on-call too.
      </p>

      <div
        className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2"
        data-testid="status-grid"
      >
        <StatusRow
          label="Marketplace catalog"
          value={
            health
              ? `${health.agentCount} agents indexed`
              : "could not reach /api/health"
          }
          ok={ok}
        />
        <StatusRow
          label="Health probe latency"
          value={health ? `${health.latencyMs} ms` : "—"}
          ok={ok}
        />
        <StatusRow
          label="Process uptime"
          value={health ? formatDuration(health.uptimeMs) : "—"}
          ok={ok}
        />
        <StatusRow
          label="Sentry"
          value={health ? health.sentry : "—"}
          ok={ok}
        />
        <StatusRow
          label="Build SHA"
          value={health ? health.commit : "—"}
          ok={ok}
        />
        <StatusRow
          label="Last probe"
          value={health ? new Date(health.now).toUTCString() : "—"}
          ok={ok}
        />
      </div>

      <p className="mt-10 text-[11px] text-muted-foreground">
        Public health endpoint:{" "}
        <a className="underline" href="/api/health">
          /api/health
        </a>
      </p>
    </main>
  );
}

function StatusRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
      data-testid="status-row"
    >
      <div>
        <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </div>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
      <span
        className="inline-block size-2.5 rounded-full"
        style={{
          background: ok ? "var(--success)" : "var(--destructive)",
        }}
        aria-hidden
      />
    </div>
  );
}

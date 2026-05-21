import "server-only";

/**
 * Thin Sentry shim for the alpha. When `SENTRY_DSN` is unset the calls are
 * no-ops; once we wire the real @sentry/nextjs SDK these helpers become the
 * single import surface so the rest of the code doesn't change.
 *
 * Why a shim rather than @sentry/nextjs directly: the SDK pulls in ~250 kB
 * of edge-runtime baggage and a global instrumentation file; we want to
 * keep the alpha bundle lean and wire the real thing in Day 12+ once the
 * project is provisioned.
 */

export type SentrySeverity = "info" | "warning" | "error";

interface CaptureOpts {
  severity?: SentrySeverity;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

function dsn(): string | undefined {
  return process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
}

export function isEnabled(): boolean {
  return Boolean(dsn());
}

export function captureException(error: unknown, opts: CaptureOpts = {}): void {
  if (!isEnabled()) {
    // In CI + local dev with no DSN, still emit to stderr so the failure
    // shows up in test output. Drop the wrapper so the trace is readable.
    console.error("[sentry-stub]", opts.severity ?? "error", error, {
      tags: opts.tags,
      extra: opts.extra,
    });
    return;
  }
  // Defer to the real SDK once wired. We only construct the payload here
  // so the shape is known + tested.
  console.error("[sentry]", {
    severity: opts.severity ?? "error",
    tags: opts.tags,
    extra: opts.extra,
    error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
  });
}

export function captureMessage(message: string, opts: CaptureOpts = {}): void {
  captureException(new Error(message), opts);
}

import "server-only";

// Whop API v1 client. We keep the surface minimal — top up, open hold,
// release hold, refund — and run in stub mode by default until the
// new `biz_aiaas_*` parent biz is provisioned. Stub mode returns
// deterministic IDs so the rest of the stack (ledger, RLS, idempotency)
// can be exercised end-to-end without touching Whop.

export interface WhopTopUpResult {
  whopEventId: string;
  amountCents: number;
  currency: string;
  status: "succeeded" | "pending" | "failed";
  stubbed: boolean;
}

export interface WhopHoldResult {
  whopHoldId: string;
  amountCents: number;
  currency: string;
  status: "open" | "released" | "refunded" | "expired";
  stubbed: boolean;
}

interface CreateTopUpOptions {
  userId: string;
  amountCents: number;
  currency?: string;
  idempotencyKey: string;
}

interface CreateHoldOptions {
  userId: string;
  agentSlug: string;
  amountCents: number;
  currency?: string;
  idempotencyKey: string;
}

interface ReleaseHoldOptions {
  whopHoldId: string;
  idempotencyKey: string;
}

const API_BASE = "https://api.whop.com/v1";

function isStubMode(): boolean {
  return (
    !process.env.WHOP_API_KEY ||
    process.env.WHOP_STUB === "true"
  );
}

function stubId(prefix: string, idempotencyKey: string): string {
  // Make stub IDs deterministic per idempotency key so callers can re-run
  // safely. e.g. stub_topup_3f3a1c8e9d
  let h = 0;
  for (let i = 0; i < idempotencyKey.length; i++) {
    h = (h * 31 + idempotencyKey.charCodeAt(i)) >>> 0;
  }
  return `stub_${prefix}_${h.toString(16).padStart(8, "0")}`;
}

interface WhopFetchInit {
  method: "GET" | "POST";
  body?: Record<string, unknown>;
  idempotencyKey: string;
}

async function whopFetch<T>(path: string, init: WhopFetchInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
    "Content-Type": "application/json",
    "Idempotency-Key": init.idempotencyKey,
  };
  const res = await fetch(url, {
    method: init.method,
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Whop ${path} → ${res.status} ${res.statusText}: ${detail}`);
  }
  return (await res.json()) as T;
}

export async function createTopUp(
  opts: CreateTopUpOptions,
): Promise<WhopTopUpResult> {
  const currency = opts.currency ?? "USD";
  if (isStubMode()) {
    return {
      whopEventId: stubId("topup", opts.idempotencyKey),
      amountCents: opts.amountCents,
      currency,
      status: "succeeded",
      stubbed: true,
    };
  }
  const data = await whopFetch<{
    id: string;
    amount_cents: number;
    currency: string;
    status: WhopTopUpResult["status"];
  }>("/payments", {
    method: "POST",
    idempotencyKey: opts.idempotencyKey,
    body: {
      user_id: opts.userId,
      amount_cents: opts.amountCents,
      currency,
      purpose: "wallet_top_up",
    },
  });
  return {
    whopEventId: data.id,
    amountCents: data.amount_cents,
    currency: data.currency,
    status: data.status,
    stubbed: false,
  };
}

export async function openHold(
  opts: CreateHoldOptions,
): Promise<WhopHoldResult> {
  const currency = opts.currency ?? "USD";
  if (isStubMode()) {
    return {
      whopHoldId: stubId("hold", opts.idempotencyKey),
      amountCents: opts.amountCents,
      currency,
      status: "open",
      stubbed: true,
    };
  }
  const data = await whopFetch<{
    id: string;
    amount_cents: number;
    currency: string;
    status: WhopHoldResult["status"];
  }>("/holds", {
    method: "POST",
    idempotencyKey: opts.idempotencyKey,
    body: {
      user_id: opts.userId,
      amount_cents: opts.amountCents,
      currency,
      reference: `hire:${opts.agentSlug}`,
    },
  });
  return {
    whopHoldId: data.id,
    amountCents: data.amount_cents,
    currency: data.currency,
    status: data.status,
    stubbed: false,
  };
}

export async function releaseHold(
  opts: ReleaseHoldOptions,
): Promise<WhopHoldResult> {
  if (isStubMode()) {
    return {
      whopHoldId: opts.whopHoldId,
      amountCents: 0,
      currency: "USD",
      status: "released",
      stubbed: true,
    };
  }
  const data = await whopFetch<{
    id: string;
    amount_cents: number;
    currency: string;
    status: WhopHoldResult["status"];
  }>(`/holds/${opts.whopHoldId}/release`, {
    method: "POST",
    idempotencyKey: opts.idempotencyKey,
  });
  return {
    whopHoldId: data.id,
    amountCents: data.amount_cents,
    currency: data.currency,
    status: data.status,
    stubbed: false,
  };
}

export const _internal = { isStubMode, stubId };

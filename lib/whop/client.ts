import "server-only";

import {
  whopApiKey,
  whopApiRoot,
  whopBizId,
  whopStubMode,
} from "@/lib/env";

// Thin Whop REST v1 client. Modeled on Overskill's `Whop::Client`
// (~/src/Github/overskill/app/services/whop/client.rb) — Bearer auth, no
// auto-throw on 4xx/5xx, `Idempotency-Key` header for create-style calls.
//
// AUTH: `Authorization: Bearer ${WHOP_API_KEY}` (an `apik_*` or `sk_*` token).
// BASE: `${WHOP_API_BASE_URL}/${WHOP_API_VERSION}` — defaults to
// `https://api.whop.com/api/v1` per docs.whop.com.
//
// We keep the existing helpers (`createTopUp`, `openHold`, `releaseHold`)
// because `lib/wallet/service.ts` depends on them. Real Whop doesn't have a
// 1:1 "wallet top-up" endpoint at this layer (top-ups happen through
// checkout flows), so those continue to operate in stub mode for the wallet
// ledger today — the ledger row is durable, and the real money trail is the
// Whop payments / checkout flow added in this slice.
//
// NEW in Slice 5: real `getCompany`, `listPayments`, `createCheckoutConfiguration`,
// and `createAffiliate` against the AIaaS biz (`biz_9fbStuuVdEBhN9`).

// ============================================================================
// Existing wallet stubs (preserved API)
// ============================================================================

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

function isStubMode(): boolean {
  return whopStubMode();
}

function stubId(prefix: string, idempotencyKey: string): string {
  let h = 0;
  for (let i = 0; i < idempotencyKey.length; i++) {
    h = (h * 31 + idempotencyKey.charCodeAt(i)) >>> 0;
  }
  return `stub_${prefix}_${h.toString(16).padStart(8, "0")}`;
}

export async function createTopUp(
  opts: CreateTopUpOptions,
): Promise<WhopTopUpResult> {
  // Top-ups on real Whop are a checkout flow, not a single API call. The
  // wallet ledger still tracks them; we mint a deterministic id from the
  // idempotency key so the row is unique. When we add the embedded
  // checkout, this will gain a real Whop payment id.
  const currency = opts.currency ?? "USD";
  return {
    whopEventId: stubId("topup", opts.idempotencyKey),
    amountCents: opts.amountCents,
    currency,
    status: "succeeded",
    stubbed: true,
  };
}

export async function openHold(
  opts: CreateHoldOptions,
): Promise<WhopHoldResult> {
  const currency = opts.currency ?? "USD";
  return {
    whopHoldId: stubId("hold", opts.idempotencyKey),
    amountCents: opts.amountCents,
    currency,
    status: "open",
    stubbed: true,
  };
}

export async function releaseHold(
  opts: ReleaseHoldOptions,
): Promise<WhopHoldResult> {
  return {
    whopHoldId: opts.whopHoldId,
    amountCents: 0,
    currency: "USD",
    status: "released",
    stubbed: true,
  };
}

// ============================================================================
// Real REST v1 surface (new in Slice 5)
// ============================================================================

export class WhopApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "WhopApiError";
  }
}

export class WhopNotConfiguredError extends Error {
  constructor(message = "Whop is not configured (WHOP_API_KEY missing).") {
    super(message);
    this.name = "WhopNotConfiguredError";
  }
}

export interface WhopCompany {
  id: string;
  title: string;
  route?: string;
  description?: string;
  image_url?: string;
  verified?: boolean;
  created_at?: string;
  raw: Record<string, unknown>;
}

export interface WhopPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at?: string;
  raw: Record<string, unknown>;
}

export interface WhopCheckoutConfiguration {
  id: string;
  url: string;
  raw: Record<string, unknown>;
}

export interface WhopAffiliate {
  id: string;
  raw: Record<string, unknown>;
}

interface RequestInit {
  method: "GET" | "POST" | "PATCH";
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, string | number | undefined>;
  idempotencyKey?: string;
}

async function request<T>(init: RequestInit): Promise<T> {
  const key = whopApiKey();
  if (!key) throw new WhopNotConfiguredError();
  const url = new URL(`${whopApiRoot()}${init.path}`);
  if (init.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    "User-Agent": "aiaas-web/0.1 (+https://aiaas.com)",
  };
  if (init.body) headers["Content-Type"] = "application/json";
  if (init.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey;

  const res = await fetch(url.toString(), {
    method: init.method,
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const text = await res.text();
  let parsed: unknown = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
  }
  if (!res.ok) {
    throw new WhopApiError(
      `Whop ${init.method} ${init.path} → ${res.status}`,
      res.status,
      parsed,
    );
  }
  return parsed as T;
}

/**
 * Fetch a company (`biz_xxx`) by id. The AIaaS biz is `biz_9fbStuuVdEBhN9`
 * — verify against this value to detect routing mistakes early.
 */
export async function getCompany(companyId?: string): Promise<WhopCompany> {
  const id = companyId ?? whopBizId();
  if (!id) {
    throw new WhopNotConfiguredError(
      "getCompany requires either an explicit companyId or WHOP_BIZ_ID env.",
    );
  }
  const raw = await request<Record<string, unknown>>({
    method: "GET",
    path: `/companies/${id}`,
  });
  return {
    id: String(raw.id ?? id),
    title: String(raw.title ?? raw.name ?? ""),
    route: typeof raw.route === "string" ? raw.route : undefined,
    description:
      typeof raw.description === "string" ? raw.description : undefined,
    image_url: typeof raw.image_url === "string" ? raw.image_url : undefined,
    verified: Boolean(raw.verified),
    created_at:
      typeof raw.created_at === "string" ? raw.created_at : undefined,
    raw,
  };
}

interface ListPaymentsOptions {
  companyId?: string;
  first?: number;
  after?: string;
  status?: string;
}

interface PaymentsListResponse {
  data?: Array<Record<string, unknown>>;
  page_info?: { has_next_page?: boolean; end_cursor?: string };
}

export async function listPayments(
  opts: ListPaymentsOptions = {},
): Promise<{ payments: WhopPayment[]; endCursor?: string; hasNext: boolean }> {
  const cid = opts.companyId ?? whopBizId();
  if (!cid) throw new WhopNotConfiguredError("listPayments requires WHOP_BIZ_ID.");
  const raw = await request<PaymentsListResponse>({
    method: "GET",
    path: "/payments",
    query: {
      company_id: cid,
      first: opts.first,
      after: opts.after,
      status: opts.status,
    },
  });
  const payments: WhopPayment[] = (raw.data ?? []).map((row) => ({
    id: String(row.id),
    amount: Number(row.final_amount ?? row.amount ?? 0),
    currency: String(row.currency ?? "usd"),
    status: String(row.status ?? "unknown"),
    created_at:
      typeof row.created_at === "string" ? row.created_at : undefined,
    raw: row,
  }));
  return {
    payments,
    endCursor: raw.page_info?.end_cursor,
    hasNext: Boolean(raw.page_info?.has_next_page),
  };
}

interface CreateCheckoutConfigInput {
  planId: string;
  redirectUrl: string;
  metadata?: Record<string, unknown>;
  affiliateCode?: string;
  allowPromoCodes?: boolean;
  currency?: string;
}

/**
 * Create a Whop checkout configuration for an existing plan. Returns the
 * URL the buyer should visit to complete the purchase. See Overskill
 * `Whop::Client#create_checkout_configuration` for the full payload notes.
 */
export async function createCheckoutConfiguration(
  input: CreateCheckoutConfigInput,
): Promise<WhopCheckoutConfiguration> {
  if (!input.planId) throw new Error("planId required");
  if (!input.redirectUrl) throw new Error("redirectUrl required");
  const body: Record<string, unknown> = {
    mode: "payment",
    plan_id: input.planId,
    redirect_url: input.redirectUrl,
  };
  if (input.metadata) body.metadata = input.metadata;
  if (input.affiliateCode) body.affiliate_code = input.affiliateCode;
  if (input.allowPromoCodes !== undefined) body.allow_promo_codes = input.allowPromoCodes;
  if (input.currency) body.currency = input.currency;

  const raw = await request<Record<string, unknown>>({
    method: "POST",
    path: "/checkout_configurations",
    body,
  });
  return {
    id: String(raw.id ?? ""),
    url:
      typeof raw.purchase_url === "string"
        ? raw.purchase_url
        : typeof raw.url === "string"
          ? raw.url
          : "",
    raw,
  };
}

interface CreateAffiliateInput {
  userIdentifier: string; // email, username, or user_xxx
  companyId?: string;
}

export async function createAffiliate(
  input: CreateAffiliateInput,
): Promise<WhopAffiliate> {
  const cid = input.companyId ?? whopBizId();
  if (!cid)
    throw new WhopNotConfiguredError(
      "createAffiliate requires WHOP_BIZ_ID or an explicit companyId.",
    );
  const raw = await request<Record<string, unknown>>({
    method: "POST",
    path: "/affiliates",
    body: {
      company_id: cid,
      user_identifier: input.userIdentifier,
    },
  });
  return { id: String(raw.id ?? ""), raw };
}

export const _internal = { isStubMode, stubId };

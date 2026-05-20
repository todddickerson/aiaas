import "server-only";

import { whopBizId, whopStubMode } from "@/lib/env";
import { getCompany, type WhopCompany } from "@/lib/whop/client";

export interface BizInfo {
  bizId: string;
  title: string;
  route?: string;
  verified: boolean;
  stubbed: boolean;
}

const FALLBACK: BizInfo = {
  bizId: "biz_aiaas_stub",
  title: "AIaaS",
  route: "/aiaas",
  verified: false,
  stubbed: true,
};

let cached: { value: BizInfo; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

/**
 * Fetch (and cache, for 60s) the Whop company metadata for the configured
 * `WHOP_BIZ_ID`. Falls back to a static stub when stub mode is active or
 * the API call fails — never throws, so callers can render it directly.
 */
export async function getBizInfo(): Promise<BizInfo> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const id = whopBizId();
  if (whopStubMode() || !id) {
    cached = { value: FALLBACK, expiresAt: Date.now() + CACHE_TTL_MS };
    return FALLBACK;
  }
  try {
    const company: WhopCompany = await getCompany(id);
    const info: BizInfo = {
      bizId: company.id,
      title: company.title || "AIaaS",
      route: company.route,
      verified: company.verified ?? false,
      stubbed: false,
    };
    cached = { value: info, expiresAt: Date.now() + CACHE_TTL_MS };
    return info;
  } catch {
    cached = { value: FALLBACK, expiresAt: Date.now() + CACHE_TTL_MS };
    return FALLBACK;
  }
}

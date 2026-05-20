import { NextResponse } from "next/server";

import { getBalance } from "@/lib/wallet/service";

export const runtime = "nodejs";
export const maxDuration = 10;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const currency = url.searchParams.get("currency") ?? "USD";
  if (!userId) {
    return NextResponse.json(
      { error: "missing_user", message: "userId query param is required." },
      { status: 400 },
    );
  }
  try {
    const balance = await getBalance(userId, currency);
    return NextResponse.json(balance, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Balance lookup failed.";
    return NextResponse.json(
      { error: "balance_failed", message: msg },
      { status: 500 },
    );
  }
}

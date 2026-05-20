"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";

const STORAGE_KEY = "aiaas:wallet:user-id";
const ANON_PREFIX = "anon-";

function readOrCreateAnonId(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const id =
    ANON_PREFIX +
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2, 14));
  window.localStorage.setItem(STORAGE_KEY, id);
  return id;
}

function fmtMoney(cents: number, currency = "USD"): string {
  const dollars = cents / 100;
  if (currency === "USD") {
    return dollars >= 1000
      ? `$${(dollars / 1000).toFixed(1)}k`
      : `$${dollars.toFixed(2)}`;
  }
  return `${dollars.toFixed(2)} ${currency}`;
}

export function WalletBalance() {
  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = readOrCreateAnonId();
    if (!userId) return;
    let cancelled = false;
    fetch(`/api/v1/wallet/balance?userId=${encodeURIComponent(userId)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`balance ${r.status}`);
        return r.json();
      })
      .then((data: { balanceCents: number }) => {
        if (cancelled) return;
        setBalanceCents(data.balanceCents);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "unreachable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <button
      type="button"
      // TODO Slice C: open top-up modal
      onClick={async () => {
        const userId = readOrCreateAnonId();
        if (!userId) return;
        try {
          const res = await fetch("/api/v1/wallet/top-up", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              userId,
              amountCents: 5000,
              idempotencyKey: `top-up:${userId}:${Date.now()}`,
            }),
          });
          if (!res.ok) throw new Error(`top-up ${res.status}`);
          const data = (await res.json()) as { balanceCents: number };
          setBalanceCents(data.balanceCents);
        } catch (err) {
          setError(err instanceof Error ? err.message : "top-up failed");
        }
      }}
      data-testid="wallet-balance"
      className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-foreground transition-colors hover:border-foreground sm:inline-flex"
      style={{ fontFamily: "var(--font-mono)" }}
      title={error ?? "Click to add $50 (stub top-up)"}
    >
      <Wallet className="size-3.5" aria-hidden style={{ color: "var(--accent)" }} />
      <span data-testid="wallet-balance-amount">
        {balanceCents === null ? "—" : fmtMoney(balanceCents)}
      </span>
    </button>
  );
}

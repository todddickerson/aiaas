"use client";

import { Settings2, X } from "lucide-react";
import { useState } from "react";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import {
  ACCENTS,
  ACCENT_KEYS,
  MODE_KEYS,
  VARIANTS,
  VARIANT_KEYS,
  type AccentKey,
  type ModeKey,
  type VariantKey,
} from "@/lib/theme";

/** Dev-only theme dial. Mounted from app/page.tsx only when NODE_ENV !== 'production'. */
export function TweaksPanel() {
  const { mode, accent, variant, setMode, setAccent, setVariant } = useTheme();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="tweaks-open"
        aria-label="Open theme tweaks"
        className="fixed bottom-4 left-4 z-50 flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-colors hover:bg-secondary"
      >
        <Settings2 className="size-4" aria-hidden />
      </button>
    );
  }

  return (
    <div
      data-testid="tweaks-panel"
      className="fixed bottom-4 left-4 z-50 w-72 rounded-xl border border-border bg-card p-4 text-foreground shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
    >
      <div className="mb-3 flex items-center justify-between">
        <div
          className="text-base font-bold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Tweaks
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close tweaks"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <Row label="Accent">
        <div className="flex gap-1.5">
          {ACCENT_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setAccent(k as AccentKey)}
              aria-label={ACCENTS[k as AccentKey].name}
              data-testid={`tweak-accent-${k}`}
              data-active={accent === k}
              className={cn(
                "size-6 rounded-full transition-shadow",
                accent === k && "ring-2 ring-foreground ring-offset-2 ring-offset-card",
              )}
              style={{ background: ACCENTS[k as AccentKey].hex }}
            />
          ))}
        </div>
      </Row>

      <Row label="Mode">
        <div className="flex gap-1.5">
          {MODE_KEYS.map((m) => (
            <Pill
              key={m}
              active={mode === m}
              onClick={() => setMode(m as ModeKey)}
              testId={`tweak-mode-${m}`}
            >
              {m}
            </Pill>
          ))}
        </div>
      </Row>

      <Row label="Card variant">
        <div className="flex flex-wrap gap-1.5">
          {VARIANT_KEYS.map((v) => (
            <Pill
              key={v}
              active={variant === v}
              onClick={() => setVariant(v as VariantKey)}
              testId={`tweak-variant-${v}`}
            >
              {VARIANTS[v as VariantKey].name}
            </Pill>
          ))}
        </div>
      </Row>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 last:mb-0">
      <div
        className="mb-1.5 text-[9.5px] uppercase tracking-[1px] text-muted-foreground"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      data-active={active}
      className={cn(
        "rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}

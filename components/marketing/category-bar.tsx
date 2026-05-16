"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/seed";
import { SORT_LABELS, type Sort } from "@/lib/types";

const SORTS: Sort[] = SORT_LABELS.map(([k]) => k);

export interface CategoryBarProps {
  cat: string;
  sort: Sort;
}

export function CategoryBar({ cat, sort }: CategoryBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const setParam = useCallback(
    (key: "cat" | "sort", value: string, defaultValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === defaultValue) params.delete(key);
      else params.set(key, value);
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}#marketplace` : `${pathname}#marketplace`, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  return (
    <div
      id="marketplace"
      className="border-y border-border bg-card"
      data-testid="category-bar"
    >
      <div className="mx-auto flex max-w-[1360px] flex-col gap-3 px-4 py-3.5 md:flex-row md:flex-wrap md:items-center md:gap-4 md:px-8">
        <div
          className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible md:pb-0"
          role="tablist"
          aria-label="Filter by category"
        >
          {CATEGORIES.map((c) => {
            const active = cat === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`cat-${c.id}`}
                data-active={active}
                onClick={() => setParam("cat", c.id, "all")}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {c.label}
                <span
                  className="text-[10px] opacity-70"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="-mx-1 flex items-center gap-3 overflow-x-auto px-1 pb-1 md:ml-auto md:pb-0">
          <span
            className="text-[10px] tracking-[1px] text-text-faint"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            SORT
          </span>
          {SORT_LABELS.map(([k, l]) => {
            const active = sort === k;
            return (
              <button
                key={k}
                type="button"
                data-testid={`sort-${k}`}
                data-active={active}
                onClick={() => setParam("sort", k, "trending")}
                className={cn(
                  "shrink-0 whitespace-nowrap border-b py-[3px] text-xs transition-colors",
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const SORT_KEYS = SORTS;

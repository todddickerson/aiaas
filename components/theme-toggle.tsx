"use client";

import { Moon, Palette, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { ACCENTS } from "@/lib/theme";

export function ThemeToggle() {
  const { mode, accent, cycle } = useTheme();
  const ModeIcon = mode === "dark" ? Moon : Sun;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={cycle}
      data-testid="theme-toggle"
      aria-label={`Theme: ${ACCENTS[accent].name} ${mode}. Click to cycle.`}
      className="gap-2"
    >
      <Palette className="size-4" aria-hidden />
      <span className="font-medium">{ACCENTS[accent].name}</span>
      <ModeIcon className="size-4" aria-hidden />
    </Button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ACCENTS = [
  { key: "blue", label: "Cobalt", swatch: "oklch(0.5 0.21 263)" },
  { key: "clay", label: "Clay", swatch: "oklch(0.58 0.125 40)" },
  { key: "neutral", label: "Neutral", swatch: "oklch(0.35 0 0)" },
  { key: "violet", label: "Violet", swatch: "oklch(0.54 0.24 293)" },
  { key: "green", label: "Green", swatch: "oklch(0.57 0.15 156)" },
  { key: "rose", label: "Rose", swatch: "oklch(0.58 0.22 15)" },
  { key: "amber", label: "Amber", swatch: "oklch(0.77 0.16 75)" },
] as const;

const DEFAULT_ACCENT = "blue";

function applyAccent(key: string) {
  // Always set the attribute (including "neutral") so each theme — blue
  // included — is an explicit, self-contained choice rather than the base.
  document.documentElement.setAttribute("data-accent", key);
}

export function AccentPicker() {
  const [accent, setAccent] = useState<string>(DEFAULT_ACCENT);

  useEffect(() => {
    const saved = localStorage.getItem("accent") || DEFAULT_ACCENT;
    setAccent(saved);
    applyAccent(saved);
  }, []);

  function choose(key: string) {
    setAccent(key);
    localStorage.setItem("accent", key);
    applyAccent(key);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9">
          <Palette className="size-4" />
          <span className="sr-only">Accent colour</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Accent colour</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ACCENTS.map((a) => (
          <DropdownMenuItem key={a.key} onClick={() => choose(a.key)}>
            <span
              className="size-4 rounded-full border"
              style={{ backgroundColor: a.swatch }}
            />
            {a.label}
            {accent === a.key && <Check className="ml-auto size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

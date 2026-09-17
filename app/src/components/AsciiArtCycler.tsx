"use client";

import { useEffect, useMemo, useState } from "react";

const MIN_HOLD_MS = 5000;
const MAX_HOLD_MS = 10000;
const TICK_MS = 30;

type Grid = { width: number; height: number; frames: string[][] };

// Normalize every frame to a common grid (pad to max width/height).
function normalize(frames: string[]): Grid {
  const lineSets = frames.map((f) => f.replace(/\r/g, "").split("\n"));
  const height = Math.max(...lineSets.map((ls) => ls.length));
  const width = Math.max(...lineSets.flat().map((l) => [...l].length));
  const flatFrames = lineSets.map((ls) => {
    const flat: string[] = [];
    for (let r = 0; r < height; r++) {
      const chars = [...(ls[r] ?? "")];
      while (chars.length < width) chars.push(" ");
      for (let c = 0; c < width; c++) flat.push(chars[c]);
    }
    return flat;
  });
  return { width, height, frames: flatFrames };
}

function render(flat: string[], width: number, height: number): string {
  let s = "";
  for (let r = 0; r < height; r++) {
    s += flat.slice(r * width, (r + 1) * width).join("");
    if (r < height - 1) s += "\n";
  }
  return s;
}

/**
 * Renders two ASCII-art variants (a base glyph and its alternate) and lets every
 * character independently flip between the two at its own random interval, so the
 * art shimmers as individual characters transform one-by-one over time rather
 * than the whole image morphing together.
 */
export function AsciiArtCycler({ frames }: { frames: string[] }) {
  const grid = useMemo(() => normalize(frames), [frames]);
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const { width, height, frames: g } = grid;
    if (g.length === 0) return;
    const total = width * height;
    let disposed = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    // Two variants per cell (frame A vs frame D). Cells whose glyphs match in
    // both variants never change, so we leave them at Infinity (never flip).
    const current = [...g[0]];
    const nextFlip = new Array<number>(total).fill(Infinity);
    const startTime = performance.now();
    const randomHold = () => MIN_HOLD_MS + Math.random() * (MAX_HOLD_MS - MIN_HOLD_MS);

    if (g.length >= 2) {
      for (let i = 0; i < total; i++) {
        if (g[0][i] !== g[1][i]) nextFlip[i] = Math.random() * MAX_HOLD_MS;
      }
    }

    setDisplay(render(current, width, height));

    interval = setInterval(() => {
      if (disposed) return;
      const elapsed = performance.now() - startTime;
      let changed = false;
      for (let i = 0; i < total; i++) {
        if (nextFlip[i] <= elapsed) {
          current[i] = current[i] === g[0][i] ? g[1][i] : g[0][i];
          nextFlip[i] = elapsed + randomHold();
          changed = true;
        }
      }
      if (changed) setDisplay(render(current, width, height));
    }, TICK_MS);

    return () => {
      disposed = true;
      if (interval) clearInterval(interval);
    };
  }, [grid]);

  return <pre className="text-[6px] leading-[0.75] text-white sm:text-[7px]">{display}</pre>;
}

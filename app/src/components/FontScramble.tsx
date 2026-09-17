"use client";

import { useEffect, useState } from "react";

// A mix of legible system fonts plus the loaded VT323 pixel font. The
// characters never change — only which of these fonts each letter is rendered in.
const FONTS: string[] = [
  "var(--font-vt323), monospace",
  '"Courier New", Courier, monospace',
  "Georgia, 'Times New Roman', serif",
  "Arial, Helvetica, sans-serif",
  "'Trebuchet MS', 'Trebuchet', sans-serif",
  "Verdana, Geneva, sans-serif",
  "'Comic Sans MS', 'Comic Sans', cursive",
  "Impact, 'Arial Black', sans-serif",
  "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
  "'Lucida Console', Monaco, monospace",
  "Tahoma, Geneva, sans-serif",
  "'Gill Sans', 'Gill Sans MT', sans-serif",
];

function pickFont(exclude?: string): string {
  const start = Math.floor(Math.random() * FONTS.length);
  for (let i = 0; i < FONTS.length; i++) {
    const font = FONTS[(start + i) % FONTS.length];
    if (font !== exclude) return font;
  }
  return FONTS[0];
}

type FontScrambleProps = {
  text: string;
  intervalMs?: number;
  className?: string;
};

/**
 * Renders `text` with the letters fixed, but each letter's font-family
 * continuously cycling through random (legible) fonts — forever.
 */
export function FontScramble({ text, intervalMs = 60, className = "" }: FontScrambleProps) {
  const chars = Array.from(text);
  // Deterministic initial value so server/client hydration match; randomize in the effect.
  const [fonts, setFonts] = useState<string[]>(() => chars.map(() => FONTS[0]));

  useEffect(() => {
    setFonts(chars.map(() => pickFont()));
    const id = setInterval(() => {
      setFonts((prev) => prev.map((font) => pickFont(font)));
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, text]);

  return (
    <span className={className} aria-label={text}>
      {chars.map((char, i) => (
        <span key={i} aria-hidden="true" style={{ fontFamily: fonts[i] }}>
          {char}
        </span>
      ))}
    </span>
  );
}

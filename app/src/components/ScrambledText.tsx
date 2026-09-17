"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

type ScrambledTextProps = {
  as?: "p" | "h1" | "h2" | "h3" | "h4" | "span" | "div";
  radius?: number;
  duration?: number;
  speed?: number;
  scrambleChars?: string;
  className?: string;
  style?: React.CSSProperties;
  children: string;
};

/**
 * Dependency-free "scramble on hover" text.
 *
 * Characters within `radius` px of the pointer are temporarily swapped for
 * random characters from `scrambleChars`, then settle back. No GSAP required —
 * a single interval + cached character positions drive the effect.
 *
 * Expects plain ASCII text via `children`.
 */
export default function ScrambledText({
  as: Tag = "p",
  radius = 100,
  duration = 1,
  speed = 0.5,
  scrambleChars = ".:",
  className = "",
  style,
  children,
}: ScrambledTextProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const charElsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const positionsRef = useRef<{ x: number; y: number; w: number; h: number }[]>([]);
  const untilRef = useRef<number[]>([]);

  const raw = useMemo(() => Array.from(children), [children]);
  // Keep real spaces so `white-space: pre-wrap` can wrap normally.
  const display = raw;
  const pool = useMemo(() => Array.from(scrambleChars), [scrambleChars]);

  const cache = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const r = root.getBoundingClientRect();
    const arr: { x: number; y: number; w: number; h: number }[] = new Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      const el = charElsRef.current[i];
      if (!el) {
        arr[i] = { x: 0, y: 0, w: 0, h: 0 };
        continue;
      }
      const er = el.getBoundingClientRect();
      arr[i] = { x: er.left - r.left, y: er.top - r.top, w: er.width, h: er.height };
    }
    positionsRef.current = arr;
  }, [raw.length]);

  useEffect(() => {
    untilRef.current = new Array(raw.length).fill(0);
    cache();
  }, [raw.length, cache]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => cache());
    ro.observe(root);
    return () => ro.disconnect();
  }, [cache]);

  const handleMove = useCallback(
    (e: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const r = root.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      const now = performance.now();
      for (let i = 0; i < positionsRef.current.length; i++) {
        const p = positionsRef.current[i];
        const dx = cx - (p.x + p.w / 2);
        const dy = cy - (p.y + p.h / 2);
        const dist = Math.hypot(dx, dy);
        if (dist < radius) {
          const t = duration * (1 - dist / radius) * 1000;
          untilRef.current[i] = Math.max(untilRef.current[i], now + t);
        }
      }
    },
    [radius, duration],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.addEventListener("pointermove", handleMove);
    return () => root.removeEventListener("pointermove", handleMove);
  }, [handleMove]);

  useEffect(() => {
    const tick = Math.max(25, speed * 80);
    const id = setInterval(() => {
      const now = performance.now();
      for (let i = 0; i < raw.length; i++) {
        const el = charElsRef.current[i];
        if (!el || raw[i] === " ") continue;
        if (now < untilRef.current[i]) {
          el.textContent = pool[Math.floor(Math.random() * pool.length)];
        } else if (el.textContent !== display[i]) {
          el.textContent = display[i];
        }
      }
    }, tick);
    return () => clearInterval(id);
  }, [pool, display, raw, speed]);

  return (
    <div ref={rootRef} className={`scramble-text ${className}`} style={style}>
      <Tag className="scramble-text-inner">
        {display.map((c, i) => (
          <span
            key={i}
            className="scramble-char"
            ref={(el) => {
              charElsRef.current[i] = el;
            }}
          >
            {c}
          </span>
        ))}
      </Tag>
    </div>
  );
}

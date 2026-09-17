"use client";

import { useEffect, useRef } from "react";
import { useReadContract } from "wagmi";
import { NFT_ABI, NFT_ADDRESS, PALETTE } from "@/lib/contracts";

function hexToBytes(hex: string): number[] {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes: number[] = [];
  for (let i = 0; i + 1 < clean.length; i += 2) {
    bytes.push(parseInt(clean.substring(i, i + 2), 16));
  }
  return bytes;
}

// Braille dot bits (0..7) -> (dx, dy) within a 2x4 cell.
const DOTS: [number, number][] = [
  [0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [0, 3], [1, 3],
];

/**
 * Renders a token's braille art from on-chain artData. When `interactive`, the
 * dots smoothly (ease-out) repel away from the cursor.
 */
export function AsciiArt({
  tokenId,
  size = 300,
  interactive = false,
}: {
  tokenId: bigint;
  size?: number;
  interactive?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<{ x: number; y: number } | null>(null);

  const { data } = useReadContract({
    address: NFT_ADDRESS,
    abi: NFT_ABI,
    functionName: "artData",
    args: [tokenId],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const [artHex, width, height, colorIdx] = data as [string, number, number, number];
    const bytes = hexToBytes(artHex);
    const color = PALETTE[colorIdx] ?? "#ffffff";

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cols = width * 2;
    const rows = height * 4;
    const cssW = size;
    const cssH = (size * rows) / cols;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cellW = cssW / cols;
    const cellH = cssH / rows;
    const radius = Math.max(1, Math.min(cellW, cellH) * 0.42);

    const pts: { x: number; y: number; r: number }[] = [];
    for (let c = 0; c < width; c++) {
      for (let r = 0; r < height; r++) {
        const v = bytes[r * width + c] ?? 0;
        for (let b = 0; b < 8; b++) {
          if ((v >> b) & 1) {
            const [dx, dy] = DOTS[b];
            pts.push({
              x: (c * 2 + dx + 0.5) * cellW,
              y: (r * 4 + dy + 0.5) * cellH,
              r: radius,
            });
          }
        }
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = color;
      const hover = hoverRef.current;
      for (const p of pts) {
        let x = p.x;
        let y = p.y;
        if (interactive && hover) {
          const dx = x - hover.x;
          const dy = y - hover.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const repel = Math.max(0, 48 - dist) * 0.55;
          x += (dx / dist) * repel;
          y += (dy / dist) * repel;
        }
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (interactive) {
      let raf = 0;
      const loop = () => {
        render();
        raf = requestAnimationFrame(loop);
      };
      loop();
      return () => cancelAnimationFrame(raf);
    }

    render();
  }, [data, size, interactive]);

  return (
    <canvas
      ref={canvasRef}
      onPointerMove={(e) => {
        if (!interactive) return;
        const rect = e.currentTarget.getBoundingClientRect();
        hoverRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }}
      onPointerLeave={() => {
        hoverRef.current = null;
      }}
      className="block select-none bg-black"
      aria-label={`Glyph #${tokenId.toString()}`}
    />
  );
}

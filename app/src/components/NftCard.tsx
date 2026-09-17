"use client";

import type { ReactNode } from "react";
import { AsciiArt } from "./AsciiArt";
import { CrtTv } from "./CrtTv";

export function NftCard({
  tokenId,
  size = 220,
  children,
}: {
  tokenId: bigint;
  size?: number;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-panel p-3 transition hover:border-neon/40">
      <CrtTv>
        <AsciiArt tokenId={tokenId} size={size} />
      </CrtTv>
      <div className="mt-3 flex w-full items-center justify-between">
        <span className="font-mono text-sm text-white/70">#{tokenId.toString()}</span>
        {children}
      </div>
    </div>
  );
}

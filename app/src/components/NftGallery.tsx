"use client";

import { useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import {
  COLOR_COUNT,
  COLOR_NAMES,
  NFT_ABI,
  NFT_ADDRESS,
  PALETTE,
} from "@/lib/contracts";
import { robinhood } from "@/lib/chains";
import { AsciiArt } from "./AsciiArt";
import { NftCard } from "./NftCard";

const ZERO = "0x0000000000000000000000000000000000000000";

/** Reads the connected wallet's NFTs and shows them as CRT-framed cards. */
export function NftGallery() {
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [selected, setSelected] = useState<bigint | null>(null);

  const user = (address ?? ZERO) as `0x${string}`;

  const { data: balance } = useReadContract({
    address: NFT_ADDRESS,
    abi: NFT_ABI,
    functionName: "balanceOf",
    args: [user],
  });
  const balanceNum = Number(balance ?? 0);

  const { data: idsData } = useReadContracts({
    contracts: Array.from({ length: balanceNum }, (_, i) => ({
      address: NFT_ADDRESS,
      abi: NFT_ABI,
      functionName: "tokenOfOwnerByIndex",
      args: [user, BigInt(i)],
    })),
  });

  const ownedIds = useMemo(
    () => (idsData ?? []).map((r) => (r.result ?? 0n) as bigint),
    [idsData],
  );

  const { writeContractAsync, isPending } = useWriteContract();

  async function mint() {
    await writeContractAsync({
      address: NFT_ADDRESS,
      abi: NFT_ABI,
      functionName: "mint",
    });
  }

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-white/10 bg-panel p-10 text-center">
        <p className="font-mono text-neon glow-green">$ connect wallet _</p>
        <p className="mt-4 text-white/70">Connect a wallet to view and mint NFTs.</p>
      </div>
    );
  }

  if (chain && chain.id !== robinhood.id) {
    return (
      <div className="rounded-2xl border border-white/10 bg-panel p-10 text-center">
        <p className="text-white/70">Switch to Robinhood to view your NFTs.</p>
        <button
          onClick={() => switchChain({ chainId: robinhood.id })}
          className="mt-4 rounded-lg bg-white px-5 py-2 text-lg text-black transition hover:bg-white/80"
        >
          Switch network
        </button>
      </div>
    );
  }

  const selectedIdx = selected != null ? Number(selected % BigInt(COLOR_COUNT)) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-6xl">{balanceNum}</span>
          <div className="mt-2 font-mono text-sm uppercase tracking-widest text-white/60">
            {balanceNum === 1 ? "glyph owned" : "glyphs owned"}
          </div>
        </div>
        <button
          onClick={mint}
          disabled={isPending}
          className="rounded-lg bg-white px-5 py-2 text-lg text-black transition hover:bg-white/80 disabled:opacity-40"
        >
          {isPending ? "Minting..." : "Mint"}
        </button>
      </div>

      {ownedIds.length === 0 ? (
        <p className="border border-dashed border-white/10 p-10 text-center text-white/40">
          No NFTs yet. Hit Mint to create one.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ownedIds.map((id) => (
            <button key={id.toString()} onClick={() => setSelected(id)} className="text-left">
              <NftCard tokenId={id} />
            </button>
          ))}
        </div>
      )}

      {selected != null && (
        <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-panel p-6 md:flex-row">
          <div className="w-full md:w-1/2">
            <AsciiArt tokenId={selected} size={280} interactive />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl text-white">Glyph #{selected.toString()}</h2>
            <dl className="mt-6 space-y-2 font-mono text-sm">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <dt className="text-white/50">Color</dt>
                <dd className="capitalize text-white">{COLOR_NAMES[selectedIdx]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/50">Hex</dt>
                <dd className="text-white">{PALETTE[selectedIdx]}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

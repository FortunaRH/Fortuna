"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import DecryptedText from "./DecryptedText";

function short(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="border border-white/30 px-3 py-1.5 text-sm text-white">
          {short(address)}
        </span>
        <button
          onClick={() => disconnect()}
          className="border border-white/20 px-3 py-1.5 text-sm text-white/60 transition hover:border-white/50 hover:text-white"
        >
          <DecryptedText text="Disconnect" speed={50} maxIterations={5} sequential encryptedClassName="opacity-40" />
        </button>
      </div>
    );
  }

  return (
    <button
      disabled={isPending || connectors.length === 0}
      onClick={() => connect({ connector: connectors[0] })}
      className="bg-white px-5 py-2 text-sm text-black transition hover:bg-white/80 disabled:opacity-50"
    >
      {isPending ? (
        "Connecting..."
      ) : connectors.length === 0 ? (
        "No wallet found"
      ) : (
        <DecryptedText text="Connect wallet" speed={50} maxIterations={5} sequential encryptedClassName="opacity-50" />
      )}
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";

// Generates a random 32-hex-char (16-byte) value. Falls back to Math.random in
// non-secure contexts so the demo still runs everywhere.
function randHex(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Simplified FNV-1a hash for the demo only. The real FortunaEntropy contract
// verifies the reveal and mixes the two contributions with keccak256.
function hashHex(hex: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < hex.length; i++) {
    h ^= hex.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Off-chain walkthrough of Fortuna's commit-reveal randomness. No wallet or gas
 * is needed — it demonstrates how a provider's committed secret is revealed,
 * verified, and mixed with your own contribution to produce a fair result.
 */
export function FortunaDemo() {
  const [provider, setProvider] = useState<{ secret: string; commitment: string } | null>(null);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [active, setActive] = useState(0);
  const [userRandom, setUserRandom] = useState("");
  const [mixed, setMixed] = useState("");
  const [result, setResult] = useState<"HEADS" | "TAILS" | null>(null);

  // The provider commits a secret once, up front. Done client-only to avoid a
  // server/client hydration mismatch on the random commitment value.
  useEffect(() => {
    const secret = randHex(16);
    setProvider({ secret, commitment: hashHex(secret) });
    setActive(1);
  }, []);

  async function run() {
    if (!provider || phase === "running") return;
    setPhase("running");
    setActive(1);
    setUserRandom("");
    setMixed("");
    setResult(null);

    await sleep(450);
    const user = randHex(16);
    setUserRandom(user);
    setActive(2);

    await sleep(450);
    setActive(3); // reveal + verify (hash(secret) === commitment)

    await sleep(450);
    const mix = hashHex(user + provider.secret);
    setMixed(mix);
    setActive(4);

    await sleep(450);
    setResult(parseInt(mix, 16) % 2 === 0 ? "HEADS" : "TAILS");
    setPhase("done");
  }

  const running = phase === "running";

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-panel p-8">
      <div className="mb-6 flex min-h-24 items-center justify-center">
        {running && !result ? (
          <span className="animate-pulse font-display text-6xl text-white/40">…</span>
        ) : result ? (
          <div className={`font-display text-6xl ${result === "HEADS" ? "text-neon glow-green" : "text-white"}`}>
            {result}
          </div>
        ) : (
          <span className="font-display text-6xl text-white/20">?</span>
        )}
      </div>

      <ol className="space-y-2.5">
        <Step
          done={active >= 1}
          current={active === 1}
          label="Provider commits a secret"
          value={provider ? `commitment 0x${provider.commitment}` : "…"}
        />
        <Step
          done={active >= 2}
          current={active === 2}
          label="You contribute randomness"
          value={userRandom ? `your rand 0x${userRandom}` : ""}
        />
        <Step
          done={active >= 3}
          current={active === 3}
          label="Provider reveals + verify"
          value={active >= 3 && provider ? `secret 0x${provider.secret}  ✓ matches` : ""}
        />
        <Step
          done={active >= 4}
          current={active === 4}
          label="Mix → result"
          value={mixed ? (result ? `0x${mixed} → ${result}` : `0x${mixed}`) : ""}
        />
      </ol>

      <button
        onClick={run}
        disabled={running || !provider}
        className="mt-6 w-full rounded-lg bg-white px-6 py-3 text-xl text-black transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {running ? "RUNNING..." : "RUN TEST"}
      </button>

      <p className="mt-4 text-center text-xs text-white/40">
        Off-chain demo — no wallet or gas. Real Fortuna verifies the reveal with keccak256 on Robinhood.
      </p>
    </div>
  );
}

function Step({
  done,
  current,
  label,
  value,
}: {
  done: boolean;
  current: boolean;
  label: string;
  value: string;
}) {
  return (
    <li
      className={`flex items-start gap-3 rounded-lg border px-3 py-2 transition-colors ${
        done
          ? "border-neon/40 bg-white/[0.02]"
          : current
            ? "border-white/25"
            : "border-white/5 opacity-60"
      }`}
    >
      <span className={`mt-0.5 w-4 shrink-0 text-center font-mono text-sm ${done ? "text-neon" : "text-white/30"}`}>
        {done ? "✓" : current ? "▸" : "·"}
      </span>
      <div className="min-w-0">
        <div className="text-sm text-white/85">{label}</div>
        {value ? <div className="mt-0.5 break-all font-mono text-xs text-white/50">{value}</div> : null}
      </div>
    </li>
  );
}

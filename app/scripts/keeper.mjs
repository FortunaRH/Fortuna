// Fortuna reveal keeper
// Watches the oracle for Requested events and reveals the next hash-chain
// preimage via revealWithCallback. Run with:
//   node scripts/keeper.mjs
//
// Required env:
//   ORACLE_ADDRESS       FortunaEntropy address
//   PROVIDER_ADDRESS     registered provider address
//   KEEPER_PRIVATE_KEY   keeper hot-wallet private key (0x...)
//   CHAIN_SECRET         hash-chain seed (0x...32 bytes; default 0x1111...)
//   CHAIN_LENGTH         number of reveals in the chain (default 1000)
//   RPC_URL              (default https://rpc.mainnet.chain.robinhood.com)

import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  keccak256,
  parseAbi,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const RPC = process.env.RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com";
const ORACLE = process.env.ORACLE_ADDRESS;
const PROVIDER = process.env.PROVIDER_ADDRESS;
const KEY = process.env.KEEPER_PRIVATE_KEY;
const SECRET = BigInt(process.env.CHAIN_SECRET ?? "0x" + "11".repeat(32));
const LENGTH = Number(process.env.CHAIN_LENGTH ?? 1000);

if (!ORACLE || !PROVIDER || !KEY) {
  console.error("Missing ORACLE_ADDRESS / PROVIDER_ADDRESS / KEEPER_PRIVATE_KEY");
  process.exit(1);
}

const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Mainnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
});

const publicClient = createPublicClient({ chain: robinhood, transport: http(RPC) });
const account = privateKeyToAccount(KEY);
const walletClient = createWalletClient({ chain: robinhood, transport: http(RPC), account });

const ABI = parseAbi([
  "event Requested(uint64 indexed sequenceNumber, address indexed provider, address indexed requester, bytes32 userRandomNumber)",
  "function revealWithCallback(address provider, uint64 sequenceNumber, bytes32 userRandomNumber, bytes32 providerRandomNumber, address target)",
]);

// Build the hash chain: values[0] = seed, values[i] = keccak256(values[i-1]).
// commitment = values[LENGTH]; reveals go values[LENGTH-1], values[LENGTH-2], ...
const values = [];
let v = toHex(SECRET, { size: 32 });
values.push(v);
for (let i = 0; i < LENGTH; i++) {
  v = keccak256(v);
  values.push(v);
}
let idx = LENGTH - 1;

console.log(`commitment (register this on-chain): ${values[LENGTH]}`);
console.log(`watching ${ORACLE} for provider ${PROVIDER}...`);

const unwatch = publicClient.watchContractEvent({
  address: ORACLE,
  abi: ABI,
  eventName: "Requested",
  onLogs: async (logs) => {
    for (const log of logs) {
      const args = log.args;
      if (!args) continue;
      if (args.provider.toLowerCase() !== PROVIDER.toLowerCase()) continue;
      if (idx < 0) {
        console.error("hash chain exhausted — register a new commitment");
        continue;
      }
      const preimage = values[idx];
      try {
        const hash = await walletClient.writeContract({
          address: ORACLE,
          abi: ABI,
          functionName: "revealWithCallback",
          args: [PROVIDER, args.sequenceNumber, args.userRandomNumber, preimage, args.requester],
        });
        idx--;
        console.log(`revealed seq ${args.sequenceNumber} (${hash})`);
      } catch (e) {
        console.error(`reveal failed for seq ${args.sequenceNumber}:`, e?.shortMessage ?? e?.message ?? e);
      }
    }
  },
});

process.on("SIGINT", () => {
  unwatch();
  process.exit(0);
});

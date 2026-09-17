import { defineChain } from "viem";

/**
 * Robinhood mainnet network config.
 * - Chain ID: 4663
 * - Native gas token: ETH (18 decimals).
 */
export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Mainnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com"],
    },
  },
  blockExplorers: {
    default: { name: "RobinScan", url: "https://robinscan.io" },
  },
  testnet: false,
});

export const sepolia = defineChain({
  id: 11155111,
  name: "Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com"],
    },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
  testnet: true,
});

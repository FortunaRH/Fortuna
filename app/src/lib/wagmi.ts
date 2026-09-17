"use client";

import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { robinhood } from "./chains";

export const wagmiConfig = createConfig({
  chains: [robinhood],
  connectors: [injected()],
  transports: {
    [robinhood.id]: http(process.env.NEXT_PUBLIC_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com"),
  },
});

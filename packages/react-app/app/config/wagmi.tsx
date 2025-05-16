"use client";

import { WagmiConfig, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";
import type { ReactNode } from "react";

// Define the custom Celo Alfajores chain using defineChain
const celoAlfajores = defineChain({
  id: 44787,
  name: "Celo Alfajores",
  nativeCurrency: {
    name: "CELO",
    symbol: "CELO",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://alfajores-forno.celo-testnet.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Celo Alfajores Explorer",
      url: "https://celo-alfajores.blockscout.com",
    },
  },
  testnet: true,
});

// Create the Wagmi configuration
const config = createConfig({
  chains: [celoAlfajores],
  transports: {
    [celoAlfajores.id]: http(celoAlfajores.rpcUrls.default.http[0]),
  },
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  ssr: true,
});

// Define the WagmiProvider component
export function WagmiProvider({ children }: { children: ReactNode }) {
  return <WagmiConfig config={config}>{children}</WagmiConfig>;
}

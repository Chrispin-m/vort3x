"use client";

import { WagmiConfig, createClient } from "wagmi";
import { injected } from "wagmi/connectors";
import { ethers } from "ethers";
import type { ReactNode } from "react";

export const celoAlfajores = {
  id: 44787,
  name: "Celo Alfajores",
  network: "alfajores",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://alfajores-forno.celo-testnet.org"] } },
  blockExplorers: {
    default: { name: "CeloScan", url: "https://alfajores.celoscan.io" }
  },
  testnet: true
};

const chains = [celoAlfajores];

const client = createClient({
  autoConnect: true,
  connectors: [
    injected({
      chains,
      options: {
        name: "MiniPay",
        shimDisconnect: true
      }
    })
  ],
  provider: ({ chain }) => {
    const url = chain.rpcUrls.default.http[0];
    return new ethers.providers.JsonRpcProvider(url);
  }
});

export function WagmiProvider({ children }: { children: ReactNode }) {
  return <WagmiConfig client={client}>{children}</WagmiConfig>;
}

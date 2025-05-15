"use client";

import { WagmiConfig, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import type { ReactNode } from "react";

// Celo Alfajores chain definition
export const celoAlfajores = {
  id: 44787,
  name: "Celo Alfajores",
  network: "alfajores",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://alfajores-forno.celo-testnet.org"] }
  },
  blockExplorers: {
    default: { name: "CeloScan", url: "https://alfajores.celoscan.io" }
  },
  testnet: true
};

const chains = [celoAlfajores];

const config = createConfig({
  chains,
  transports: {
    [celoAlfajores.id]: http(celoAlfajores.rpcUrls.default.http[0])
  },
  connectors: [
    injected({ chains, options: { name: "MiniPay", shimDisconnect: true } })
  ],
  autoConnect: true,
  syncConnectedChain: true
});

export function WagmiProvider({ children }: { children: ReactNode }) {
  return <WagmiConfig config={config}>{children}</WagmiConfig>;
}

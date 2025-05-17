"use client";

import { WagmiConfig, createConfig, http, fallback } from "wagmi";
import { injected } from "wagmi/connectors";
import { celoAlfajores, mainnet } from "wagmi/chains";
import type { ReactNode } from "react";

const wagmiConfig = createConfig({
  chains: [celoAlfajores, mainnet],
  connectors: [injected()],
  transports: {
    [celoAlfajores.id]: fallback([
      http("https://alfajores-forno.celo-testnet.org"),
      http()
    ]),
    [mainnet.id]: fallback([
      http("https://eth.llamarpc.com"),
      http()
    ]),
  },
});

export function WagmiProvider({ children }: { children: ReactNode }) {
  return <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>;
}
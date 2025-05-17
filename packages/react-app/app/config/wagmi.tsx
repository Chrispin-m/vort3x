"use client";

import { WagmiConfig, createConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { injected } from "wagmi/connectors";
import { http } from "wagmi";
import { celoAlfajores, mainnet } from "wagmi/chains";
import type { ReactNode } from "react";

const wagmiConfig = createConfig({
  chains: [celoAlfajores, mainnet],
  connectors: [injected()],
  transports: {
    [celoAlfajores.id]: http(),
    [mainnet.id]: http(),
  },
});

export function WagmiProvider({ children }: { children: ReactNode }) {
  return <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>;
}
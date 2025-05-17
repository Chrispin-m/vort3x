"use client";

import { WagmiConfig, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
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
"use client";

import { WagmiConfig, createConfig, http, fallback } from "wagmi";
import { injected } from "wagmi/connectors";
import { celoAlfajores, mainnet } from "wagmi/chains";
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import type { ReactNode } from "react";

const WC_PROJECT_ID = process.env.WC_PROJECT_ID;
if (!WC_PROJECT_ID) {
  throw new Error("WC_PROJECT_ID is missing");
}

const { connectors } = getDefaultWallets({
  appName: "Vort3x Spin",
  projectId: WC_PROJECT_ID,
});

const wagmiConfig = createConfig({
  chains: [celoAlfajores, mainnet],
  connectors: [
    ...connectors,
    injected()
  ],
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

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider>  {/* */}
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
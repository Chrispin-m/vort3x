"use client";

import { WagmiConfig, createConfig, http } from "wagmi";
import { celoAlfajores } from "wagmi/chains";
import { RainbowKitProvider, getDefaultWallets, injected } from "@rainbow-me/rainbowkit";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { wallets } = getDefaultWallets({
  appName: "Vort3x Spin",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
  chains: [celoAlfajores],
});

const config = createConfig({
  autoConnect: true,
  connectors: [
    ...wallets,
    injected({ target: 'minipay' })
  ],
  chains: [celoAlfajores],
  transports: {
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          chain={celoAlfajores}
          coolMode
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}
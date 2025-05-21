"use client";

import { WagmiConfig, createConfig, http } from "wagmi";
import { celoAlfajores } from "wagmi/chains";
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import { injected } from "wagmi/connectors";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { wallets } = getDefaultWallets({
  appName: "mini",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
  chains: [celoAlfajores],
});

const config = createConfig({
  autoConnect: true,
  connectors: [
    ...wallets.map(({ connectors }) => connectors).flat(),
    injected({
      target: "minipay",
      chains: [celoAlfajores],
    }),
  ],
  chains: [celoAlfajores],
  transports: {
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          chains={[celoAlfajores]}
          coolMode
          modalSize="compact"
          showRecentTransactions={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}
"use client";

import { WagmiConfig, createConfig, http, fallback } from "wagmi";
import { celoAlfajores, mainnet } from "wagmi/chains";
import { RainbowKitProvider, getDefaultWallets, darkTheme } from "@rainbow-me/rainbowkit";
import { SafeConnector } from "wagmi/connectors/safe";
import type { ReactNode } from "react";

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
if (!WC_PROJECT_ID) throw new Error("WC_PROJECT_ID is missing");

const { wallets: defaultWallets } = getDefaultWallets({
  appName: "Vort3x",
  projectId: WC_PROJECT_ID,
  chains: [celoAlfajores, mainnet],
});

// custom wallets configuration
const wallets = [
  ...defaultWallets,
  {
    groupName: "Smart Wallets",
    wallets: [
      {
        id: "safe",
        name: "Safe",
        iconUrl: "https://safe.global/images/logo.svg",
        iconBackground: "#ffffff",
        createConnector: () => ({
          connector: new SafeConnector({
            chains: [celoAlfajores, mainnet],
            options: {
              allowedDomains: [/app.safe.global$/],
              debug: false,
            },
          }),
        }),
      }
    ],
  },
];

const { connectors } = getDefaultWallets({
  appName: "Vort3x",
  projectId: WC_PROJECT_ID,
  wallets,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    ...connectors,
    new SafeConnector({ 
      chains: [celoAlfajores, mainnet],
      options: {
        allowedDomains: [/app.safe.global$/],
        debug: false,
      },
    }),
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
      <RainbowKitProvider 
        theme={darkTheme()}
        modalSize="compact"
        wallets={wallets}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
import "./../styles/globals.css";
import { WagmiProvider } from "./config/wagmi";
import type { ReactNode } from "react";

export const metadata = {
  title: "Vort3x Spin DApp",
  description: "Spin to win on Celo Alfajores",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider>{children}</WagmiProvider>
      </body>
    </html>
  );
}

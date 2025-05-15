import "./../styles/globals.css";
import { WagmiProvider } from "./config/wagmi";

export const metadata = {
  title: "Vort3x Spin DApp",
  description: "Spin to win on Celo Alfajores"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider>{children}</WagmiProvider>
      </body>
    </html>
  );
}

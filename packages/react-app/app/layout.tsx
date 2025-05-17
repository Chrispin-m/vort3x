import "../styles/globals.css";
import "../styles/Spin.css";
import ClientLayout from "./ClientLayout";
import type { ReactNode } from "react";

export const metadata = {
  title: "Vort3x Spin DApp",
  description: "Spin to win on Celo Alfajores",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-gray-100">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

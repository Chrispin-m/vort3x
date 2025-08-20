// app/layout.tsx
import "../styles/globals.css";
import "../styles/Spin.css";
import ClientLayout from "./ClientLayout";
import Layout from "../components/Layout";
import type { ReactNode } from "react";

export const metadata = {
  title: "Vort3x Spin dApp",
  description: "Spin to win on Celo Vort3x dApp",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-gray-100">
        <ClientLayout>
          <Layout>{children}</Layout>
        </ClientLayout>
      </body>
    </html>
  );
}

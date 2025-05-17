import "../styles/globals.css";
import "../styles/Spin.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { ReactNode } from "react";

export const metadata = {
  title: "Vort3x Spin DApp",
  description: "Spin to win on Celo Alfajores",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-gray-100">
        <Header />

        {/* Main content area */}
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}

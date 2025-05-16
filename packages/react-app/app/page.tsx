"use client";

import { useAccount } from "wagmi";
import dynamic from "next/dynamic";
import { useEthersSigner } from "./config/signer";

const Spin = dynamic(() => import("../components/Spin"), { ssr: false });

export default function Home() {
  const { address, isConnected } = useAccount();
  const signer = useEthersSigner();

  if (!isConnected || !address || !signer) {
    return (
      <main className="flex items-center justify-center h-screen">
        <button
          onClick={() => (window as any).ethereum.request({ method: "eth_requestAccounts" })}
          className="px-6 py-3 bg-blue-600 text-white rounded"
        >
          Connect Wallet
        </button>
      </main>
    );
  }

  return (
    <main>
      <Spin signer={signer} userAddress={address} />
    </main>
  );
}

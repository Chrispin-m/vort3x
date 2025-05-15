"use client";

import { useAccount, useSigner } from "wagmi";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const Spin = dynamic(() => import("./../components/Spin"), { ssr: false });

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: signer } = useSigner();

  if (!isConnected || !signer || !address) {
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

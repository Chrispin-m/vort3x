"use client";

import { useAccount, useConnect } from "wagmi";
import dynamic from "next/dynamic";
import { useEthersSigner } from "./config/signer";

const Spin = dynamic(() => import("../components/Spin"), { ssr: false });

export default function Home() {
  const { connect, connectors, isLoading: isConnecting } = useConnect();
  const { address, isConnected } = useAccount();
  const signer = useEthersSigner();

  // while Wagmi is initializing or wallet popup open
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-lg font-medium">Connecting signer…</span>
      </div>
    );
  }

  // if not connected yet
  if (!isConnected || !address || !signer) {
    return (
      <div className="flex items-center justify-center h-full">
        {connectors.map((c) => (
          <button
            key={c.id}
            onClick={() => connect({ connector: c })}
            className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        ))}
      </div>
    );
  }

  // once connected, show the Spin wheel
  return (
    <div className="flex justify-center">
      <Spin signer={signer} userAddress={address} />
    </div>
  );
}

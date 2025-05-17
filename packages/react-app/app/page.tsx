"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import dynamicImport from "next/dynamic";
import { useEthersSigner } from "./config/signer";

const Spin = dynamicImport(() => import("../components/Spin"), { ssr: false });

export default function Home() {
  const { connectAsync, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const signer = useEthersSigner();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (connector: typeof connectors[number]) => {
    setIsConnecting(true);
    try {
      await connectAsync({ connector });
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-lg font-medium">Connecting signer…</span>
      </div>
    );
  }

  if (!isConnected || !address || !signer) {
    return (
      <div className="flex items-center justify-center h-full">
        {connectors.map((c) => (
          <button
            key={c.id}
            onClick={() => handleConnect(c)}
            className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
          >
            Connect with {c.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <Spin signer={signer} userAddress={address} />
    </div>
  );
}

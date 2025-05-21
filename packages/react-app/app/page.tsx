"use client";

import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import dynamic from "next/dynamic";
import { useEthersSigner } from "./config/signer";
import type { JsonRpcSigner } from "ethers";

const Spin = dynamic(() => import("../components/Spin"), { ssr: false });

export default function Home() {
  const { connectAsync, connectors } = useConnect();
  const { isConnected } = useAccount();
  const signerData = useEthersSigner();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (connector: (typeof connectors)[number]) => {
    setIsConnecting(true);
    try {
      await connectAsync({ 
        connector, 
        chainId: celoAlfajores.id 
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {!isConnected || !signerData ? (
        <div className="flex items-center justify-center h-screen space-x-4">
          {connectors.map((c) => (
            <button
              key={c.id}
              onClick={() => handleConnect(c)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting..." : `Connect with ${c.name}`}
            </button>
          ))}
        </div>
      ) : (
        <Spin 
          signer={signerData.signer} 
          userAddress={signerData.address} 
        />
      )}
    </div>
  );
}
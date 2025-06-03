"use client";

import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import dynamic from "next/dynamic";

const Spin = dynamic(() => import("../components/Spin"), { ssr: false });

export default function Home() {
    const { connectAsync, connectors } = useConnect();
    const { address, isConnected } = useAccount();
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnect = async (connector: (typeof connectors)[number]) => {
        setIsConnecting(true);
        try {
            await connectAsync({ connector });
        } finally {
            setIsConnecting(false);
        }
    };

  return (
    <div className="w-full h-full flex items-center justify-center">
      {!isConnected || !address ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          {connectors.map((c) => (
            <button
              key={c.id}
              onClick={() => handleConnect(c)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting..." : `Connect with ${c.name}`}
            </button>
          ))}
        </div>
      ) : (
        <Spin />
      )}
    </div>
  );
}
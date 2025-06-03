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
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
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
        <div className="glow-container">
          <Spin />
        </div>
      )}

      <style jsx>{`
        .glow-container {
          position: relative;
          /* Give a bit of padding so the glow has room */
          padding: 2rem;
          border-radius: 1rem;
          /* Apply a subtle backdrop so the glow stands out */
          background: rgba(20, 20, 40, 0.6);
          /* Animate the box-shadow to “pulse” like a heartbeat */
          animation: heartbeat 2s infinite ease-in-out;
        }

        @keyframes heartbeat {
          0% {
            box-shadow:
              0 0 15px rgba(100, 100, 255, 0.4),
              0 0 30px rgba(100, 100, 255, 0.3),
              0 0 60px rgba(100, 100, 255, 0.2);
          }
          25% {
            box-shadow:
              0 0 25px rgba(120, 120, 255, 0.6),
              0 0 50px rgba(120, 120, 255, 0.5),
              0 0 100px rgba(120, 120, 255, 0.3);
          }
          50% {
            box-shadow:
              0 0 15px rgba(100, 100, 255, 0.4),
              0 0 30px rgba(100, 100, 255, 0.3),
              0 0 60px rgba(100, 100, 255, 0.2);
          }
          100% {
            box-shadow:
              0 0 15px rgba(100, 100, 255, 0.4),
              0 0 30px rgba(100, 100, 255, 0.3),
              0 0 60px rgba(100, 100, 255, 0.2);
          }
        }

        /* Slightly round the corners of the glow container */
        .glow-container {
          border-radius: 1rem;
        }
      `}</style>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const Spin = dynamic(() => import("../components/Spin"), { ssr: false });

const WalletIcon = ({ connectorName }: { connectorName: string }) => {
  const iconClass = "w-8 h-8";
  
  switch (connectorName.toLowerCase()) {
    case "metamask":
      return (
        <svg viewBox="0 0 40 37" className={iconClass}>
          <path d="M36.5 0.5L22.1 13.4L24.9 4.9L36.5 0.5Z" fill="#E2761B" />
          <path d="M3.5 0.5L17.7 13.5L15.1 4.9L3.5 0.5Z" fill="#E4761B" />
          <path d="M31.2 26.5L28 31.5L35.4 33L37.5 26.6L31.2 26.5Z" fill="#E4761B" />
          <path d="M2.5 26.6L4.6 33L12 31.5L8.8 26.5L2.5 26.6Z" fill="#E4761B" />
          <path d="M12.9 16.5L11 20.1L18.2 20.5L18 12.1L12.9 16.5Z" fill="#E4761B" />
          <path d="M27.1 16.5L21.8 12L21.8 20.5L29 20.1L27.1 16.5Z" fill="#E4761B" />
          <path d="M14.7 24.5L18.3 26.5L15.2 28.8L14.7 24.5Z" fill="#E4761B" />
          <path d="M25.3 24.5L24.8 28.8L21.7 26.5L25.3 24.5Z" fill="#E4761B" />
        </svg>
      );
    case "walletconnect":
      return (
        <svg viewBox="0 0 40 40" className={iconClass}>
          <path d="M12 15C15.9 11.1 24.1 11.1 28 15L31 12C25.8 6.8 14.2 6.8 9 12L12 15Z" fill="#3B99FC" />
          <path d="M32 20C29.8 17.8 26.4 17.8 24.2 20C22 22.2 22 25.6 24.2 27.8L26.8 30.4C23.3 33.9 16.7 33.9 13.2 30.4L8 25.2L10.8 22.4L16 27.6C17.6 29.2 20.4 29.2 22 27.6C23.6 26 23.6 23.2 22 21.6C20.4 20 17.6 20 16 21.6L13.2 24.4C15.4 26.6 18.8 26.6 21 24.4C23.2 22.2 23.2 18.8 21 16.6C18.8 14.4 15.4 14.4 13.2 16.6L10.6 19.2C14.1 15.7 20.7 15.7 24.2 19.2L27 16.4L32 20Z" fill="#3B99FC" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={iconClass}>
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
  }
};

const getConnectorGradient = (name: string) => {
  switch (name.toLowerCase()) {
    case "metamask":
      return "bg-gradient-to-br from-amber-400/30 via-orange-500/30 to-amber-300/30";
    case "walletconnect":
      return "bg-gradient-to-br from-blue-400/30 via-indigo-500/30 to-blue-300/30";
    case "coinbase wallet":
      return "bg-gradient-to-br from-blue-500/30 via-blue-600/30 to-indigo-400/30";
    case "ledger":
      return "bg-gradient-to-br from-emerald-400/30 via-teal-500/30 to-emerald-300/30";
    default:
      return "bg-gradient-to-br from-purple-400/30 via-pink-500/30 to-purple-300/30";
  }
};

export default function Home() {
  const { connectAsync, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Group connectors by name to avoid duplicates
  const uniqueConnectors = Array.from(
    new Map(connectors.map(conn => [conn.name, conn])).values()
  );

  const handleConnect = async (connector: (typeof connectors)[number]) => {
    setIsConnecting(true);
    setConnectingId(connector.id);
    try {
      await connectAsync({ connector });
    } finally {
      setIsConnecting(false);
      setConnectingId(null);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      {!isConnected || !address ? (
        <motion.div 
          className="w-full max-w-4xl bg-white rounded-3xl shadow-xl p-6 sm:p-8 md:p-10 z-[-1]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-10">
            <motion.h1 
              className="text-3xl md:text-4xl font-bold text-gray-800 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Connect Your Wallet
            </motion.h1>
            <motion.p 
              className="text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Select your preferred wallet provider
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {uniqueConnectors.map((connector) => (
              <motion.div
                key={connector.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => handleConnect(connector)}
                  disabled={isConnecting}
                  className={`
                    w-full h-full flex flex-col items-center justify-center
                    p-5 rounded-2xl backdrop-blur-lg border border-gray-200
                    transition-all duration-300 overflow-hidden
                    hover:shadow-lg relative
                    ${isConnecting ? "opacity-80 cursor-not-allowed" : ""}
                  `}
                >
                  {/* Ethereal background */}
                  <div className={`absolute inset-0 ${getConnectorGradient(connector.name)} opacity-70 z-0`} />
                  
                  {/* Glowing orb effect */}
                  <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-white/30 rounded-full filter blur-3xl z-0" />
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-4 p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-sm">
                      <WalletIcon connectorName={connector.name} />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {connector.name}
                    </h3>
                    
                    {connectingId === connector.id ? (
                      <div className="flex items-center mt-2">
                        <svg 
                          className="animate-spin h-5 w-5 text-gray-600 mr-2" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-gray-600">Connecting...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">Click to connect</p>
                    )}
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
          
          {/* Footer with glowing text */}
          <motion.div 
            className="text-center mt-10 pt-6 border-t border-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <p className="text-sm text-gray-500">
              Secure connection powered by blockchain technology
            </p>
            <div className="mt-2 flex justify-center">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-400 mx-1"
                  animate={{ 
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    delay: i * 0.2 
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <Spin />
      )}
    </div>
  );
}
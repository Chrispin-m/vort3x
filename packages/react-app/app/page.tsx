"use client";

import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const Spin = dynamic(() => import("../components/Spin"), { ssr: false });

const getConnectorColors = (connectorName: string) => {
  switch (connectorName.toLowerCase()) {
    case "metamask":
      return {
        primary: "#E2761B",
        secondary: "#F6851B",
        gradient: "linear-gradient(90deg, #E2761B, #F6851B, #FF9E4A)",
        glow: "0 0 15px rgba(226, 118, 27, 0.4)"
      };
    case "walletconnect":
      return {
        primary: "#3B99FC",
        secondary: "#5D8BF4",
        gradient: "linear-gradient(90deg, #3B99FC, #5D8BF4, #8BB3F9)",
        glow: "0 0 15px rgba(59, 153, 252, 0.4)"
      };
    default:
      return {
        primary: "#8B5CF6",
        secondary: "#C084FC",
        gradient: "linear-gradient(90deg, #8B5CF6, #C084FC, #D8B4FE)",
        glow: "0 0 15px rgba(139, 92, 246, 0.4)"
      };
  }
};

const WalletIcon = ({ connectorName }: { connectorName: string }) => {
  const iconClass = "w-6 h-6";
  const colors = getConnectorColors(connectorName);
  
  return (
    <div className="relative">
      <div 
        className="absolute inset-0 rounded-full blur-sm opacity-60"
        style={{ background: colors.primary }}
      />
      {connectorName.toLowerCase() === "metamask" ? (
        <svg viewBox="0 0 40 37" className={iconClass}>
          <path d="M36.5 0.5L22.1 13.4L24.9 4.9L36.5 0.5Z" fill={colors.primary} />
          <path d="M3.5 0.5L17.7 13.5L15.1 4.9L3.5 0.5Z" fill={colors.primary} />
          <path d="M31.2 26.5L28 31.5L35.4 33L37.5 26.6L31.2 26.5Z" fill={colors.primary} />
          <path d="M2.5 26.6L4.6 33L12 31.5L8.8 26.5L2.5 26.6Z" fill={colors.primary} />
          <path d="M12.9 16.5L11 20.1L18.2 20.5L18 12.1L12.9 16.5Z" fill={colors.primary} />
          <path d="M27.1 16.5L21.8 12L21.8 20.5L29 20.1L27.1 16.5Z" fill={colors.primary} />
          <path d="M14.7 24.5L18.3 26.5L15.2 28.8L14.7 24.5Z" fill={colors.secondary} />
          <path d="M25.3 24.5L24.8 28.8L21.7 26.5L25.3 24.5Z" fill={colors.secondary} />
        </svg>
      ) : connectorName.toLowerCase() === "walletconnect" ? (
        <svg viewBox="0 0 40 40" className={iconClass}>
          <path d="M12 15C15.9 11.1 24.1 11.1 28 15L31 12C25.8 6.8 14.2 6.8 9 12L12 15Z" fill={colors.primary} />
          <path d="M32 20C29.8 17.8 26.4 17.8 24.2 20C22 22.2 22 25.6 24.2 27.8L26.8 30.4C23.3 33.9 16.7 33.9 13.2 30.4L8 25.2L10.8 22.4L16 27.6C17.6 29.2 20.4 29.2 22 27.6C23.6 26 23.6 23.2 22 21.6C20.4 20 17.6 20 16 21.6L13.2 24.4C15.4 26.6 18.8 26.6 21 24.4C23.2 22.2 23.2 18.8 21 16.6C18.8 14.4 15.4 14.4 13.2 16.6L10.6 19.2C14.1 15.7 20.7 15.7 24.2 19.2L27 16.4L32 20Z" fill={colors.secondary} />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={iconClass}>
          <path 
            stroke={colors.primary} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
          />
        </svg>
      )}
    </div>
  );
};

export default function Home() {
  const { connectAsync, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Group connectors by name
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
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-indigo-900/10 to-purple-900/5"></div>
        <div className="absolute top-[10%] left-[10%] w-[300px] h-[300px] bg-teal-400/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[15%] right-[20%] w-[250px] h-[250px] bg-pink-500/15 rounded-full blur-[80px]"></div>
      </div>
      
      {!isConnected || !address ? (
        <div className="w-full max-w-3xl relative z-10">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: "linear-gradient(90deg, #c084fc, #60a5fa, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 12px rgba(139, 92, 246, 0.4)"
            }}
          >
            Connect Your Wallet
          </motion.h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {uniqueConnectors.map((connector) => {
              const colors = getConnectorColors(connector.name);
              
              return (
                <motion.div
                  key={connector.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ 
                    scale: 1.03,
                    boxShadow: colors.glow
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => handleConnect(connector)}
                    disabled={isConnecting}
                    className={`
                      w-full h-full flex flex-col items-center justify-center
                      p-6 rounded-2xl backdrop-blur-lg
                      border border-white/20
                      transition-all duration-300
                      hover:border-white/40
                      ${isConnecting ? "opacity-80 cursor-not-allowed" : ""}
                    `}
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 20% 30%, ${colors.primary}20 0%, transparent 40%),
                        radial-gradient(circle at 80% 70%, ${colors.secondary}20 0%, transparent 40%)
                      `,
                      boxShadow: colors.glow
                    }}
                  >
                    <div 
                      className="p-4 rounded-full mb-4 backdrop-blur-sm relative"
                      style={{
                        background: `radial-gradient(circle, ${colors.primary}30, transparent 70%)`,
                        boxShadow: `
                          inset 0 0 12px ${colors.primary}80,
                          0 0 15px ${colors.secondary}50
                        `
                      }}
                    >
                      <div className="relative z-10">
                        <WalletIcon connectorName={connector.name} />
                      </div>
                    </div>
                    
                    <h3 
                      className="text-lg font-semibold mb-1"
                      style={{
                        background: colors.gradient,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textShadow: `0 0 8px ${colors.primary}80`
                      }}
                    >
                      {connector.name}
                    </h3>
                    
                    {connectingId === connector.id ? (
                      <div className="flex items-center mt-2">
                        <svg 
                          className="animate-spin h-5 w-5 mr-2" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24"
                          style={{ color: colors.primary }}
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span 
                          className="text-sm"
                          style={{ 
                            color: colors.primary,
                            textShadow: `0 0 4px ${colors.secondary}`
                          }}
                        >
                          Connecting...
                        </span>
                      </div>
                    ) : (
                      <p 
                        className="text-sm mt-1 font-light"
                        style={{ 
                          color: colors.secondary,
                          textShadow: `0 0 6px ${colors.primary}80`
                        }}
                      >
                        Click to connect
                      </p>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
          
          <motion.p 
            className="text-center mt-8 text-sm font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{
              background: "linear-gradient(90deg, #444, #111)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 8px rgba(0, 0, 0, 0.6)"
            }}
          >
            Secure connection powered by blockchain technology
          </motion.p>
        </div>
      ) : (
        <Spin />
      )}
    </div>
  );
}
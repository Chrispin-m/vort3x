"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { 
  http, 
  createConfig, 
  createStorage, 
  cookieStorage,
  getWalletClient
} from "@wagmi/core";
import { 
  celo,
  optimism,
  arbitrum,
  baseSepolia,
  optimismSepolia,
  sei,
  sepolia,
  lisk,
  scroll
} from "@wagmi/core/chains";
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rabbyWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import dynamic from "next/dynamic";
import { SwitchChainError } from "viem";

const Spin = dynamic(() => import("../components/Spin"), { ssr: false });

// Configuration
const PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "default-project-id";
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://forno.celo.org";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        rabbyWallet,
        coinbaseWallet,
        walletConnectWallet,
        injectedWallet,
        rainbowWallet,
      ],
    },
  ],
  {
  appName: 'Vort3x',
  projectId: PROJECT_ID,
  appDescription: 'AppKit Example',
  appUrl: 'https://vort3x.xyz', // origin must match your domain & subdomain
  appIcon: 'https://assets.reown.com/reown-profile-pic.png',
  }
);

const config = createConfig({
  chains: [
    celo,
    optimism,
    arbitrum,
    baseSepolia,
    optimismSepolia,
    sei,
    sepolia,
    lisk,
    scroll
  ],
  connectors,
  transports: {
    [celo.id]: http(RPC_URL),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [baseSepolia.id]: http(),
    [optimismSepolia.id]: http(),
    [sei.id]: http(),
    [sepolia.id]: http(),
    [lisk.id]: http(),
    [scroll.id]: http(),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

// Token data
const celoTokens = [
  {
    symbol: "cUSD",
    address: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    decimals: 18,
  },
  {
    symbol: "USDC",
    address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    decimals: 6,
  },
  {
    symbol: "CKES",
    address: "0x1E0433C1769271ECcF4CFF9FDdD515eefE6CdF92",
    decimals: 6,
  },
  {
    symbol: "USDT",
    address: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
    decimals: 6,
  },
];

// Wallet client utilities
const errorManager = (context: string, error: any, metadata?: any) => {
  console.error(`[${context}]`, error, metadata);
};

const safeGetWalletClient = async (chainId: number) => {
  try {
    const walletClient = await getWalletClient(config, { chainId });
    if (!walletClient) throw new Error("Wallet client not available");
    return { walletClient, error: null };
  } catch (error: any) {
    errorManager("Wallet client error", error, { chainId });
    
    // Handle switch chain error specifically
    const errorMsg = error instanceof SwitchChainError
      ? "Failed to switch network. Please check your wallet." 
      : "Failed to connect to wallet. Please try again.";
    
    return {
      walletClient: null,
      error: errorMsg
    };
  }
};

// Background elements
const generateStars = () => {
  return Array.from({ length: 100 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 3 + 1}px`,
    opacity: Math.random() * 0.7 + 0.3,
    delay: Math.random() * 5,
  }));
};

export default function Home() {
  const { address, isConnected, chain } = useAccount({ config });
  const [needsNetworkSwitch, setNeedsNetworkSwitch] = useState(false);
  const [addingToken, setAddingToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const connectModalRef = useRef<HTMLButtonElement>(null);
  
  const stars = useMemo(() => generateStars(), []);

  useEffect(() => {
    if (isConnected && chain?.id !== celo.id) {
      setNeedsNetworkSwitch(true);
    } else {
      setNeedsNetworkSwitch(false);
    }
  }, [isConnected, chain]);

  const addCeloNetwork = async () => {
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      const { walletClient, error } = await safeGetWalletClient(celo.id);
      if (error) throw new Error(error);
      
      await walletClient!.switchChain({ id: celo.id });
      setNeedsNetworkSwitch(false);
    } catch (error: any) {
      setConnectionError(error.message || "Failed to switch network");
    } finally {
      setIsLoading(false);
    }
  };

  const addTokenToWallet = async (token: typeof celoTokens[0]) => {
    setAddingToken(token.symbol);
    setConnectionError(null);
    
    try {
      const { walletClient, error } = await safeGetWalletClient(celo.id);
      if (error) throw new Error(error);
      
      await walletClient!.watchAsset({
        type: "ERC20",
        options: {
          address: token.address as `0x${string}`,
          symbol: token.symbol,
          decimals: token.decimals,
          image: ""
        }
      });
    } catch (error: any) {
      setConnectionError(error.message || "Failed to add token");
    } finally {
      setAddingToken(null);
    }
  };

  const handleConnect = () => {
    setIsLoading(true);
    setConnectionError(null);
    
    if (connectModalRef.current) {
      connectModalRef.current.click();
    } else {
      setConnectionError("Connection failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden">
      {/* Cosmic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0a0e2a] via-[#13183a] to-[#0a0e2a]">
        {/* Nebula Effects */}
        <div className="absolute top-[15%] left-[15%] w-[400px] h-[400px] bg-[#6d28d9]/10 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] bg-[#0ea5e9]/15 rounded-full blur-[120px] animate-pulse-slower" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-[#ec4899]/10 rounded-full blur-[100px] animate-pulse-medium" />
        
        {/* Stars */}
        {stars.map(star => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
            animate={{ opacity: [star.opacity, star.opacity * 0.5, star.opacity] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {!isConnected || !address ? (
        <div className="w-full max-w-3xl relative z-10">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-center mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              background: "linear-gradient(90deg, #a5b4fc, #c7d2fe, #e0e7ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 20px rgba(165, 180, 252, 0.5)"
            }}
          >
            Connect to the Cosmos
          </motion.h1>
          
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ 
                scale: 1.03,
                boxShadow: "0 0 30px rgba(139, 92, 246, 0.4)"
              }}
              whileTap={{ scale: 0.98 }}
              className="w-full max-w-md"
            >
              <motion.button
                onClick={handleConnect}
                disabled={isLoading}
                className={`
                  w-full flex flex-col items-center justify-center
                  p-10 rounded-2xl backdrop-blur-2xl
                  border border-white/20
                  transition-all duration-500
                  hover:border-white/40
                  ${isLoading ? "opacity-80 cursor-not-allowed" : ""}
                `}
                style={{
                  background: "radial-gradient(circle at center, rgba(55, 48, 107, 0.3) 0%, rgba(30, 27, 75, 0.3) 100%)",
                  boxShadow: "0 0 30px rgba(99, 102, 241, 0.3), inset 0 0 20px rgba(199, 210, 254, 0.1)"
                }}
                animate={{ 
                  boxShadow: [
                    "0 0 30px rgba(99, 102, 241, 0.3), inset 0 0 20px rgba(199, 210, 254, 0.1)",
                    "0 0 40px rgba(139, 92, 246, 0.4), inset 0 0 25px rgba(165, 180, 252, 0.2)",
                    "0 0 30px rgba(99, 102, 241, 0.3), inset 0 0 20px rgba(199, 210, 254, 0.1)"
                  ]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div 
                  className="p-6 rounded-full mb-6 backdrop-blur-md relative"
                  style={{
                    background: "radial-gradient(circle, rgba(139, 92, 246, 0.2), transparent 70%)",
                    boxShadow: `
                      inset 0 0 20px rgba(199, 210, 254, 0.3),
                      0 0 30px rgba(99, 102, 241, 0.4)
                    `
                  }}
                >
                  <div className="relative z-10">
                    <div className="w-16 h-16 relative">
                      <motion.div 
                        className="absolute inset-0 rounded-full blur-md opacity-50"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [0.5, 0.7, 0.5]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        style={{
                          background: "radial-gradient(circle, #a5b4fc, #818cf8, #6366f1)"
                        }}
                      />
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        className="w-16 h-16"
                        fill="none"
                      >
                        <motion.path 
                          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                          stroke="url(#ethereal-gradient)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          animate={{ 
                            rotate: [0, 5, 0, -5, 0],
                            scale: [1, 1.05, 1]
                          }}
                          transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <defs>
                          <linearGradient id="ethereal-gradient" x1="12" y1="2" x2="12" y2="21" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#a5b4fc" />
                            <stop offset="1" stopColor="#c7d2fe" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <motion.h3 
                  className="text-xl font-semibold mb-2"
                  style={{
                    background: "linear-gradient(90deg, #c7d2fe, #e0e7ff)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                  animate={{ 
                    textShadow: [
                      "0 0 10px rgba(165, 180, 252, 0.5)",
                      "0 0 15px rgba(199, 210, 254, 0.7)",
                      "0 0 10px rgba(165, 180, 252, 0.5)"
                    ]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  Portal Access
                </motion.h3>
                
                {isLoading ? (
                  <div className="flex items-center mt-3">
                    <svg 
                      className="animate-spin h-6 w-6 mr-2" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                      style={{ color: "#a5b4fc" }}
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <motion.span 
                      className="text-sm font-light"
                      style={{ 
                        color: "#e0e7ff",
                      }}
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      Opening Stargate...
                    </motion.span>
                  </div>
                ) : (
                  <motion.p 
                    className="text-sm mt-2 font-light"
                    style={{ 
                      color: "#c7d2fe",
                    }}
                    animate={{ 
                      opacity: [0.7, 1, 0.7],
                      y: [0, -2, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    Multi-dimensional wallet connection
                  </motion.p>
                )}
              </motion.button>
            </motion.div>

            {/* Hidden RainbowKit button for reliable modal triggering */}
            <div className="absolute opacity-0 h-0 overflow-hidden">
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    ref={connectModalRef}
                    onClick={openConnectModal}
                    aria-hidden="true"
                  />
                )}
              </ConnectButton.Custom>
            </div>

            {/* Error message */}
            {connectionError && (
              <motion.div
                className="mt-4 p-3 rounded-lg bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-100 text-center max-w-md"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {connectionError}
              </motion.div>
            )}

            {/* Mobile wallet options */}
            <div className="mt-6 text-center">
              <p className="text-sm text-indigo-200 mb-2">
                Recommended for mobile:
              </p>
              <div className="flex justify-center gap-3">
                <a 
                  href="#" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 hover:text-indigo-100 transition-colors"
                >
                  Rainbow Wallet
                </a>
                <span className="text-indigo-400">•</span>
                <a 
                  href="#" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 hover:text-indigo-100 transition-colors"
                >
                  MetaMask
                </a>
                <span className="text-indigo-400">•</span>
                <a 
                  href="" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 hover:text-indigo-100 transition-colors"
                >
                  WalletConnect
                </a>
              </div>
            </div>
          </div>
          
          <motion.p 
            className="text-center mt-10 text-sm font-light max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            style={{
              color: "#a5b4fc",
            }}
          >
            Secure connection through cosmic gateways to 150+ celestial wallets
          </motion.p>
        </div>
      ) : needsNetworkSwitch ? (
        <div className="w-full max-w-3xl relative z-10">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-center mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              background: "linear-gradient(90deg, #67e8f9, #22d3ee, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 20px rgba(103, 232, 249, 0.5)"
            }}
          >
            Align with Celo Constellation
          </motion.h1>
          
          <motion.div
            className="bg-gradient-to-br from-cyan-900/20 to-teal-800/10 backdrop-blur-xl
                      rounded-2xl border border-cyan-500/30 p-8 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            style={{
              boxShadow: "0 0 30px rgba(6, 182, 212, 0.3), inset 0 0 20px rgba(103, 232, 249, 0.1)"
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <motion.div 
                className="bg-gradient-to-r from-cyan-500 to-teal-400 p-4 rounded-full"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-900" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </motion.div>
            </div>
            
            <p className="text-center text-cyan-100/90 mb-2 font-light">
              You're connected to <span className="font-medium text-cyan-50">{chain?.name}</span>
            </p>
            <p className="text-center text-cyan-200 font-medium mb-8">
              Please align with the Celo Mainnet constellation
            </p>
            
            <motion.button
              onClick={addCeloNetwork}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-teal-400
                        rounded-xl text-cyan-900 font-bold flex items-center justify-center
                        hover:from-cyan-400 hover:to-teal-300 transition-all
                        disabled:opacity-70"
              whileHover={{ 
                scale: isLoading ? 1 : 1.02,
                boxShadow: "0 0 20px rgba(6, 182, 212, 0.5)"
              }}
              whileTap={{ scale: 0.98 }}
              style={{
                boxShadow: "0 0 15px rgba(6, 182, 212, 0.3)"
              }}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Aligning...
                </div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  Align with Celo Constellation
                </>
              )}
            </motion.button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-xl font-bold text-center mb-8 text-cyan-50">
              Cosmic Assets
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {celoTokens.map(token => (
                <motion.div
                  key={token.symbol}
                  className="bg-cyan-900/20 backdrop-blur-md rounded-xl p-5
                            border border-cyan-500/30 flex items-center"
                  whileHover={{ 
                    y: -5,
                    boxShadow: "0 5px 15px rgba(6, 182, 212, 0.2)"
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="bg-gradient-to-br from-cyan-600 to-teal-500 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                    <span className="font-bold text-cyan-900">{token.symbol[0]}</span>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-cyan-100">{token.symbol}</h3>
                    <p className="text-xs text-cyan-200/70 truncate font-mono">
                      {token.address.substring(0, 6)}...{token.address.slice(-4)}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => addTokenToWallet(token)}
                    disabled={!!addingToken}
                    className="bg-cyan-700/50 hover:bg-cyan-600/60 px-4 py-2 rounded-lg
                              text-cyan-100 text-sm font-medium transition-colors
                              disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      boxShadow: "0 0 10px rgba(6, 182, 212, 0.2)"
                    }}
                  >
                    {addingToken === token.symbol ? (
                      <div className="flex items-center">
                        <svg className="animate-spin h-4 w-4 mr-1 text-cyan-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Manifesting...
                      </div>
                    ) : (
                      "Add to Wallet"
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      ) : (
        <Spin />
      )}
    </div>
  );
  }

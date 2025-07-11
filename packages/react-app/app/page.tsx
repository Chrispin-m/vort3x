"use client";

import { useState, useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { celo } from "wagmi/chains";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const Spin = dynamic(() => import("../components/Spin"), { ssr: false });

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

export default function Home() {
  const { switchChainAsync } = useSwitchChain();
  const { address, isConnected, chain } = useAccount();
  const [needsNetworkSwitch, setNeedsNetworkSwitch] = useState(false);
  const [addingToken, setAddingToken] = useState<string | null>(null);
  const [isRainbowLoading, setIsRainbowLoading] = useState(false);

  useEffect(() => {
    if (isConnected && chain?.id !== celo.id) {
      setNeedsNetworkSwitch(true);
    } else {
      setNeedsNetworkSwitch(false);
    }
  }, [isConnected, chain]);

  const addCeloNetwork = async () => {
    try {
      await switchChainAsync({
        chainId: celo.id
      });
      setNeedsNetworkSwitch(false);
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  const addTokenToWallet = async (token: typeof celoTokens[0]) => {
    setAddingToken(token.symbol);
    try {
      const provider = await window.ethereum;
      if (provider) {
        await provider.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20",
            options: {
              address: token.address,
              symbol: token.symbol,
              decimals: token.decimals,
              image: "",
            },
          },
        });
      }
    } catch (error) {
      console.error(`Error adding ${token.symbol}:`, error);
    } finally {
      setAddingToken(null);
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
          
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              whileHover={{ 
                scale: 1.03,
                boxShadow: "0 0 15px rgba(59, 130, 246, 0.4)"
              }}
              whileTap={{ scale: 0.98 }}
            >
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={() => {
                      setIsRainbowLoading(true);
                      openConnectModal();
                    }}
                    disabled={isRainbowLoading}
                    className={`
                      w-full flex flex-col items-center justify-center
                      p-8 rounded-2xl backdrop-blur-lg
                      border border-white/20
                      transition-all duration-300
                      hover:border-white/40
                      ${isRainbowLoading ? "opacity-80 cursor-not-allowed" : ""}
                    `}
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 20% 30%, #3b82f620 0%, transparent 40%),
                        radial-gradient(circle at 80% 70%, #60a5fa20 0%, transparent 40%)
                      `,
                      boxShadow: "0 0 15px rgba(59, 130, 246, 0.4)"
                    }}
                  >
                    <div 
                      className="p-4 rounded-full mb-4 backdrop-blur-sm relative"
                      style={{
                        background: `radial-gradient(circle, #3b82f630, transparent 70%)`,
                        boxShadow: `
                          inset 0 0 12px #3b82f680,
                          0 0 15px #60a5fa50
                        `
                      }}
                    >
                      <div className="relative z-10">
                        <div className="w-12 h-12 relative">
                          <div className="absolute inset-0 rounded-full blur-sm opacity-60 bg-gradient-to-r from-[#FF0018] via-[#FFA52C] to-[#FFFF41]"/>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="w-12 h-12">
                            <path d="M20 5C10 5 5 10 5 20C5 30 10 35 20 35C30 35 35 30 35 20C35 10 30 5 20 5Z" fill="url(#rainbow)" />
                            <defs>
                              <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FF0018" />
                                <stop offset="25%" stopColor="#FFA52C" />
                                <stop offset="50%" stopColor="#FFFF41" />
                                <stop offset="75%" stopColor="#008018" />
                                <stop offset="100%" stopColor="#0000F9" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <h3 
                      className="text-lg font-semibold mb-1"
                      style={{
                        background: "linear-gradient(90deg, #FF0018, #FFA52C, #FFFF41, #008018, #0000F9)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textShadow: "0 0 8px rgba(59, 130, 246, 0.8)"
                      }}
                    >
                      RainbowKit
                    </h3>
                    
                    {isRainbowLoading ? (
                      <div className="flex items-center mt-2">
                        <svg 
                          className="animate-spin h-5 w-5 mr-2" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24"
                          style={{ color: "#3b82f6" }}
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span 
                          className="text-sm"
                          style={{ 
                            color: "#3b82f6",
                            textShadow: "0 0 4px #60a5fa"
                          }}
                        >
                          Connecting...
                        </span>
                      </div>
                    ) : (
                      <p 
                        className="text-sm mt-1 font-light"
                        style={{ 
                          color: "#60a5fa",
                          textShadow: "0 0 6px #3b82f680"
                        }}
                      >
                        Recommended multi-wallet solution
                      </p>
                    )}
                  </button>
                )}
              </ConnectButton.Custom>
            </motion.div>
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
            Secure connection supporting 150+ wallets
          </motion.p>
        </div>
      ) : needsNetworkSwitch ? (
        <div className="w-full max-w-3xl relative z-10">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: "linear-gradient(90deg, #f97316, #f59e0b, #eab308)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 12px rgba(249, 115, 22, 0.4)"
            }}
          >
            Switch to Celo Network
          </motion.h1>
          
          <motion.div
            className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 backdrop-blur-lg
                      rounded-2xl border border-amber-500/30 p-8 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-amber-500 to-yellow-300 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-900" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <p className="text-center text-amber-100/90 mb-2">
              You're connected to <span className="font-bold">{chain?.name}</span>
            </p>
            <p className="text-center text-amber-200 font-medium mb-6">
              Please switch to Celo Mainnet to continue
            </p>
            
            <motion.button
              onClick={addCeloNetwork}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400
                        rounded-xl text-amber-900 font-bold flex items-center justify-center
                        hover:from-amber-400 hover:to-yellow-300 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
              Switch to Celo Mainnet
            </motion.button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-xl font-bold text-center mb-6 text-amber-50">
              Add Celo Tokens to Wallet
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {celoTokens.map(token => (
                <motion.div
                  key={token.symbol}
                  className="bg-amber-900/20 backdrop-blur-sm rounded-xl p-4
                            border border-amber-500/30 flex items-center"
                  whileHover={{ y: -5 }}
                >
                  <div className="bg-gradient-to-br from-amber-600 to-yellow-500 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                    <span className="font-bold text-amber-900">{token.symbol[0]}</span>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-100">{token.symbol}</h3>
                    <p className="text-xs text-amber-200/70 truncate">
                      {token.address.substring(0, 6)}...{token.address.slice(-4)}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => addTokenToWallet(token)}
                    disabled={!!addingToken}
                    className="bg-amber-700/50 hover:bg-amber-600/60 px-4 py-2 rounded-lg
                              text-amber-100 text-sm font-medium transition-colors
                              disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingToken === token.symbol ? (
                      <div className="flex items-center">
                        <svg className="animate-spin h-4 w-4 mr-1 text-amber-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </div>
                    ) : (
                      "Add Token"
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

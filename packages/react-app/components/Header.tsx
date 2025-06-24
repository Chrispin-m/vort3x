"use client";

import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon, Bars3Icon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useWeb3 } from "../contexts/useWeb3";
import {
  getOffchainBalance,
  depositOffchain,
  withdrawOffchain,
} from "../app/url/vortex";
import { formatUnits, parseUnits } from "viem";
import { useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { VortexAddress } from "@/app/config/addresses";

// Supported tokens
const TOKENS = ['USDT', 'cUSD', 'cKES', 'USDC'];
const TOKEN_DECIMALS: Record<string, number> = {
  USDT: 6,
  cUSD: 18,
  cKES: 6,
  USDC: 6,
};
const TOKEN_ADDRESSES: Record<string, string> = {
  USDT: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
  cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  cKES: "0x1E0433C1769271ECcF4CFF9FDdD515eefE6CdF92",
  USDC: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
};

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [offchainBalances, setOffchainBalances] = useState<OffchainBalance[]>([]);
  const [selectedToken, setSelectedToken] = useState<OffchainBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const { address, getUserAddress, sendToken, checkBalanceForTx } = useWeb3();
  const { connect } = useConnect();
  
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalError, setModalError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [modalToken, setModalToken] = useState('cUSD');

  const [toasts, setToasts] = useState<{id: number, message: string, type: 'success' | 'error' | 'info'}[]>([]);
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum?.isMiniPay) {
      connect({ connector: injected() });
    }
  }, [connect]);

  useEffect(() => {
    if ((showDepositModal || showWithdrawModal || showHelpModal) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showDepositModal, showWithdrawModal, showHelpModal]);

  const fetchBalances = async () => {
    if (!address) return;
    
    setLoadingBalance(true);
    try {
      const user = await getUserAddress();
      const resp = await getOffchainBalance(user);
      setOffchainBalances(resp.balances);
      
      // Set highest balance token as default
      if (resp.balances.length > 0) {
        // Find token with highest balance
        const highestToken = resp.balances.reduce((max, current) => 
          parseFloat(max.balance) > parseFloat(current.balance) ? max : current
        );
        setSelectedToken(highestToken);
      }
      
      setLastRefresh(Date.now());
    } catch (err) {
      setOffchainBalances([]);
      setSelectedToken(null);
      addToast("Failed to fetch balances", "error");
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBalances();
    }
  }, [isOpen]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(current => current.filter(t => t.id !== id));
    }, 3000);
  };

  const formatBalance = (balance: string, decimals: number) => {
    const num = parseFloat(balance);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleTokenChange = (direction: 'next' | 'prev') => {
    if (offchainBalances.length < 2) return;
    
    const currentIndex = offchainBalances.findIndex(
      t => t.symbol === selectedToken?.symbol
    );
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % offchainBalances.length;
    } else {
      newIndex = (currentIndex - 1 + offchainBalances.length) % offchainBalances.length;
    }
    
    setSelectedToken(offchainBalances[newIndex]);
  };

  const renderDepositModal = () => {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!amount || isNaN(Number(amount))) {
        setModalError("Please enter a valid amount");
        return;
      }
      
      if (Number(amount) <= 0) {
        setModalError("Amount must be greater than zero");
        return;
      }
      
      try {
        setIsProcessing(true);
        setModalError("");
        const user = await getUserAddress();
        await checkBalanceForTx(user, amount, VortexAddress);
        const hash = await sendToken(VortexAddress, amount, modalToken);
        await depositOffchain({
          userAddress: user,
          value: parseUnits(amount, TOKEN_DECIMALS[modalToken]).toString(),
          hash,
        });
        await fetchBalances();
        setShowDepositModal(false);
        setAmount("");
        addToast(`Deposit of ${amount} ${modalToken} successful!`, "success");
      } catch (e: any) {
        const errorMsg = e.response?.data?.message || "Deposit failed";
        setModalError(errorMsg);
        addToast(errorMsg, "error");
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-purple-900/90 backdrop-blur-xl" />
        <div className="relative z-[2001] w-full max-w-md p-8 bg-gradient-to-br from-indigo-900/95 to-purple-900/95 backdrop-blur-3xl rounded-2xl border border-cyan-500/30 shadow-[0_0_60px_-15px_rgba(192,132,252,0.7)]">
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${Math.random() * 8 + 2}px`,
                  height: `${Math.random() * 8 + 2}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  backgroundColor: `hsl(${Math.random() * 60 + 240}, 70%, 60%)`,
                  opacity: Math.random() * 0.4 + 0.1,
                  filter: 'blur(2px)',
                  animation: `float ${Math.random() * 15 + 5}s infinite ${i * 0.3}s`,
                  boxShadow: '0 0 10px 2px currentColor'
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                Deposit Token
              </h2>
              <button
                onClick={() => setShowDepositModal(false)}
                className="p-2 text-cyan-300 hover:text-white transition-all"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-cyan-300 mb-2 text-sm">
                  Select Token
                </label>
                <div className="flex space-x-2">
                  {TOKENS.map(token => (
                    <button
                      key={token}
                      type="button"
                      className={`flex-1 py-2 px-3 rounded-lg ${
                        modalToken === token
                          ? 'bg-cyan-600 text-white'
                          : 'bg-indigo-800/50 text-cyan-300 hover:bg-indigo-800/70'
                      } transition-all`}
                      onClick={() => setModalToken(token)}
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-cyan-300 mb-2 text-sm">
                  Enter amount to deposit
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full py-3 px-4 bg-indigo-800/50 border border-cyan-400/30 rounded-xl text-white text-xl placeholder-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-cyan-300">
                    {modalToken}
                  </div>
                </div>
                {modalError && (
                  <p className="mt-2 text-red-400 text-sm">{modalError}</p>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-800/40 to-purple-800/40 border border-cyan-400/30 rounded-xl text-white hover:shadow-[0_0_15px_-3px_rgba(192,132,252,0.5)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-600/70 to-emerald-600/70 rounded-xl text-white hover:shadow-[0_0_15px_-3px_rgba(56,189,248,0.5)] transition-all flex items-center justify-center"
                >
                  {isProcessing ? (
                    <div className="w-6 h-6 border-t-2 border-white rounded-full animate-spin"></div>
                  ) : (
                    "Deposit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderWithdrawModal = () => {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!amount || isNaN(Number(amount))) {
        setModalError("Please enter a valid amount");
        return;
      }
      
      if (Number(amount) <= 0) {
        setModalError("Amount must be greater than zero");
        return;
      }
      
      try {
        setIsProcessing(true);
        setModalError("");
        const user = await getUserAddress();
        const response = await withdrawOffchain({
          userAddress: user,
          amount: amount,
          token: modalToken,
        });
        
        if (response.transactionHash) {
          addToast(`Withdrawal of ${amount} ${modalToken} successful! TX: ${response.transactionHash}`, "success");
        } else {
          addToast(`Withdrawal processed: ${response.message}`, "info");
        }
        
        await fetchBalances();
        setShowWithdrawModal(false);
        setAmount("");
      } catch (e: any) {
        let errorMsg = "Withdrawal failed";
        
        if (e.response?.data?.message) {
          errorMsg = e.response.data.message;
        } else if (e.message) {
          errorMsg = e.message;
        }
        
        setModalError(errorMsg);
        addToast(errorMsg, "error");
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-purple-900/90 backdrop-blur-xl" />
        <div className="relative z-[2001] w-full max-w-md p-8 bg-gradient-to-br from-indigo-900/95 to-purple-900/95 backdrop-blur-3xl rounded-2xl border border-amber-500/30 shadow-[0_0_60px_-15px_rgba(245,158,11,0.4)]">
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${Math.random() * 8 + 2}px`,
                  height: `${Math.random() * 8 + 2}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  backgroundColor: `hsl(${Math.random() * 30 + 30}, 70%, 60%)`,
                  opacity: Math.random() * 0.4 + 0.1,
                  filter: 'blur(2px)',
                  animation: `float ${Math.random() * 15 + 5}s infinite ${i * 0.3}s`,
                  boxShadow: '0 0 10px 2px currentColor'
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">
                Withdraw Token
              </h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-2 text-amber-300 hover:text-white transition-all"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-amber-300 mb-2 text-sm">
                  Select Token
                </label>
                <div className="flex space-x-2">
                  {TOKENS.map(token => (
                    <button
                      key={token}
                      type="button"
                      className={`flex-1 py-2 px-3 rounded-lg ${
                        modalToken === token
                          ? 'bg-amber-600 text-white'
                          : 'bg-indigo-800/50 text-amber-300 hover:bg-indigo-800/70'
                      } transition-all`}
                      onClick={() => setModalToken(token)}
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-amber-300 mb-2 text-sm">
                  Enter amount to withdraw
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full py-3 px-4 bg-indigo-800/50 border border-amber-400/30 rounded-xl text-white text-xl placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-amber-300">
                    {modalToken}
                  </div>
                </div>
                {modalError && (
                  <p className="mt-2 text-red-400 text-sm">{modalError}</p>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-800/40 to-purple-800/40 border border-amber-400/30 rounded-xl text-white hover:shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-600/70 to-orange-600/70 rounded-xl text-white hover:shadow-[0_0_15px_-3px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center"
                >
                  {isProcessing ? (
                    <div className="w-6 h-6 border-t-2 border-white rounded-full animate-spin"></div>
                  ) : (
                    "Withdraw"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

const renderHelpModal = () => {
    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-purple-900/90 backdrop-blur-xl" />
        <div className="relative z-[2001] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 bg-gradient-to-br from-indigo-900/95 to-purple-900/95 backdrop-blur-3xl rounded-2xl border border-violet-500/30 shadow-[0_0_60px_-15px_rgba(167,139,250,0.7)]">
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${Math.random() * 10 + 5}px`,
                  height: `${Math.random() * 10 + 5}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  backgroundColor: `hsl(${Math.random() * 60 + 270}, 70%, 60%)`,
                  opacity: Math.random() * 0.3 + 0.1,
                  filter: 'blur(3px)',
                  animation: `float ${Math.random() * 20 + 10}s infinite ${i * 0.5}s`,
                  boxShadow: '0 0 15px 3px currentColor'
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400">
                Cosmic Vortex Guide
              </h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-2 text-violet-300 hover:text-white transition-all"
              >
                <XMarkIcon className="h-8 w-8" />
              </button>
            </div>

            <div className="space-y-8">
              <div className="p-6 bg-gradient-to-r from-indigo-800/40 to-purple-800/40 rounded-xl border border-violet-400/30 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-violet-300 mb-4">Welcome to VORT3X</h3>
                <p className="text-cyan-200 mb-4">
                  Embark on a cosmic journey through the Vortex, where fortunes shift like nebulae and luck flows like stardust.
                  Choose your path through the cosmic realms of chance:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* On-Chain Mode */}
                  <div className="p-5 bg-gradient-to-br from-cyan-900/30 to-emerald-900/30 rounded-xl border border-cyan-500/30">
                    <div className="flex items-center mb-4">
                      <div className="w-4 h-4 rounded-full bg-cyan-400 mr-3 shadow-[0_0_10px_3px_rgba(56,189,248,0.8)]"></div>
                      <h4 className="text-lg font-bold text-cyan-300">Stellar On-Chain Mode</h4>
                    </div>
                    <ul className="space-y-3 text-cyan-200">
                      <li className="flex items-start">
                        <span className="text-cyan-400 mr-2">✦</span>
                        Spin using tokens from your MiniPay wallet
                      </li>
                      <li className="flex items-start">
                        <span className="text-cyan-400 mr-2">✦</span>
                        Select your cosmic token and wager amount
                      </li>
                      <li className="flex items-start">
                        <span className="text-cyan-400 mr-2">✦</span>
                        If the cosmic forces interfere (transaction fails), your tokens are safely credited to your off-chain nebula
                      </li>
                      <li className="flex items-start">
                        <span className="text-cyan-400 mr-2">✦</span>
                        Direct interaction with the blockchain cosmos
                      </li>
                    </ul>
                  </div>
                  
                  {/* Off-Chain Mode */}
                  <div className="p-5 bg-gradient-to-br from-amber-900/30 to-orange-900/30 rounded-xl border border-amber-500/30">
                    <div className="flex items-center mb-4">
                      <div className="w-4 h-4 rounded-full bg-amber-400 mr-3 shadow-[0_0_10px_3px_rgba(245,158,11,0.8)]"></div>
                      <h4 className="text-lg font-bold text-amber-300">Nebula Off-Chain Mode</h4>
                    </div>
                    <ul className="space-y-3 text-amber-200">
                      <li className="flex items-start">
                        <span className="text-amber-400 mr-2">✦</span>
                        First, deposit tokens into your cosmic off-chain nebula
                      </li>
                      <li className="flex items-start">
                        <span className="text-amber-400 mr-2">✦</span>
                        Use your nebula balance to spin through the cosmos
                      </li>
                      <li className="flex items-start">
                        <span className="text-amber-400 mr-2">✦</span>
                        Spin as many times as your cosmic balance allows
                      </li>
                      <li className="flex items-start">
                        <span className="text-amber-400 mr-2">✦</span>
                        Lightning-fast cosmic spins without blockchain delays
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-r from-indigo-800/40 to-purple-800/40 rounded-xl border border-violet-400/30 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-violet-300 mb-4">Cosmic Withdrawals</h3>
                <p className="text-cyan-200 mb-4">
                  Retrieve your cosmic winnings from the nebula back to your wallet galaxy:
                </p>
                <ul className="space-y-3 text-cyan-200">
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✦</span>
                    Withdraw tokens from your off-chain nebula at any time
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✦</span>
                    On-chain withdrawals may fall back to off-chain if cosmic interference occurs
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✦</span>
                    Failed on-chain spins automatically credit your off-chain nebula
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-gradient-to-r from-indigo-800/40 to-purple-800/40 rounded-xl border border-violet-400/30 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-violet-300 mb-4">Cosmic Support</h3>
                <p className="text-pink-200 mb-4">
                  Need guidance through the cosmic vortex? Join our celestial community:
                </p>
                <a 
                  href="https://t.me/+gBQvwvV1AUFkMzU0" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-600/70 to-purple-600/70 rounded-xl text-white hover:shadow-[0_0_20px_-5px_rgba(236,72,153,0.5)] transition-all"
                >
                  <span>Join Our Cosmic Telegram</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-[300] space-y-2">
        {toasts.map(toast => {
          let bgColor, borderColor;
          switch (toast.type) {
            case 'success':
              bgColor = 'from-emerald-800/80 to-emerald-900/80';
              borderColor = 'border-emerald-400/30';
              break;
            case 'error':
              bgColor = 'from-red-800/80 to-red-900/80';
              borderColor = 'border-red-400/30';
              break;
            default:
              bgColor = 'from-indigo-800/80 to-purple-800/80';
              borderColor = 'border-cyan-400/30';
          }
          
          return (
            <div 
              key={toast.id}
              className={`px-4 py-3 bg-gradient-to-r ${bgColor} backdrop-blur-sm rounded-xl border ${borderColor} text-white shadow-lg animate-fadeIn`}
            >
              {toast.message}
            </div>
          )
        })}
      </div>

      <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-indigo-900/70 to-purple-900/70 backdrop-blur-xl shadow-2xl border-b border-indigo-500/30">
        <div className="flex items-center justify-between h-16 px-6">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 text-cyan-300 hover:text-white transition-all transform hover:scale-110"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 tracking-wider">
            VORT3X
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex">
          <div 
            className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-purple-900/90 backdrop-blur-2xl"
            onClick={() => setIsOpen(false)}
          />

          <div 
            className="relative z-[1001] w-80 bg-gradient-to-br from-indigo-900/95 to-purple-900/95 backdrop-blur-3xl shadow-[0_0_80px_-20px_rgba(192,132,252,0.7)] border-r border-cyan-500/30 p-6 flex flex-col transform transition-all duration-500"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
              boxShadow: '0 0 80px -20px rgba(139, 92, 246, 0.9), 0 0 60px -15px rgba(192, 132, 252, 0.6) inset'
            }}
          >
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(15)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: `${Math.random() * 10 + 2}px`,
                    height: `${Math.random() * 10 + 2}px`,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    backgroundColor: `hsl(${Math.random() * 60 + 240}, 70%, 60%)`,
                    opacity: Math.random() * 0.4 + 0.1,
                    filter: 'blur(2px)',
                    animation: `float ${Math.random() * 20 + 10}s infinite ${i * 0.5}s`,
                    boxShadow: '0 0 10px 2px currentColor'
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <button
                onClick={() => setIsOpen(false)}
                className="self-end p-2 text-cyan-300 hover:text-white transition-all transform hover:scale-110 bg-indigo-800/30 rounded-full border border-cyan-400/30 backdrop-blur-sm"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div 
              onClick={fetchBalances}
              className="relative z-10 mt-6 mb-8 text-center p-6 bg-gradient-to-r from-indigo-800/50 to-purple-800/50 rounded-xl border border-cyan-400/30 backdrop-blur-sm overflow-hidden cursor-pointer hover:shadow-[0_0_20px_-5px_rgba(56,189,248,0.5)] transition-all group"
            >
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
              <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse-slow"></div>

              {loadingBalance ? (
                <div className="flex justify-center items-center">
                  <div className="w-8 h-8 border-t-2 border-cyan-400 rounded-full animate-spin"></div>
                </div>
              ) : offchainBalances.length === 0 ? (
                <div className="text-cyan-300 group-hover:text-white transition-colors">
                  No offchain balances
                  <div className="text-sm mt-2">Click to refresh</div>
                </div>
              ) : selectedToken ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <button 
                      className="w-8 h-8 rounded-full bg-indigo-800/50 flex items-center justify-center text-cyan-300 hover:text-white transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTokenChange('prev');
                      }}
                      disabled={offchainBalances.length < 2}
                    >
                      &larr;
                    </button>
                    <div className="text-sm text-cyan-300 group-hover:text-white transition-colors">
                      Offchain Balance
                    </div>
                    <button 
                      className="w-8 h-8 rounded-full bg-indigo-800/50 flex items-center justify-center text-cyan-300 hover:text-white transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTokenChange('next');
                      }}
                      disabled={offchainBalances.length < 2}
                    >
                      &rarr;
                    </button>
                  </div>
                  
                  <div className="text-3xl font-bold text-white tracking-wide drop-shadow-[0_0_15px_rgba(56,189,248,0.8)] group-hover:drop-shadow-[0_0_20px_rgba(56,189,248,0.9)] transition-all">
                    {formatBalance(selectedToken.balance, selectedToken.decimals)}
                  </div>
                  <div className="mt-2 text-lg text-cyan-400 font-medium">
                    {selectedToken.symbol}
                  </div>
                  <div className="mt-1 text-xs text-cyan-300 opacity-80">
                    Click to refresh • {new Date(lastRefresh).toLocaleTimeString()}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                </>
              ) : null}
            </div>

            {/* Token selector bubbles */}
            {offchainBalances.length > 1 && (
              <div className="relative z-10 mb-6 flex justify-center space-x-3">
                {offchainBalances.map((token, index) => (
                  <button
                    key={token.symbol}
                    onClick={() => setSelectedToken(token)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      selectedToken?.symbol === token.symbol
                        ? 'bg-cyan-400 scale-125 shadow-[0_0_10px_3px_rgba(56,189,248,0.7)]'
                        : 'bg-cyan-800 opacity-60'
                    }`}
                  />
                ))}
              </div>
            )}

            <nav className="relative z-10 flex-1 space-y-5">
              <Link href="/" onClick={() => setIsOpen(false)}>
                <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-800/40 to-purple-800/40 backdrop-blur-sm border border-cyan-400/20 text-white hover:shadow-[0_0_20px_-5px_rgba(192,132,252,0.5)] hover:border-cyan-400/50 transition-all transform hover:-translate-y-1 duration-300 flex items-center group">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 mr-3 shadow-[0_0_10px_3px_rgba(56,189,248,0.8)] group-hover:shadow-[0_0_15px_5px_rgba(56,189,248,0.9)] transition-all"></div>
                  Home
                </div>
              </Link>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setTimeout(() => setShowDepositModal(true), 300);
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-800/40 to-purple-800/40 backdrop-blur-sm border border-cyan-400/20 text-white hover:shadow-[0_0_20px_-5px_rgba(192,132,252,0.5)] hover:border-cyan-400/50 transition-all transform hover:-translate-y-1 duration-300 flex items-center group"
              >
                <div className="w-3 h-3 rounded-full bg-emerald-400 mr-3 shadow-[0_0_10px_3px_rgba(52,211,153,0.8)] group-hover:shadow-[0_0_15px_5px_rgba(52,211,153,0.9)] transition-all"></div>
                Deposit
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setTimeout(() => setShowWithdrawModal(true), 300);
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-800/40 to-purple-800/40 backdrop-blur-sm border border-cyan-400/20 text-white hover:shadow-[0_0_20px_-5px_rgba(192,132,252,0.5)] hover:border-cyan-400/50 transition-all transform hover:-translate-y-1 duration-300 flex items-center group"
              >
                <div className="w-3 h-3 rounded-full bg-amber-400 mr-3 shadow-[0_0_10px_3px_rgba(245,158,11,0.8)] group-hover:shadow-[0_0_15px_5px_rgba(245,158,11,0.9)] transition-all"></div>
                Withdraw
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setTimeout(() => setShowHelpModal(true), 300);
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-800/40 to-purple-800/40 backdrop-blur-sm border border-cyan-400/20 text-white hover:shadow-[0_0_20px_-5px_rgba(192,132,252,0.5)] hover:border-cyan-400/50 transition-all transform hover:-translate-y-1 duration-300 flex items-center group"
              >
                <div className="w-3 h-3 rounded-full bg-violet-400 mr-3 shadow-[0_0_10px_3px_rgba(167,139,250,0.8)] group-hover:shadow-[0_0_15px_5px_rgba(167,139,250,0.9)] transition-all"></div>
                Help/Support
              </button>
            </nav>

            <div className="relative z-10 mt-auto pt-8">
              <div className="flex justify-center space-x-1">
                {[...Array(7)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-3 h-3 rounded-full bg-cyan-400 opacity-80"
                    style={{
                      animation: `float ${Math.random() * 6 + 4}s infinite ${i * 0.3}s`,
                      boxShadow: '0 0 12px 3px rgba(56, 189, 248, 0.9)'
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDepositModal && renderDepositModal()}
      {showWithdrawModal && renderWithdrawModal()}
      {showHelpModal && renderHelpModal()}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(10deg); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

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
import { BigNumber } from "ethers";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [offchainBalance, setOffchainBalance] = useState<string>("_");
  const [onchainBalance, setOnchainBalance] = useState<string>("0.0");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const { address, getUserAddress, sendToken, checkBalanceForTx, getTokenBalance } = useWeb3();
  const { connect } = useConnect();
  
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalError, setModalError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [toasts, setToasts] = useState<{id: number, message: string, type: 'success' | 'error' | 'info'}[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum?.isMiniPay) {
      connect({ connector: injected() });
    }
  }, [connect]);

  useEffect(() => {
    if ((showDepositModal || showWithdrawModal) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showDepositModal, showWithdrawModal]);

  const fetchBalances = async () => {
    if (!address) return;
    
    setLoadingBalance(true);
    try {
      const user = await getUserAddress();
      
      // Fetch offchain balance
      const resp = await getOffchainBalance(user);
      const rawCusdString = formatUnits(resp.balance, 18);
        prompt(`_____:${rawCusdString}`);
      const cusdTwoDecimals = Number(rawCusdString).toFixed(2);
      setOffchainBalance(cusdTwoDecimals);
      
      // Fetch onchain balance
      const token = {
        symbol: "cUSD",
        address: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
        decimals: 18,
        abi: null
      };
      const balance = await getTokenBalance(user, token);
      const formatted = formatUnits(balance, 18);
      const [intPart, decPart] = formatted.split('.');
      setOnchainBalance(`${intPart}.${decPart.slice(0, 2)}`);
      
    } catch (err) {
      setOffchainBalance("_");
      setOnchainBalance("0.0");
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
        const hash = await sendToken(VortexAddress, amount);
        await depositOffchain({
          userAddress: user,
          value: parseUnits(amount, 18).toString(),
          hash,
        });
        await fetchBalances();
        setShowDepositModal(false);
        setAmount("");
        addToast("Deposit successful!", "success");
      } catch (e: any) {
        const errorMsg = e.message || "Deposit failed";
        setModalError(errorMsg);
        addToast(errorMsg, "error");
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      <div 
      className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-purple-900/90 backdrop-blur-xl"
      onClick={() => setShowDepositModal(false)}
      />

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
      Deposit CUSD
      </h2>
      <button
      onClick={() => setShowDepositModal(false)}
      className="p-2 text-cyan-300 hover:text-white transition-all"
      >
      <XMarkIcon className="h-6 w-6" />
      </button>
      </div>

      <form onSubmit={handleSubmit}>
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
      CUSD
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
        await checkBalanceForTx(user, amount, VortexAddress);
        const hash = await sendToken(user, amount);
        await withdrawOffchain({
          userAddress: user,
          value: parseUnits(amount, 18).toString(),
          hash,
        });
        await fetchBalances();
        setShowWithdrawModal(false);
        setAmount("");
        addToast("Withdrawal successful!", "success");
      } catch (e: any) {
        const errorMsg = e.message || "Withdrawal failed";
        setModalError(errorMsg);
        addToast(errorMsg, "error");
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      <div 
      className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-purple-900/90 backdrop-blur-xl"
      onClick={() => setShowWithdrawModal(false)}
      />

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
      Withdraw CUSD
      </h2>
      <button
      onClick={() => setShowWithdrawModal(false)}
      className="p-2 text-amber-300 hover:text-white transition-all"
      >
      <XMarkIcon className="h-6 w-6" />
      </button>
      </div>

      <form onSubmit={handleSubmit}>
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
      CUSD
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
        ) : (
        <>
        <div className="text-sm text-cyan-300 mb-1 group-hover:text-white transition-colors">
        Offchain Balance
        </div>
        <div className="text-3xl font-bold text-white tracking-wide drop-shadow-[0_0_15px_rgba(56,189,248,0.8)] group-hover:drop-shadow-[0_0_20px_rgba(56,189,248,0.9)] transition-all">
        {offchainBalance} CUSD
        </div>
        <div className="mt-2 text-sm text-cyan-200 opacity-80">
        Onchain: {onchainBalance} CUSD
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
        </>
        )}
        </div>

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

        <Link href="/help" onClick={() => setIsOpen(false)}>
        <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-800/40 to-purple-800/40 backdrop-blur-sm border border-cyan-400/20 text-white hover:shadow-[0_0_20px_-5px_rgba(192,132,252,0.5)] hover:border-cyan-400/50 transition-all transform hover:-translate-y-1 duration-300 flex items-center group">
        <div className="w-3 h-3 rounded-full bg-violet-400 mr-3 shadow-[0_0_10px_3px_rgba(167,139,250,0.8)] group-hover:shadow-[0_0_15px_5px_rgba(167,139,250,0.9)] transition-all"></div>
        Help/Support
        </div>
        </Link>
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
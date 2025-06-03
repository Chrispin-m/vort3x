"use client";

import React, { useState, useEffect } from "react";
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

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [offchainBalance, setOffchainBalance] = useState<string>("0.0");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const { address, getUserAddress, sendToken, checkBalanceForTx } = useWeb3();
  const { connect } = useConnect();

  // Auto-connect to MiniPay when detected
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum?.isMiniPay) {
      connect({ connector: injected() });
    }
  }, [connect]);

  useEffect(() => {
    async function fetchOffchain() {
      setLoadingBalance(true);
      try {
        const user = await getUserAddress();
        const resp = await getOffchainBalance(user);
        const cusd = formatUnits(BigInt(resp.balance), 18);
        setOffchainBalance(cusd);
      } catch {
        setOffchainBalance("0.0");
      } finally {
        setLoadingBalance(false);
      }
    }
    
    if (address) {
      fetchOffchain();
      const id = setInterval(fetchOffchain, 15000);
      return () => clearInterval(id);
    }
  }, [address, getUserAddress]);

  const handleDeposit = async () => {
    const amt = prompt("Enter amount to deposit (CUSD):");
    if (!amt || isNaN(Number(amt)) || Number(amt) <= 0) return;
    
    try {
      const user = await getUserAddress();
      await checkBalanceForTx(user, amt, VortexAddress);
      const hash = await sendToken(VortexAddress, amt);
      await depositOffchain({
        userAddress: user,
        value: parseUnits(amt, 18).toString(),
        hash,
      });
      const resp = await getOffchainBalance(user);
      setOffchainBalance(formatUnits(BigInt(resp.balance), 18));
    } catch (e: any) {
      alert(e.message || "Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    const amt = prompt("Enter amount to withdraw (CUSD):");
    if (!amt || isNaN(Number(amt)) || Number(amt) <= 0) return;
    
    try {
      const user = await getUserAddress();
      await checkBalanceForTx(user, amt, VortexAddress);
      const hash = await sendToken(user, amt);
      await withdrawOffchain({
        userAddress: user,
        value: parseUnits(amt, 18).toString(),
        hash,
      });
      alert("Withdrawal requested");
    } catch (e: any) {
      alert(e.message || "Withdraw failed");
    }
  };

  return (
    <>
      {/* Floating Navbar */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-indigo-900/70 to-purple-900/70 backdrop-blur-xl rounded-xl shadow-2xl border border-indigo-500/30">
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
            {/* Floating particles background */}
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
            
            {/* Close button with enhanced glow */}
            <div className="relative z-10">
              <button
                onClick={() => setIsOpen(false)}
                className="self-end p-2 text-cyan-300 hover:text-white transition-all transform hover:scale-110 bg-indigo-800/30 rounded-full border border-cyan-400/30 backdrop-blur-sm"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="relative z-10 mt-6 mb-8 text-center p-6 bg-gradient-to-r from-indigo-800/50 to-purple-800/50 rounded-xl border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
              <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse-slow"></div>
              
              {loadingBalance ? (
                <div className="flex justify-center items-center">
                  <div className="w-8 h-8 border-t-2 border-cyan-400 rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <div className="text-sm text-cyan-300 mb-1">Offchain Balance</div>
                  <div className="text-3xl font-bold text-white tracking-wide drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]">
                    {offchainBalance} CUSD
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                </>
              )}
            </div>
            
            {/* Navigation with enhanced floating effect */}
            <nav className="relative z-10 flex-1 space-y-5">
              <Link href="/" onClick={() => setIsOpen(false)}>
                <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-800/40 to-purple-800/40 backdrop-blur-sm border border-cyan-400/20 text-white hover:shadow-[0_0_20px_-5px_rgba(192,132,252,0.5)] hover:border-cyan-400/50 transition-all transform hover:-translate-y-1 duration-300 flex items-center group">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 mr-3 shadow-[0_0_10px_3px_rgba(56,189,248,0.8)] group-hover:shadow-[0_0_15px_5px_rgba(56,189,248,0.9)] transition-all"></div>
                  Home
                </div>
              </Link>
              
              <button
                onClick={handleDeposit}
                className="w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-800/40 to-purple-800/40 backdrop-blur-sm border border-cyan-400/20 text-white hover:shadow-[0_0_20px_-5px_rgba(192,132,252,0.5)] hover:border-cyan-400/50 transition-all transform hover:-translate-y-1 duration-300 flex items-center group"
              >
                <div className="w-3 h-3 rounded-full bg-emerald-400 mr-3 shadow-[0_0_10px_3px_rgba(52,211,153,0.8)] group-hover:shadow-[0_0_15px_5px_rgba(52,211,153,0.9)] transition-all"></div>
                Deposit
              </button>
              
              <button
                onClick={handleWithdraw}
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
            
            {/* Floating particles footer */}
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

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(10deg); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </>
  );
}